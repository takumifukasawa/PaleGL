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
import { createRenderer, Renderer, renderRenderer, updateTimelineUniforms } from '@/PaleGL/core/renderer.ts';
import { Marionetter, MarionetterScene, MarionetterSceneStructure } from '@/Marionetter/types';
import {
    getSoundCurrentTime,
    GLSLSoundWrapper,
    playSound,
    stopSound,
} from '@/PaleGL/utilities/createGLSLSoundWrapper.ts';
import { createMarionetter } from '@/Marionetter/createMarionetter.ts';
import { buildMarionetterScene } from '@/Marionetter/buildMarionetterScene.ts';
import { addActorToScene, createScene, findActorByName, Scene } from '@/PaleGL/core/scene.ts';
import { initHotReloadAndParseScene } from '@/Marionetter/initHotReloadAndParseScene.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { snapToStep } from '@/Marionetter/timelineUtilities.ts';
import { clamp } from '@/PaleGL/utilities/mathUtilities.ts';
import { Camera } from '@/PaleGL/actors/cameras/camera.ts';

type Player = {
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
    // onBeforeUpdate?: (time: number, deltaTime: number) => void;
};

export function createPlayer(
    gpu: Gpu,
    canvasElement: HTMLCanvasElement,
    pixelRatio: number,
    sceneJson: string,
    hotReloadJsonUrl: string,
    options: {
        timelineDuration?: number,
        glslSoundWrapper?: GLSLSoundWrapper;
        loop?: boolean;
    } = {}
): Player {
    const { glslSoundWrapper, loop, timelineDuration } = options;

    const renderer = createRenderer({
        gpu,
        canvas: canvasElement,
        pixelRatio,
    });

    const scene = createScene();

    const engine = createEngine({ gpu, renderer, showStats: true, showPipeline: true });

    setSceneToEngine(engine, scene);

    // const timelineTime: number = 0;
    // const timelinePrevTime: number = 0;
    // const timelineDeltaTime: number = 0;
    // let currentTimeForTimeline = 0;
    // let marionetterSceneStructure: MarionetterSceneStructure | null = null;
    // const glslSoundWrapper = initGLSLSound(gpu, soundVertexShader, SOUND_DURATION);
    
    const player: Player = {
        gpu,
        engine,
        scene,
        renderer,
        camera: null,
        marionetter: null,
        marionetterSceneStructure: null,
        isPlaying: false,
        loop: !!loop,
        timelineTime: 0,
        timelinePrevTime: 0,
        timelineDeltaTime: 0,
        currentTimeForTimeline: 0,
        glslSoundWrapper: glslSoundWrapper || null,
        timelineDuration: 0,
        // onResize: () => {},
    };

    const marionetter = createMarionetter({
        showLog: false,
        onPlay: (time: number) => {
            console.log(`[marionetter.onPlay] time: ${time}`);
            // glslSoundWrapper.play({ time });
            // currentTimeForTimeline = time;
            playMarionetter(player, time);
        },
        onSeek: (time: number) => {
            // console.log(`[marionetter.onSeek]`);
            // currentTimeForTimeline = time;
            // glslSoundWrapper.stop();
            seekMarionetter(player, time);
        },
        onStop: () => {
            console.log(`[marionetter.onStop]`);
            // glslSoundWrapper.stop();
            stopMarionetter(player);
        },
    });
    
    const marionetterSceneStructure = buildMarionetterScene(gpu, JSON.parse(sceneJson) as unknown as MarionetterScene);

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

    // timeline生成したらscene内のactorをbind
    const { actors } = marionetterSceneStructure;

    marionetterSceneStructure.marionetterTimeline?.bindActors(scene.children);
    for (let i = 0; i < actors.length; i++) {
        addActorToScene(scene, actors[i]);
    }

    if (import.meta.env.VITE_HOT_RELOAD === 'true') {
        marionetter.connect();
        // initHotReloadAndParseScene();
        initHotReloadAndParseScene(hotReloadJsonUrl, marionetter, marionetterSceneStructure, scene, (structure) => {
            player.marionetterSceneStructure = structure;
        });
    }

    const camera = findActorByName(player.scene.children, 'MainCamera') as Camera;

    player.marionetter = marionetter;
    player.marionetterSceneStructure = marionetterSceneStructure;
    player.camera = camera;

    setOnBeforeUpdateEngine(engine, ({ time, deltaTime }) => {
        // if (player.onBeforeUpdate) {
        //     player.onBeforeUpdate(time, deltaTime);
        // }
        beforeUpdatePlayer(player, time, deltaTime);
    });

    setOnRenderEngine(engine, (time) => {
        updateTimelineUniforms(player.renderer, player.timelineTime, player.timelineDeltaTime);
        renderRenderer(renderer, scene, camera, player.engine.sharedTextures, {
            time,
            // timelineTime,
            // timelineDeltaTime
        });
    });

    // window.addEventListener('resize', () => {
    //     resizePlayer(player);
    // });

    return player;
}


// export function renderPlayer(player) {
// }

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

// export function setResizePlayerCallback(player: Player, cb: () => void) {
//     player.onResize = cb;
// }

export function resizePlayer(player: Player, width: number, height: number) {
    // if (player.onResize) {
    //     player.onResize(width, height);
    // }
    setEngineSize(player.engine, width, height);
}

export async function loadPlayer(
    player: Player,
    beforeCb: () => Promise<void> | (() => void),
    afterCb: () => Promise<void> | (() => void)
) {
    // await player.engine.war
    await beforeCb();
    warmRender(player.engine);
    await afterCb();
}

export function startPlayer(player: Player) {
    // player.glslSoundWrapper?.play();
    // if (player.glslSoundWrapper) {
    //     playSound(player.glslSoundWrapper);
    // }
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
            ? snapToStep(player.timelineDuration, 1 / 60) - .001
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

        // player.timelineTime = snapToStep(player.currentTimeForTimeline, 1 / 60);
        // player.timelineTime = clamp(player.timelineTime, 0, player.timelineDuration);
        // player.timelineDeltaTime = player.timelineTime - player.timelinePrevTime;
        // player.timelinePrevTime = player.timelineTime;
        // player.marionetterSceneStructure.marionetterTimeline.execute({
        //     time: player.timelineTime,
        //     scene: player.scene,
        // });
    }
}
