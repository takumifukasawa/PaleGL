import {
    buildMarionetterScene,
    BuildMarionetterSceneFallbackGenerateActorHook,
    BuildMarionetterSceneGeneratedActorHook,
    buildMarionetterTimelineFromScene,
    resolveInvertRotationLeftHandAxisToRightHandAxis,
} from '@/Marionetter/buildMarionetterScene.ts';
import { createMarionetter } from '@/Marionetter/createMarionetter.ts';
import { initHotReloadAndParseScene } from '@/Marionetter/initHotReloadAndParseScene.ts';
import { snapToStep } from '@/Marionetter/timelineUtilities.ts';
import {
    Marionetter,
    MarionetterReceiveSceneViewData,
    MarionetterReceiveSceneViewEnabledData,
    MarionetterScene,
    MarionetterSceneStructure,
} from '@/Marionetter/types';
import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
import { setCameraPostProcess } from '@/PaleGL/actors/cameras/cameraBehaviours.ts';
import { createPerspectiveCamera, PerspectiveCamera } from '@/PaleGL/actors/cameras/perspectiveCamera.ts';
import {
    createEngine,
    Engine,
    runEngine,
    setEngineSize,
    setOnBeforeUpdateEngine,
    setOnRenderEngine,
    setSceneToEngine,
    startEngine,
    warmRender,
} from '@/PaleGL/core/engine.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
// import {
//     createOrbitCameraController,
//     fixedUpdateOrbitCameraController,
//     setOrbitCameraControllerDelta,
//     startOrbitCameraController,
// } from '@/PaleGL/core/orbitCameraController.ts';
import {
    createRenderer,
    // hotRebuildRenderer,
    Renderer,
    renderRenderer,
    updateTimelineUniforms,
} from '@/PaleGL/core/renderer.ts';
import {
    addActorToScene,
    createScene,
    createSceneUICamera,
    findActorByName,
    Scene,
    setMainCamera,
    traverseScene,
} from '@/PaleGL/core/scene.ts';
import { PostProcess } from '@/PaleGL/postprocess/postProcess.ts';
import {
    getSoundCurrentTime,
    GLSLSoundWrapper,
    playSound,
    stopSound,
} from '@/PaleGL/utilities/createGLSLSoundWrapper.ts';
import { clamp } from '@/PaleGL/utilities/mathUtilities.ts';
import { setRotation, setTranslation } from '@/PaleGL/core/transform.ts';
import { createRotatorFromQuaternion } from '@/PaleGL/math/rotator.ts';
import { createQuaternion } from '@/PaleGL/math/quaternion.ts';
import { CAMERA_TYPE_PERSPECTIVE } from '@/PaleGL/constants.ts';
import { createVector3 } from '@/PaleGL/math/vector3.ts';
import { disposeActor } from '@/PaleGL/actors/actorBehaviours.ts';
import { isDevelopment } from '@/PaleGL/utilities/envUtilities.ts';

// const HOT_REBUILD_SCENE = false;

export type Player = {
    gpu: Gpu;
    engine: Engine;
    scene: Scene;
    renderer: Renderer;
    camera: Camera | null;
    // onResize?: (width: number, height: number) => void;
    isPlaying: boolean;
    loop: boolean;
    timelineTime: number;
    timelinePrevTime: number;
    timelineDeltaTime: number;
    currentTimeForTimeline: number;
    glslSoundWrapper: GLSLSoundWrapper | null;
    marionetter: Marionetter | null;
    marionetterSceneStructure: MarionetterSceneStructure | null;
    timelineDuration: number;
    hotRebuildSceneEnabled: boolean;
    onHotReload?: (hotReload: boolean) => Promise<void>;
};

// let isOrbitCameraEnabled = false;
let isSceneViewCameraEnabled = false;
// let orbitCameraEntity: Camera | null = null;
let cachedPlayerCamera: Camera | null = null;
let sceneViewCameraEntity: Camera | null = null;

export function createPlayer(
    gpu: Gpu,
    canvasElement: HTMLCanvasElement,
    pixelRatio: number,
    sceneJson: string,
    hotReloadJsonUrl: string,
    onHotReload: (hotReload: boolean) => Promise<void>,
    // inputController: InputController,
    cameraPostProcess: PostProcess,
    options: {
        fallbackGenerateActorHook?: BuildMarionetterSceneFallbackGenerateActorHook;
        generatedActorHook?: BuildMarionetterSceneGeneratedActorHook;
        timelineDuration?: number;
        hotRebuildSceneEnabled?: boolean;
        glslSoundWrapper?: GLSLSoundWrapper;
        loop?: boolean;
        onBeginPlayer?: () => void;
    } = {}
): Player {
    const {
        glslSoundWrapper,
        loop,
        timelineDuration,
        fallbackGenerateActorHook,
        generatedActorHook,
        hotRebuildSceneEnabled = false,
        onBeginPlayer,
    } = options;

    const renderer = createRenderer({
        gpu,
        canvas: canvasElement,
        pixelRatio,
    });

    const scene = createScene();

    const engine = createEngine({ gpu, renderer, showStats: true, showPipeline: true });

    setSceneToEngine(engine, scene);

    let marionetter: Marionetter | null = null;

    const player: Player = {
        gpu,
        engine,
        scene,
        renderer,
        camera: null,
        marionetter,
        marionetterSceneStructure: null,
        isPlaying: false,
        loop: !!loop,
        timelineTime: 0,
        timelinePrevTime: 0,
        timelineDeltaTime: 0,
        currentTimeForTimeline: 0,
        glslSoundWrapper: glslSoundWrapper || null,
        timelineDuration: 0,
        hotRebuildSceneEnabled,
        onHotReload,
    };

    if (isDevelopment()) {
        marionetter = createMarionetter({
            showLog: false,
            onPlay: (time: number) => {
                console.log(`[marionetter.onPlay] time: ${time}`);
                playMarionetter(player, time);
            },
            onSeek: (time: number) => {
                seekMarionetter(player, time);
            },
            onStop: () => {
                console.log(`[marionetter.onStop]`);
                stopMarionetter(player);
            },
            onSceneViewEnabled: (data: MarionetterReceiveSceneViewEnabledData) => {
                isSceneViewCameraEnabled = data.enabled;
                if (sceneViewCameraEntity && cachedPlayerCamera) {
                    setPlayerCamera(player, isSceneViewCameraEnabled ? sceneViewCameraEntity : cachedPlayerCamera);
                }
            },
            onSetSceneViewData: (data: MarionetterReceiveSceneViewData) => {
                if (sceneViewCameraEntity) {
                    sceneViewCameraEntity.near = data.cameraNear;
                    sceneViewCameraEntity.far = data.cameraFar;
                    if (sceneViewCameraEntity.cameraType === CAMERA_TYPE_PERSPECTIVE) {
                        (sceneViewCameraEntity as PerspectiveCamera).fov = data.cameraFov;
                    }
                    setTranslation(
                        sceneViewCameraEntity.transform,
                        createVector3(data.cameraPosition.x, data.cameraPosition.y, data.cameraPosition.z)
                    );
                    setRotation(
                        sceneViewCameraEntity.transform,
                        createRotatorFromQuaternion(
                            resolveInvertRotationLeftHandAxisToRightHandAxis(
                                createQuaternion(
                                    data.cameraRotation.x,
                                    data.cameraRotation.y,
                                    data.cameraRotation.z,
                                    data.cameraRotation.w
                                ),
                                sceneViewCameraEntity,
                                true
                            )
                        )
                    );
                }
            },
            onBeginPlayer: () => {
                if (onBeginPlayer) {
                    onBeginPlayer();
                }
            },
        });
    }

    const marionetterSceneStructure = buildScene(
        // prettier-ignore
        gpu,
        player,
        marionetter,
        JSON.parse(sceneJson) as unknown as MarionetterScene,
        // marionetterSceneStructure,
        // inputController,
        cameraPostProcess,
        true,
        fallbackGenerateActorHook,
        generatedActorHook
    );

    // for debug
    console.log('marionetterSceneStructure', marionetterSceneStructure);

    if (timelineDuration) {
        player.timelineDuration = timelineDuration;
    } else {
        if (marionetterSceneStructure.marionetterTimeline) {
            player.timelineDuration = marionetterSceneStructure.marionetterTimeline.duration;
        } else {
            console.error(`[marionetter] not specified timelineDuration not found`);
        }
    }

    if (import.meta.env.VITE_HOT_RELOAD === 'true' && isDevelopment()) {
        if (marionetter) {
            marionetter.connect();
            initHotReloadAndParseScene(hotReloadJsonUrl, marionetter, async (sceneJson) => {
                buildScene(
                    // prettier-ignore
                    gpu,
                    player,
                    marionetter,
                    sceneJson,
                    // inputController,
                    cameraPostProcess,
                    false,
                    fallbackGenerateActorHook,
                    generatedActorHook
                    // false,
                );
                await onHotReload(true);
            });
        }
    }

    setOnBeforeUpdateEngine(engine, ({ time, deltaTime }) => {
        beforeUpdatePlayer(player, time, deltaTime);
    });

    let isRenderEnabled = true;

    // window.addEventListener('keydown', (e) => {
    //     if (e.key === 'o') {
    //         isOrbitCameraEnabled = !isOrbitCameraEnabled;
    //         setPlayerCamera(player, isOrbitCameraEnabled ? orbitCameraEntity! : cachedPlayerCamera!);
    //     }
    // });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'p') {
            isRenderEnabled = !isRenderEnabled;
        }
    });

    setOnRenderEngine(engine, (time) => {
        updateTimelineUniforms(player.renderer, player.timelineTime, player.timelineDeltaTime);
        if (isRenderEnabled) {
            renderRenderer(renderer, scene, player.camera!, player.engine.sharedTextures, {
                time,
            });
        }
    });

    return player;
}

// TODO: 差分更新
function buildScene(
    gpu: Gpu,
    player: Player,
    marionetter: Marionetter | null,
    sceneJson: MarionetterScene,
    // inputController: InputController,
    cameraPostProcess: PostProcess,
    initialBuild: boolean,
    fallbackGenerateActorHook?: BuildMarionetterSceneFallbackGenerateActorHook,
    generatedActorHook?: BuildMarionetterSceneGeneratedActorHook
) {
    if (player.hotRebuildSceneEnabled || initialBuild) {
        // sceneを空にする
        traverseScene(player.scene, (actor) => {
            disposeActor(actor);
        });
        player.scene.children = [];
    }

    // marionetterを構築
    const structure = buildMarionetterScene(
        gpu,
        player.renderer,
        sceneJson,
        fallbackGenerateActorHook,
        generatedActorHook
    );

    console.log('structure', structure, initialBuild);

    // sceneをreflesh
    if (player.hotRebuildSceneEnabled || initialBuild) {
        const { actors } = structure;
        for (let i = 0; i < actors.length; i++) {
            addActorToScene(player.scene, actors[i]);
        }
    }

    // timelineにactorをbind
    structure.marionetterTimeline = buildMarionetterTimelineFromScene(sceneJson, player.scene.children);
    structure.marionetterTimeline?.bindActors(player.scene.children);

    // camera
    if (player.hotRebuildSceneEnabled || initialBuild) {
        const camera = findActorByName(player.scene.children, 'MainCamera') as Camera;
        setMainCamera(player.scene, camera);
        createSceneUICamera(player.scene);
        setCameraPostProcess(camera, cameraPostProcess);
        cachedPlayerCamera = camera;
    }

    if (player.hotRebuildSceneEnabled || initialBuild) {
        sceneViewCameraEntity = createSceneViewCamera(player, cameraPostProcess);
    }

    player.marionetter = marionetter;
    player.marionetterSceneStructure = structure;

    if (!cachedPlayerCamera || !sceneViewCameraEntity) {
        console.error('[marionetter] camera not found');
    } else {
        setPlayerCamera(player, isSceneViewCameraEnabled ? sceneViewCameraEntity : cachedPlayerCamera);
    }

    // console.log('hogehoge', player.scene);

    // if (player.hotRebuildSceneEnabled || initialBuild) {
    //     hotRebuildRenderer(player.renderer);
    // }

    return structure;
}

export function setPlayerCamera(player: Player, camera: Camera) {
    player.camera = camera;
}

export function resizePlayer(player: Player, width: number, height: number) {
    setEngineSize(player.engine, width, height);
}

export async function loadPlayer(
    player: Player,
    beforeCb: () => Promise<void> | (() => void),
    afterCb: () => Promise<void> | (() => void),
    onProgress?: (percent: number) => void
) {
    // await player.engine.war
    await beforeCb();
    await warmRender(player.engine, 16, (actor, index, total) => {
        if (onProgress) {
            // 50%から100%の範囲で進捗を更新
            const percent = 50 + ((index + 1) / total) * 50;
            onProgress(Math.floor(percent));
        }
    });
    await afterCb();
}

export function startPlayer(player: Player) {
    playMarionetter(player, 0);
    startEngine(player.engine);
}

export function runPlayer(player: Player, time: number) {
    runEngine(player.engine, time);
}

export function beforeUpdatePlayer(player: Player, _: number, deltaTime: number) {
    if (player.marionetterSceneStructure && player.marionetterSceneStructure.marionetterTimeline) {
        if (player.glslSoundWrapper) {
            if (player.glslSoundWrapper.isPlaying) {
                // 音源があるかつ再生中の場合は音源に従う
                // player.currentTimeForTimeline = getSoundCurrentTime(player.glslSoundWrapper);
                player.currentTimeForTimeline = getSoundCurrentTime(player.glslSoundWrapper);
            }
        } else {
            if (player.isPlaying) {
                // player.currentTimeForTimeline += deltaTime;
                player.currentTimeForTimeline += deltaTime;
            }
        }

        let ended = false;

        if (player.currentTimeForTimeline >= player.timelineDuration) {
            if (player.loop) {
                playMarionetter(player, 0);
            } else {
                ended = true;
            }
        }

        const currentTimeForTimeline = player.currentTimeForTimeline;
        const timelineTime = ended
            ? snapToStep(player.timelineDuration, 1 / 60) - 0.001
            : clamp(snapToStep(currentTimeForTimeline, 1 / 60), 0, player.timelineDuration);

        player.currentTimeForTimeline = currentTimeForTimeline;
        player.marionetterSceneStructure.marionetterTimeline.execute({
            time: timelineTime,
            scene: player.scene,
        });
        player.timelineTime = timelineTime;

        const timelinePrevTime = player.timelinePrevTime;
        const timelineDeltaTime = timelineTime - timelinePrevTime;

        player.timelineDeltaTime = timelineDeltaTime;
        player.timelinePrevTime = timelinePrevTime;
    }
}

// local -------------------------------------------

// 再生するときはここを呼ぶ
function playMarionetter(player: Player, time: number) {
    console.log(`[marionetter.playMarionetter] time: ${time}, has sound: ${!!player.glslSoundWrapper}`);
    if (player.glslSoundWrapper) {
        playSound(player.glslSoundWrapper, { time });
    }
    player.timelinePrevTime = player.currentTimeForTimeline;
    player.currentTimeForTimeline = time;
    player.timelineTime = time;
    player.isPlaying = true;
}

// seekするときはここを呼ぶ
function seekMarionetter(player: Player, time: number) {
    player.currentTimeForTimeline = time;
    if (player.glslSoundWrapper) {
        stopSound(player.glslSoundWrapper);
    }
    player.isPlaying = false;
}

// 停止するときはここを呼ぶ
function stopMarionetter(player: Player) {
    console.log(`[marionetter.stopMarionetter]`);
    if (player.glslSoundWrapper) {
        stopSound(player.glslSoundWrapper);
    }
    player.isPlaying = false;
}

function createSceneViewCamera(player: Player, cameraPostProcess: PostProcess) {
    // orbit camera の切り替え
    const entity = createPerspectiveCamera(70, 1, 0.1, 50, 'sceneViewCamera');
    addActorToScene(player.scene, entity);
    setCameraPostProcess(entity, cameraPostProcess);
    return entity;
}

// function createOrbitCamera(player: Player, inputController: InputController, cameraPostProcess: PostProcess) {
//     // window.addEventListener('resize', () => {
//     //     resizePlayer(player);
//     // });
// 
//     // orbit camera の切り替え
//     const entity = createPerspectiveCamera(70, 1, 0.1, 50, 'orbitCamera');
//     // const captureSceneCamera = findActorByName(player.scene.children, 'MainCamera')! as PerspectiveCamera;
//     const orbitCameraController = createOrbitCameraController(entity);
//     // for orbit camera
//     orbitCameraController.enabled = true;
//     orbitCameraController.distance = 5;
//     orbitCameraController.attenuation = 0.01;
//     orbitCameraController.dampingFactor = 0.2;
//     orbitCameraController.azimuthSpeed = 100;
//     orbitCameraController.altitudeSpeed = 100;
//     orbitCameraController.deltaAzimuthPower = 2;
//     orbitCameraController.deltaAltitudePower = 2;
//     orbitCameraController.maxAltitude = 5;
//     orbitCameraController.minAltitude = -45;
//     orbitCameraController.maxAzimuth = 55;
//     orbitCameraController.minAzimuth = -55;
//     orbitCameraController.defaultAzimuth = 10;
//     orbitCameraController.defaultAltitude = -10;
//     orbitCameraController.lookAtTarget = createVector3(0, 0, 0);
//     entity.onFixedUpdate.push(() => {
//         // 1: fixed position
//         // actor.transform.position = new Vector3(-7 * 1.1, 4.5 * 1.4, 11 * 1.2);
// 
//         // 2: orbit controls
//         // if (inputController.isDown && debuggerStates.orbitControlsEnabled) {
//         if (inputController.isDown && orbitCameraController.enabled) {
//             setOrbitCameraControllerDelta(orbitCameraController, v2o(inputController.deltaNormalizedInputPosition));
//         }
//         fixedUpdateOrbitCameraController(orbitCameraController);
//     });
//     startOrbitCameraController(orbitCameraController);
//     addActorToScene(player.scene, entity);
// 
//     setCameraPostProcess(entity, cameraPostProcess);
//     
//     return entity;
// }
