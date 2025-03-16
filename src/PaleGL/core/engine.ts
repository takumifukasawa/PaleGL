import { createTimeSkipper, execTimeSkipper, startTimeSkipper } from '@/PaleGL/utilities/timeSkipper.ts';
import { ActorTypes } from '@/PaleGL/constants';
import { clearStats, createStats, Stats, updateStats } from '@/PaleGL/utilities/stats.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Scene, traverseScene } from '@/PaleGL/core/scene.ts';
import {
    beforeRenderRenderer,
    checkNeedsBindUniformBufferObjectToMaterial,
    Renderer,
    setRendererSize,
    setRendererStats,
} from '@/PaleGL/core/renderer.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import {
    createSharedTextures,
    renderSharedTextures, SharedTexture,
    SharedTextures,
    SharedTexturesType
} from '@/PaleGL/core/createSharedTextures.ts';
import { cloneVector3, createVector3, createVector3Zero, Vector3 } from '@/PaleGL/math/vector3.ts';
import { Actor } from '@/PaleGL/actors/actor.ts';
import {
    beforeRenderActor,
    fixedUpdateActor,
    lastUpdateActor,
    setSizeActor,
    updateActor,
    updateActorTransform,
} from '@/PaleGL/actors/actorBehaviours.ts';
import {cloneRotator, createRotatorFromQuaternion, Rotator} from '@/PaleGL/math/rotator.ts';
import { createQuaternionFromEulerDegrees } from '@/PaleGL/math/quaternion.ts';
import {
    createTimeAccumulator,
    execTimeAccumulator,
    startTimeAccumulator,
} from '@/PaleGL/utilities/timeAccumulator.ts';
import { setRotation, setTranslation } from '@/PaleGL/core/transform.ts';

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

export type Engine = ReturnType<typeof createEngine>;

export function createEngine({
    gpu,
    renderer,
    fixedUpdateFps = 60,
    updateFps = 60,
    onBeforeFixedUpdate,
    onBeforeUpdate,
    onRender,
    showStats = false,
}: {
    gpu: Gpu;
    renderer: Renderer;
    fixedUpdateFps?: number;
    updateFps?: number;
    // renderFps?: number;
    onBeforeFixedUpdate?: EngineOnBeforeFixedUpdateCallback;
    onBeforeUpdate?: EngineOnBeforeUpdateCallback;
    onRender?: EngineOnRenderCallback;
    showStats?: boolean;
}) {
    const _gpu: Gpu = gpu;
    const _stats: Stats | null = createStats({ showStats, showPipeline: false });
    const _renderer: Renderer = renderer;
    let _scene: Scene | null = null;
    // _scenes: Scene[] = [];
    // timers
    const _fixedUpdateFrameTimer = createTimeAccumulator(fixedUpdateFps, fixedUpdate);
    const _updateFrameTimer = createTimeSkipper(updateFps, update);
    // callbacks
    let _onBeforeStart: EngineOnBeforeStartCallback | null = null;
    let _onAfterStart: EngineOnAfterStartCallback | null = null;
    let _onBeforeFixedUpdate: EngineOnBeforeFixedUpdateCallback | null = onBeforeFixedUpdate || null;
    let _onBeforeUpdate: EngineOnBeforeUpdateCallback | null = onBeforeUpdate || null;
    let _onLastUpdate: EngineOnLastUpdateCallback | null = null;
    let _onRender: EngineOnRenderCallback | null = onRender || null;
    const _sharedTextures: SharedTextures = createSharedTextures({ gpu, renderer });

    setRendererStats(_renderer, _stats);

    const start = () => {
        if (_onBeforeStart) {
            _onBeforeStart();
        }
        const t = performance.now() / 1000;
        startTimeAccumulator(_fixedUpdateFrameTimer, t);
        startTimeSkipper(_updateFrameTimer, t);
        if (_onAfterStart) {
            _onAfterStart();
        }
    };

    const setSize = (width: number, height: number) => {
        const rw = width * _renderer.pixelRatio;
        const rh = height * _renderer.pixelRatio;
        const w = Math.floor(rw);
        const h = Math.floor(rh);
        traverseScene(_scene!, (actor) => {
            setSizeActor(actor, w, h);
        });
        // _scenes.forEach((scene) => {
        //     scene.traverse((actor) => actor.setSize(w, h));
        // });
        // _renderer.setSize(w, h, rw, rh);
        setRendererSize(_renderer, rw, rh);
    };

    function fixedUpdate(fixedTime: number, fixedDeltaTime: number) {
        if (_onBeforeFixedUpdate) {
            _onBeforeFixedUpdate({ fixedTime, fixedDeltaTime });
        }

        traverseScene(_scene!, (actor) => {
            fixedUpdateActor(actor, {
                gpu: _gpu,
                scene: _scene!,
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

    function update(time: number, deltaTime: number) {
        //
        // before update
        //

        if (_onBeforeUpdate) {
            _onBeforeUpdate({ time, deltaTime });
        }

        //
        // update and before render
        //

        // 本当はあんまりgpu渡したくないけど、渡しちゃったほうがいろいろと楽
        traverseScene(_scene!, (actor) => {
            updateActor(actor, { gpu: _gpu, scene: _scene!, time, deltaTime });
            switch (actor.type) {
                case ActorTypes.Skybox:
                case ActorTypes.Mesh:
                    // case ActorTypes.SkinnedMesh:
                    beforeRenderActor(actor, { gpu: _gpu });
                    const mesh = actor as Mesh;
                    mesh.materials.forEach((mat) => {
                        checkNeedsBindUniformBufferObjectToMaterial(renderer, mat);
                    });
                    mesh.depthMaterials.forEach((mat) => {
                        checkNeedsBindUniformBufferObjectToMaterial(renderer, mat);
                    });
                    break;
                default:
                    break;
            }
        });

        //
        // last update
        //

        if (_onLastUpdate) {
            _onLastUpdate({ time, deltaTime });
        }
        traverseScene(_scene!, (actor) => {
            lastUpdateActor(actor, { gpu: _gpu, scene: _scene!, time, deltaTime });
        });

        //
        // update transform
        //

        // TODO: fixedupdateでもやっちゃってるのよくない
        traverseScene(_scene!, (actor) => {
            updateActorTransform(actor);
        });

        //
        // render
        //

        render(time, deltaTime);
    }

    const lastUpdate = (time: number, deltaTime: number) => {
        traverseScene(_scene!, (actor) => lastUpdateActor(actor, { gpu: _gpu, scene: _scene!, time, deltaTime }));
    };

    const render = (time: number, deltaTime: number) => {
        // for debug
        // console.log(`[Engine.render]`);

        clearStats(_stats);

        beforeRenderRenderer(_renderer, time, deltaTime);

        renderSharedTextures(_renderer, _sharedTextures, time);

        if (_onRender) {
            _onRender(time, deltaTime);
        }

        // TODO: ここにrenderer.renderを書く
        // _renderer.renderScene(_scene!);

        updateStats(_stats, time);
    };

    const warmRender = () => {
        // for debug
        // console.log(`[Engine.warmRender]`);

        // 描画させたいので全部中央に置いちゃう
        const tmpTransformPair: { actor: Actor; p: Vector3; r: Rotator }[] = [];
        traverseScene(_scene!, (actor) => {
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

        fixedUpdate(0, 0);
        update(0, 0);

        tmpTransformPair.forEach((pair) => {
            setTranslation(pair.actor.transform, pair.p);
            setRotation(pair.actor.transform, pair.r);
        });
    };

    // time[sec]
    const run = (time: number) => {
        execTimeAccumulator(_fixedUpdateFrameTimer, time / 1000);
        execTimeSkipper(_updateFrameTimer, time / 1000);
    };

    return {
        sharedTextures: _sharedTextures,
        getRenderer: () => _renderer,
        getSharedTextures: () => _sharedTextures,
        setOnBeforeStart: (cb: EngineOnBeforeStartCallback) => (_onBeforeStart = cb),
        setOnAfterStart: (cb: EngineOnAfterStartCallback) => (_onAfterStart = cb),
        setOnBeforeUpdate: (cb: EngineOnBeforeUpdateCallback) => (_onBeforeUpdate = cb),
        setOnBeforeFixedUpdate: (cb: EngineOnBeforeFixedUpdateCallback) => (_onBeforeFixedUpdate = cb),
        setOnLastUpdate: (cb: EngineOnLastUpdateCallback) => (_onLastUpdate = cb),
        setOnRender: (cb: EngineOnRenderCallback) => (_onRender = cb),
        setScene: (scene: Scene) => (_scene = scene),
        start,
        setSize,
        fixedUpdate,
        update,
        lastUpdate,
        render,
        warmRender,
        run,
    };
}

export function getSharedTexture(engine: Engine, key: SharedTexturesType): SharedTexture {
    if (!engine.sharedTextures.has(key)) {
        console.error('invalid shared texture key');
    }
    return engine.sharedTextures.get(key)!;
}
