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
    stopSound
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
    timelineDuration: number,
    options: {
        glslSoundWrapper?: GLSLSoundWrapper;
    } = {}
): Player {
    const { glslSoundWrapper } = options;

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
        timelineTime: 0,
        timelinePrevTime: 0,
        timelineDeltaTime: 0,
        currentTimeForTimeline: 0,
        glslSoundWrapper: glslSoundWrapper || null,
        timelineDuration,
        // onResize: () => {},
    };

    const marionetter = createMarionetter({
        showLog: false,
        onPlay: (time: number) => {
            // console.log(`[marionetter.onPlay] time: ${time}`);
            // glslSoundWrapper.play({ time });
            // currentTimeForTimeline = time;
            onPlayMarionetter(player, time);
        },
        onSeek: (time: number) => {
            // currentTimeForTimeline = time;
            // glslSoundWrapper.stop();
            onSeekMarionetter(player, time);
        },
        onStop: () => {
            // console.log(`[marionetter.onStop]`);
            // glslSoundWrapper.stop();
            onStopMarionetter(player);
        },
    });

    const marionetterSceneStructure = buildMarionetterScene(gpu, JSON.parse(sceneJson) as unknown as MarionetterScene);

    console.log('marionetterSceneStructure', marionetterSceneStructure);

    // timeline生成したらscene内のactorをbind
    const { actors } = marionetterSceneStructure;

    marionetterSceneStructure.marionetterTimeline?.bindActors(scene.children);
    for (let i = 0; i < actors.length; i++) {
        addActorToScene(scene, actors[i]);
    }

    if (import.meta.env.VITE_HOT_RELOAD === 'true') {
        marionetter.connect();
        // initHotReloadAndParseScene();
        initHotReloadAndParseScene(
            hotReloadJsonUrl,
            marionetter, marionetterSceneStructure, scene, (structure) => {
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

function onPlayMarionetter(player: Player, time: number) {
    console.log(`[marionetter.onPlay] time: ${time}`);
    if (player.glslSoundWrapper) {
        playSound(player.glslSoundWrapper, { time });
    }
    player.currentTimeForTimeline = time;
}

function onSeekMarionetter(player: Player, time: number) {
    player.currentTimeForTimeline = time;
    if (player.glslSoundWrapper) {
        stopSound(player.glslSoundWrapper);
    }
}

function onStopMarionetter(player: Player) {
    console.log(`[marionetter.onStop]`);
    if (player.glslSoundWrapper) {
        stopSound(player.glslSoundWrapper);
    }
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
    if (player.glslSoundWrapper) {
        playSound(player.glslSoundWrapper);
    }
    startEngine(player.engine);
}

export function runPlayer(player: Player, time: number) {
    runEngine(player.engine, time);
}

export function beforeUpdatePlayer(player: Player, _: number, deltaTime: number) {
    if (player.marionetterSceneStructure && player.marionetterSceneStructure.marionetterTimeline) {
        if (player.glslSoundWrapper) {
           if(player.glslSoundWrapper.isPlaying) {
               player.currentTimeForTimeline = getSoundCurrentTime(player.glslSoundWrapper);
           }
        } else {
            player.currentTimeForTimeline += deltaTime;
        }
        player.timelineTime = snapToStep(player.currentTimeForTimeline, 1 / 60);
        player.timelineTime = clamp(player.timelineTime, 0, player.timelineDuration);
        player.timelineDeltaTime = player.timelineTime - player.timelinePrevTime;
        player.timelinePrevTime = player.timelineTime;
        player.marionetterSceneStructure.marionetterTimeline.execute({
            time: player.timelineTime,
            scene: player.scene,
        });
    }
}

// export function renderPlayer(player) {
// }
