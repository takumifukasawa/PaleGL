import { Actor } from '@/PaleGL/actors/actor.ts';
import {
    beforeRenderActor,
    fixedUpdateActor, isActorEnabledInHierarchy,
    lastUpdateActor,
    setSizeActor,
    updateActor,
    updateActorTransform,
} from '@/PaleGL/actors/actorBehaviours.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { GpuParticle } from '@/PaleGL/actors/particles/gpuParticle.ts';
import {
    ACTOR_TYPE_CAMERA,
    ACTOR_TYPE_MESH,
    ACTOR_TYPE_SKYBOX,
    MESH_TYPE_GPU_PARTICLE,
    MESH_TYPE_GPU_TRAIL_PARTICLE,
} from '@/PaleGL/constants';
import {
    createSharedTextures,
    renderSharedTextures,
    SharedTextures,
    SharedTexturesType,
} from '@/PaleGL/core/createSharedTextures.ts';
import { EffectTextureSystem } from '@/PaleGL/core/effectTexture.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import {
    beforeRenderRenderer,
    checkNeedsBindUniformBufferObjectToMaterial,
    Renderer,
    renderMesh,
    setRendererSize,
    setRendererStats,
    tryStartMaterial,
} from '@/PaleGL/core/renderer.ts';
import { Scene, traverseScene } from '@/PaleGL/core/scene.ts';
import { setRotation, setTranslation } from '@/PaleGL/core/transform.ts';
import { createQuaternionFromEulerDegrees } from '@/PaleGL/math/quaternion.ts';
import { cloneRotator, createRotatorFromQuaternion, Rotator } from '@/PaleGL/math/rotator.ts';
import { cloneVector3, createVector3, createVector3One, Vector3 } from '@/PaleGL/math/vector3.ts';
import { isDevelopment } from '@/PaleGL/utilities/envUtilities.ts';
import { clearStats, createStats, Stats, updateStats } from '@/PaleGL/utilities/stats.ts';
import {
    createTimeAccumulator,
    execTimeAccumulator,
    startTimeAccumulator,
    TimeAccumulator,
} from '@/PaleGL/utilities/timeAccumulator.ts';
import { createTimeSkipper, execTimeSkipper, startTimeSkipper, TimeSkipper } from '@/PaleGL/utilities/timeSkipper.ts';
import { wait } from '@/PaleGL/utilities/wait.ts';

type EngineOnStartCallbackArgs = void;

type EngineOnBeforeFixedUpdateCallbackArgs = {
    fixedTime: number;
    fixedDeltaTime: number;
};

type EngineOnBeforeUpdateCallbackArgs = {
    time: number;
    deltaTime: number;
};

type EngineOnLastUpdateCallbackArgs = {
    time: number;
    deltaTime: number;
};

export type EngineOnBeforeStartCallback = () => void;
export type EngineOnStartCallback = (args: EngineOnStartCallbackArgs) => void;
export type EngineOnAfterStartCallback = () => void;
export type EngineOnBeforeFixedUpdateCallback = (args: EngineOnBeforeFixedUpdateCallbackArgs) => void;
export type EngineOnBeforeUpdateCallback = (args: EngineOnBeforeUpdateCallbackArgs) => void;
export type EngineOnLastUpdateCallback = (args: EngineOnLastUpdateCallbackArgs) => void;

export type EngineOnBeforeRender = (time: number, deltaTime: number) => void;
export type EngineOnRenderCallback = (time: number, deltaTime: number) => void;

export type EngineBase = {
    stats: Stats | null;
    scene: Scene | null;
    sharedTextures: SharedTextures;
    // sharedQuad: PlaneGeometry;
    renderer: Renderer;
    onBeforeStart: EngineOnBeforeStartCallback[];
    onAfterStart: EngineOnAfterStartCallback[];
    onBeforeUpdate: EngineOnBeforeUpdateCallback[];
    onBeforeFixedUpdate: EngineOnBeforeFixedUpdateCallback[];
    onLastUpdate: EngineOnLastUpdateCallback[];
    onBeforeRender: EngineOnBeforeRender[];
    onRender: EngineOnRenderCallback[];
    // uiCamera: OrthographicCamera | null;
};

export type Engine = EngineBase & {
    fixedUpdateFrameTimer: TimeAccumulator;
    updateFrameTimer: TimeSkipper;
};

export type EngineArgs = {
    gpu: Gpu;
    renderer: Renderer;
    fixedUpdateFps?: number;
    updateFps?: number;
    showStats?: boolean;
    showPipeline?: boolean;
};

export function createEngine({
    gpu,
    renderer,
    fixedUpdateFps = 60,
    updateFps = 60,
    showStats = false,
    showPipeline = false,
}: EngineArgs): Engine {
    const sharedTextures: SharedTextures = createSharedTextures({ gpu, renderer });
    // const sharedQuad = createPlaneGeometry({ gpu });
    const stats = isDevelopment() ? createStats({ showStats, showPipeline }) : null;

    const engineBase: EngineBase = {
        sharedTextures,
        // sharedQuad,
        stats,
        renderer,
        scene: null,
        onBeforeStart: [],
        onAfterStart: [],
        onBeforeUpdate: [],
        onBeforeFixedUpdate: [],
        onLastUpdate: [],
        onBeforeRender: [],
        onRender: [],
        // uiCamera: null,
    };

    const fixedUpdateFrameTimer = createTimeAccumulator(fixedUpdateFps, (lastTime, deltaTime) =>
        fixedUpdateEngine(engineBase, lastTime, deltaTime)
    );
    const updateFrameTimer = createTimeSkipper(updateFps, (lastTime, deltaTime) => {
        updateEngine(engineBase, lastTime, deltaTime);
        renderEngine(engineBase, lastTime, deltaTime);
    });

    (engineBase as Engine).fixedUpdateFrameTimer = fixedUpdateFrameTimer;
    (engineBase as Engine).updateFrameTimer = updateFrameTimer;

    if (isDevelopment()) {
        setRendererStats(renderer, stats);
    }

    return engineBase as Engine;
}

export function getSharedTexture(engine: Engine, key: SharedTexturesType): EffectTextureSystem {
    if (!engine.sharedTextures.has(key)) {
        console.error('invalid shared texture key');
    }
    return engine.sharedTextures.get(key)!;
}

export function startEngine(engine: Engine) {
    for (let i = 0; i < engine.onBeforeStart.length; i++) {
        engine.onBeforeStart[i]();
    }
    const t = performance.now() / 1000;
    startTimeAccumulator(engine.fixedUpdateFrameTimer, t);
    startTimeSkipper(engine.updateFrameTimer, t);
    for (let i = 0; i < engine.onAfterStart.length; i++) {
        engine.onAfterStart[i]();
    }
}

export function setEngineSize(engine: Engine, width: number, height: number) {
    const rw = width * engine.renderer.pixelRatio;
    const rh = height * engine.renderer.pixelRatio;
    const w = Math.floor(rw);
    const h = Math.floor(rh);
    traverseScene(engine.scene!, (actor) => {
        setSizeActor(actor, w, h, engine.scene!.mainCamera, engine.scene!.uiCamera);
    });
    setRendererSize(engine.renderer, rw, rh);
}

function fixedUpdateEngine(engine: EngineBase, fixedTime: number, fixedDeltaTime: number) {
    for (let i = 0; i < engine.onBeforeFixedUpdate.length; i++) {
        engine.onBeforeFixedUpdate[i]({ fixedTime, fixedDeltaTime });
    }

    if (!engine.scene) {
        console.error('scene is not set');
        return;
    }

    traverseScene(engine.scene, (actor) => {
        fixedUpdateActor(actor, {
            gpu: engine.renderer.gpu,
            renderer: engine.renderer,
            scene: engine.scene!,
            fixedTime,
            fixedDeltaTime,
        });
    });
    // _scenes.forEach((scene) => {
    //     scene.traverse((actor) => actor.fixedUpdate({ gpu: _gpu, fixedTime, fixedDeltaTime }));
    // });

    // // TODO: updateだけでもいい？
    // // update all actors matrix
    // // TODO
    // // - scene 側でやった方がよい？
    // // - skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
    // // - やっぱりcomponentシステムにした方が良い気もする
    // _scene?.traverse((actor) => {
    //     updateActorTransform(actor);
    // });
    // // _scenes.forEach((scene) => {
    // //     scene.traverse((actor) => actor.updateTransform());
    // // });
}

function updateEngine(engine: EngineBase, time: number, deltaTime: number) {
        //
        // before update
        //

        for (let i = 0; i < engine.onBeforeUpdate.length; i++) {
            engine.onBeforeUpdate[i]({ time, deltaTime });
        }

        //
        // update and before render
        //

        if (!engine.scene) {
            console.error('scene is not set');
            return;
        }

        // 本当はあんまりgpu渡したくないけど、渡しちゃったほうがいろいろと楽
        // console.log(engine.scene,  engine.scene.children.map(a => a.name).join(","));
        // TODO: beforeRenderActorはレンダリングしないものも実行した方がいい？
        traverseScene(engine.scene, (actor) => {
            // if (!isActorEnabledInHierarchy(actor)) {
            //     return;
            // }
            updateActor(actor, {
                gpu: engine.renderer.gpu,
                renderer: engine.renderer,
                scene: engine.scene!,
                time,
                deltaTime,
            });
            switch (actor.type) {
                case ACTOR_TYPE_SKYBOX:
                case ACTOR_TYPE_MESH:
                    // case ActorTypes.UiActor:
                    // case ActorTypes.SkinnedMesh:
                    beforeRenderActor(actor, {
                        gpu: engine.renderer.gpu,
                        renderer: engine.renderer,
                        scene: engine.scene!,
                        time,
                        deltaTime,
                    });
                    const mesh = actor as Mesh;
                    mesh.materials.forEach((mat) => {
                        if (mat) {
                            checkNeedsBindUniformBufferObjectToMaterial(engine.renderer, mat);
                        }
                    });
                    mesh.depthMaterials.forEach((mat) => {
                        if (mat) {
                            checkNeedsBindUniformBufferObjectToMaterial(engine.renderer, mat);
                        }
                    });
                    break;
                default:
                    break;
            }
        });

        //
        // last update
        //

        for (let i = 0; i < engine.onLastUpdate.length; i++) {
            engine.onLastUpdate[i]({ time, deltaTime });
        }
        traverseScene(engine.scene, (actor) => {
            // if (!isActorEnabledInHierarchy(actor)) {
            //     return;
            // }
            lastUpdateActor(actor, {
                gpu: engine.renderer.gpu,
                renderer: engine.renderer,
                scene: engine.scene!,
                time,
                deltaTime,
            });
        });

        //
        // update transform
        //

        // 各種updateが終わったらtransformを整理
        // TODO: fixedupdateでもやっちゃってるのよくない
        traverseScene(engine.scene, (actor) => {
            // if (!isActorEnabledInHierarchy(actor)) {
            //     return;
            // }
            updateActorTransform(actor);
        });
}

// export function lastUpdateEngine(engine: Engine, time: number, deltaTime: number) {
//     if (!engine.scene) {
//         console.error('scene is not set');
//         return;
//     }
//     traverseScene(engine.scene, (actor) =>
//         lastUpdateActor(actor, {
//             gpu: engine.renderer.gpu,
//             renderer: engine.renderer,
//             scene: engine.scene!,
//             time,
//             deltaTime,
//         })
//     );
// }

function renderEngine(engine: EngineBase, time: number, deltaTime: number) {
    // for debug
    // console.log(`[Engine.render]`);

    if (isDevelopment() && engine.stats) {
        clearStats(engine.stats);
    }

    for (let i = 0; i < engine.onBeforeRender.length; i++) {
        engine.onBeforeRender[i](time, deltaTime);
    }

    beforeRenderRenderer(engine.renderer, time, deltaTime);

    renderSharedTextures(engine.renderer, engine.sharedTextures);

    // 実際にrenderされる場所。rendererのrender自体は親から登録して呼ぶ
    for (let i = 0; i < engine.onRender.length; i++) {
        engine.onRender[i](time, deltaTime);
    }

    // TODO: ここにrenderer.renderを書く
    // _renderer.renderScene(_scene!);

    if (isDevelopment() && engine.stats) {
        updateStats(engine.stats, time);
    }
}

export async function warmRender(
    engine: Engine,
    waitTime: number = 16,
    onRenderActor?: (actor: Actor, index: number, total: number) => void
) {
    if (!engine.scene) {
        console.error('scene is not set');
        return;
    }

    // 最初に一回engineを空回し
    fixedUpdateEngine(engine, 0, 0);
    updateEngine(engine, 0, 0);

    const actors: Actor[] = [];
    const actorOriginalEnabled = new Map<Actor, boolean>();
    const actorOriginalPosition = new Map<Actor, Vector3>();
    const actorOriginalRotation = new Map<Actor, Rotator>();

    // すべてのアクター（カメラ以外）を収集し、enabled状態を保存
    traverseScene(engine.scene, (actor) => {
        if (actor.type !== ACTOR_TYPE_CAMERA) {
            actors.push(actor);
            actorOriginalEnabled.set(actor, actor.enabled);
        }
    });

    // メッシュのみを抽出
    const meshes = actors.filter(
        (actor) => actor.type === ACTOR_TYPE_MESH || actor.type === ACTOR_TYPE_SKYBOX
    ) as Mesh[];

    // mainCameraの存在確認と元の位置/回転を保存
    const mainCamera = engine.scene.mainCamera;
    if (!mainCamera) {
        console.error('mainCamera is not set');
        return;
    }
    const cameraOriginalPosition = cloneVector3(mainCamera.transform.position);
    const cameraOriginalRotation = cloneRotator(mainCamera.transform.rotation);

    // 各meshの元の位置/回転を保存
    meshes.forEach((mesh) => {
        actorOriginalPosition.set(mesh, cloneVector3(mesh.transform.position));
        actorOriginalRotation.set(mesh, cloneRotator(mesh.transform.rotation));
    });

    // すべてのアクターを無効化
    actors.forEach((actor) => {
        actor.enabled = false;
    });

    const renderer = engine.renderer;
    const gpu = renderer.gpu;

    // 共通ユニフォームを更新
    beforeRenderRenderer(renderer, 0, 0);

    // 各メッシュを1つずつcompile ---

    for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i];
        mesh.enabled = true;

        // 一応actorごとにupdate走らせる
        updateActor(mesh, {
            gpu,
            renderer,
            scene: engine.scene,
            time: 0,
            deltaTime: 0,
        });

        // 一応actorごとにbeforeRender走らせる
        beforeRenderActor(mesh, {
            gpu,
            renderer,
            scene: engine.scene,
            time: 0,
            deltaTime: 0,
        });

        // materials をレンダリング
        mesh.materials.forEach((material) => {
            if (material) {
                tryStartMaterial(gpu, renderer, mesh.geometry, material);
                checkNeedsBindUniformBufferObjectToMaterial(renderer, material);
                renderMesh(renderer, mesh.geometry, material);
            }
        });

        // depthMaterials をレンダリング
        mesh.depthMaterials.forEach((material) => {
            if (material) {
                tryStartMaterial(gpu, renderer, mesh.geometry, material);
                checkNeedsBindUniformBufferObjectToMaterial(renderer, material);
                renderMesh(renderer, mesh.geometry, material);
            }
        });

        // GpuParticle / GpuTrailParticle の updaters もレンダリング
        if (mesh.meshType === MESH_TYPE_GPU_PARTICLE || mesh.meshType === MESH_TYPE_GPU_TRAIL_PARTICLE) {
            const gpuParticle = mesh as GpuParticle;

            // updaterのマテリアルをコンパイルするため、全updaterを処理
            for (let j = 0; j < gpuParticle.updaters.length; j++) {
                const [initMaterial, updateMaterial] = gpuParticle.updaters[j];

                tryStartMaterial(gpu, renderer, renderer.sharedQuad, initMaterial);
                checkNeedsBindUniformBufferObjectToMaterial(renderer, initMaterial);

                tryStartMaterial(gpu, renderer, renderer.sharedQuad, updateMaterial);
                checkNeedsBindUniformBufferObjectToMaterial(renderer, updateMaterial);
            }
        }

        mesh.enabled = false;

        if (onRenderActor) {
            onRenderActor(mesh, i, meshes.length);
        }

        await wait(waitTime);
    }

    // 中央において描画 ---

    // カメラを中央に向かせる
    setTranslation(mainCamera.transform, createVector3(0, 0, 10));
    mainCamera.transform.lookAtTarget = createVector3One();
    fixedUpdateEngine(engine, 0, 0);
    updateEngine(engine, 0, 0);
    renderEngine(engine, 0, 0);

    for (let i = 0; i < meshes.length; i++) {
        // for debug
        // console.log('===========');

        const mesh = meshes[i];
        mesh.enabled = true;
        setTranslation(mesh.transform, createVector3(0, 0, 0));
        setRotation(mesh.transform, createRotatorFromQuaternion(createQuaternionFromEulerDegrees(0, 0, 0)));

        // for debug
        // console.log('hogehoge target actor', mesh.name);

        // fixedUpdateEngine(engine, 0, 0);
        // updateEngine(engine, 0, 0);
        // renderだけ行う
        renderEngine(engine, 0, 0);

        mesh.enabled = false;
        await wait(waitTime);
    }

    // カメラと全メッシュの位置/回転を復元
    setTranslation(mainCamera.transform, cameraOriginalPosition);
    setRotation(mainCamera.transform, cameraOriginalRotation);
    mainCamera.transform.lookAtTarget = null;
    meshes.forEach((mesh) => {
        setTranslation(mesh.transform, actorOriginalPosition.get(mesh)!);
        setRotation(mesh.transform, actorOriginalRotation.get(mesh)!);
    });

    // ---

    // すべてのアクターの enabled 状態を復元
    actors.forEach((actor) => {
        actor.enabled = actorOriginalEnabled.get(actor)!;
    });

    // 元の状態を反映するため、renderer内のマテリアルも含めて最後に一回描画
    fixedUpdateEngine(engine, 0, 0);
    updateEngine(engine, 0, 0);
    renderEngine(engine, 0, 0);

    await wait(waitTime);
}

// time[sec]
export function runEngine(engine: Engine, time: number) {
    execTimeAccumulator(engine.fixedUpdateFrameTimer, time / 1000);
    execTimeSkipper(engine.updateFrameTimer, time / 1000);
}

export function setOnBeforeStartEngine(engine: Engine, cb: EngineOnBeforeStartCallback) {
    engine.onBeforeStart.push(cb);
}

export function setOnBeforeFixedUpdateEngine(engine: Engine, cb: EngineOnBeforeFixedUpdateCallback) {
    engine.onBeforeFixedUpdate.push(cb);
}

export function setOnBeforeUpdateEngine(engine: Engine, cb: EngineOnBeforeUpdateCallback) {
    engine.onBeforeUpdate.push(cb);
}

export function setOnRenderEngine(engine: Engine, cb: EngineOnRenderCallback) {
    engine.onRender.push(cb);
}

export function setSceneToEngine(engine: Engine, scene: Scene) {
    engine.scene = scene;
}
