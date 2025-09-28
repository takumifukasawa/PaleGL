import { Actor } from '@/PaleGL/actors/actor.ts';
import {
    beforeRenderActor,
    fixedUpdateActor,
    lastUpdateActor,
    setSizeActor,
    updateActor,
    updateActorTransform,
} from '@/PaleGL/actors/actorBehaviours.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { ActorTypes } from '@/PaleGL/constants';
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
    setRendererSize,
    setRendererStats,
} from '@/PaleGL/core/renderer.ts';
import { Scene, traverseScene } from '@/PaleGL/core/scene.ts';
import { setRotation, setTranslation } from '@/PaleGL/core/transform.ts';
import { createQuaternionFromEulerDegrees } from '@/PaleGL/math/quaternion.ts';
import { cloneRotator, createRotatorFromQuaternion, Rotator } from '@/PaleGL/math/rotator.ts';
import { cloneVector3, createVector3, createVector3Zero, Vector3 } from '@/PaleGL/math/vector3.ts';
import { isDevelopment } from '@/PaleGL/utilities/envUtilities.ts';
import { clearStats, createStats, Stats, updateStats } from '@/PaleGL/utilities/stats.ts';
import {
    createTimeAccumulator,
    execTimeAccumulator,
    startTimeAccumulator,
    TimeAccumulator,
} from '@/PaleGL/utilities/timeAccumulator.ts';
import { createTimeSkipper, execTimeSkipper, startTimeSkipper, TimeSkipper } from '@/PaleGL/utilities/timeSkipper.ts';

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
    const stats: Stats | null = isDevelopment() ? createStats({ showStats, showPipeline }) : null;

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
        onRender: [],
        // uiCamera: null,
    };

    const fixedUpdateFrameTimer = createTimeAccumulator(fixedUpdateFps, (lastTime, deltaTime) =>
        fixedUpdateEngine(engineBase, lastTime, deltaTime)
    );
    const updateFrameTimer = createTimeSkipper(updateFps, (lastTime, deltaTime) =>
        updateEngine(engineBase, lastTime, deltaTime)
    );

    (engineBase as Engine).fixedUpdateFrameTimer = fixedUpdateFrameTimer;
    (engineBase as Engine).updateFrameTimer = updateFrameTimer;

    setRendererStats(renderer, stats);

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
    traverseScene(engine.scene, (actor) => {
        updateActor(actor, {
            gpu: engine.renderer.gpu,
            renderer: engine.renderer,
            scene: engine.scene!,
            time,
            deltaTime,
        });
        switch (actor.type) {
            case ActorTypes.Skybox:
            case ActorTypes.Mesh:
                // case ActorTypes.UiActor:
                // case ActorTypes.SkinnedMesh:
                beforeRenderActor(actor, { gpu: engine.renderer.gpu });
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

    // TODO: fixedupdateでもやっちゃってるのよくない
    traverseScene(engine.scene, (actor) => {
        updateActorTransform(actor);
    });

    //
    // render
    //

    renderEngine(engine, time, deltaTime);
}

export function lastUpdateEngine(engine: Engine, time: number, deltaTime: number) {
    if (!engine.scene) {
        console.error('scene is not set');
        return;
    }
    traverseScene(engine.scene, (actor) =>
        lastUpdateActor(actor, {
            gpu: engine.renderer.gpu,
            renderer: engine.renderer,
            scene: engine.scene!,
            time,
            deltaTime,
        })
    );
}

function renderEngine(engine: EngineBase, time: number, deltaTime: number) {
    // for debug
    // console.log(`[Engine.render]`);

    if (isDevelopment() && engine.stats) {
        clearStats(engine.stats);
    }

    beforeRenderRenderer(engine.renderer, time, deltaTime);

    renderSharedTextures(engine.renderer, engine.sharedTextures);

    for (let i = 0; i < engine.onRender.length; i++) {
        engine.onRender[i](time, deltaTime);
    }

    // TODO: ここにrenderer.renderを書く
    // _renderer.renderScene(_scene!);

    if (isDevelopment() && engine.stats) {
        updateStats(engine.stats, time);
    }
}

export function warmRender(engine: Engine) {
    // for debug
    // console.log(`[Engine.warmRender]`);

    if (!engine.scene) {
        console.error('scene is not set');
        return;
    }

    // 描画させたいので全部中央に置いちゃう
    const tmpTransformPair: { actor: Actor; p: Vector3; r: Rotator }[] = [];
    traverseScene(engine.scene, (actor) => {
        const tmpP = cloneVector3(actor.transform.position);
        const tmpR = cloneRotator(actor.transform.rotation);
        // TODO: mainカメラだけ抽出したい
        if (actor.type === ActorTypes.Camera) {
            setTranslation(actor.transform, createVector3(0, 0, 10));
            setRotation(actor.transform, createRotatorFromQuaternion(createQuaternionFromEulerDegrees(0, 180, 0)));
        } else {
            setTranslation(actor.transform, createVector3Zero());
        }
        tmpTransformPair.push({ actor, p: tmpP, r: tmpR });
    });

    fixedUpdateEngine(engine, 0, 0);
    updateEngine(engine, 0, 0);

    tmpTransformPair.forEach((pair) => {
        setTranslation(pair.actor.transform, pair.p);
        setRotation(pair.actor.transform, pair.r);
    });
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
    console.log('setOnBeforeUpdateEngine');
    engine.onBeforeUpdate.push(cb);
}

export function setOnRenderEngine(engine: Engine, cb: EngineOnRenderCallback) {
    engine.onRender.push(cb);
}

export function setSceneToEngine(engine: Engine, scene: Scene) {
    engine.scene = scene;
}
