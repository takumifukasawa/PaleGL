import { TimeSkipper } from '@/PaleGL/utilities/TimeSkipper';
import { TimeAccumulator } from '@/PaleGL/utilities/TimeAccumulator';
import { ActorTypes } from '@/PaleGL/constants';
import { Stats } from '@/PaleGL/utilities/Stats';
import { GPU } from '@/PaleGL/core/GPU';
import { Scene } from '@/PaleGL/core/Scene';
import { Renderer } from '@/PaleGL/core/Renderer';
import { Mesh } from '@/PaleGL/actors/Mesh.ts';
import { createSharedTextures, SharedTextures } from '@/PaleGL/core/createSharedTextures.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { Rotator } from '@/PaleGL/math/Rotator.ts';
import { Quaternion } from '@/PaleGL/math/Quaternion.ts';

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

export class Engine {
    _gpu: GPU;
    _stats: Stats | null = null;
    _renderer: Renderer;
    _scene: Scene | null = null;
    // _scenes: Scene[] = [];
    // timers
    _fixedUpdateFrameTimer: TimeAccumulator;
    _updateFrameTimer: TimeSkipper;
    // callbacks
    _onBeforeStart: EngineOnBeforeStartCallback | null = null;
    _onAfterStart: EngineOnAfterStartCallback | null = null;
    _onBeforeFixedUpdate: EngineOnBeforeFixedUpdateCallback | null = null;
    _onBeforeUpdate: EngineOnBeforeUpdateCallback | null = null;
    _onLastUpdate: EngineOnLastUpdateCallback | null = null;
    _onRender: EngineOnRenderCallback | null = null;
    _sharedTextures: SharedTextures;

    get renderer() {
        return this._renderer;
    }

    get sharedTextures() {
        return this._sharedTextures;
    }

    set onBeforeStart(cb: EngineOnBeforeStartCallback) {
        this._onBeforeStart = cb;
    }

    set onAfterStart(cb: EngineOnAfterStartCallback) {
        this._onAfterStart = cb;
    }

    set onBeforeUpdate(cb: EngineOnBeforeUpdateCallback) {
        this._onBeforeUpdate = cb;
    }

    set onBeforeFixedUpdate(cb: EngineOnBeforeFixedUpdateCallback) {
        this._onBeforeFixedUpdate = cb;
    }

    set onRender(cb: EngineOnRenderCallback) {
        this._onRender = cb;
    }

    /**
     *
     * @param gpu
     * @param renderer
     * @param onBeforeFixedUpdate
     * @param onBeforeUpdate
     * @param onRender
     * @param showStats
     */
    constructor({
        gpu,
        renderer,
        fixedUpdateFps = 60,
        updateFps = 60,
        onBeforeFixedUpdate,
        onBeforeUpdate,
        onRender,
        showStats = false,
    }: {
        gpu: GPU;
        renderer: Renderer;
        fixedUpdateFps?: number;
        updateFps?: number;
        // renderFps?: number;
        onBeforeFixedUpdate?: EngineOnBeforeFixedUpdateCallback;
        onBeforeUpdate?: EngineOnBeforeUpdateCallback;
        onRender?: EngineOnRenderCallback;
        showStats?: boolean;
    }) {
        this._gpu = gpu;
        this._renderer = renderer;

        this._stats = new Stats({ showStats, showPipeline: false }); // 一旦手動で
        this._renderer.setStats(this._stats);

        // TODO: 外からfps変えられるようにしたい
        this._fixedUpdateFrameTimer = new TimeAccumulator(fixedUpdateFps, this.fixedUpdate.bind(this));
        this._updateFrameTimer = new TimeSkipper(updateFps, this.update.bind(this));

        this._onBeforeFixedUpdate = onBeforeFixedUpdate || null;
        this._onBeforeUpdate = onBeforeUpdate || null;
        this._onRender = onRender || null;

        this._sharedTextures = createSharedTextures({ gpu, renderer });
    }

    /**
     *
     * @param scene
     */
    setScene(scene: Scene) {
        this._scene = scene;
        // this._scenes.push(scene);
    }

    /**
     *
     */
    start() {
        if (this._onBeforeStart) {
            this._onBeforeStart();
        }
        const t = performance.now() / 1000;
        this._fixedUpdateFrameTimer.$start(t);
        this._updateFrameTimer.$start(t);
        if (this._onAfterStart) {
            this._onAfterStart();
        }
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        const rw = width * this.renderer.pixelRatio;
        const rh = height * this.renderer.pixelRatio;
        const w = Math.floor(rw);
        const h = Math.floor(rh);
        this._scene?.traverse((actor) => {
            actor.setSize(w, h);
        });
        // this._scenes.forEach((scene) => {
        //     scene.traverse((actor) => actor.setSize(w, h));
        // });
        // this._renderer.setSize(w, h, rw, rh);
        this._renderer.setSize(rw, rh);
    }

    /**
     *
     * @param fixedTime
     * @param fixedDeltaTime
     */
    fixedUpdate(fixedTime: number, fixedDeltaTime: number) {
        if (this._onBeforeFixedUpdate) {
            this._onBeforeFixedUpdate({ fixedTime, fixedDeltaTime });
        }

        this._scene?.traverse((actor) =>
            actor.fixedUpdate({
                gpu: this._gpu,
                scene: this._scene!,
                fixedTime,
                fixedDeltaTime,
            })
        );
        // this._scenes.forEach((scene) => {
        //     scene.traverse((actor) => actor.fixedUpdate({ gpu: this._gpu, fixedTime, fixedDeltaTime }));
        // });

        // update all actors matrix
        // TODO
        // - scene 側でやった方がよい？
        // - skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
        // - やっぱりcomponentシステムにした方が良い気もする
        this._scene?.traverse((actor) => {
            actor.$updateTransform();
        });
        // this._scenes.forEach((scene) => {
        //     scene.traverse((actor) => actor.updateTransform());
        // });
    }

    /**
     *
     * @param time
     * @param deltaTime
     */
    update(time: number, deltaTime: number) {
        //
        // before update
        //

        if (this._onBeforeUpdate) {
            this._onBeforeUpdate({ time, deltaTime });
        }

        //
        // update and before render
        //

        // 本当はあんまりgpu渡したくないけど、渡しちゃったほうがいろいろと楽
        this._scene?.traverse((actor) => {
            actor.update({ gpu: this._gpu, scene: this._scene!, time, deltaTime });
            switch (actor.type) {
                case ActorTypes.Skybox:
                case ActorTypes.Mesh:
                case ActorTypes.SkinnedMesh:
                    actor.beforeRender({ gpu: this._gpu });
                    const mesh = actor as Mesh;
                    mesh.materials.forEach((mat) => {
                        this.renderer.$checkNeedsBindUniformBufferObjectToMaterial(mat);
                    });
                    mesh.depthMaterials.forEach((mat) => {
                        this.renderer.$checkNeedsBindUniformBufferObjectToMaterial(mat);
                    });
                    break;
                default:
                    break;
            }
        });

        //
        // last update
        //

        if (this._onLastUpdate) {
            this._onLastUpdate({ time, deltaTime });
        }
        this._scene?.traverse((actor) => {
            actor.lastUpdate({ gpu: this._gpu, scene: this._scene!, time, deltaTime });
        });

        //
        // update transform
        //

        this._scene?.traverse((actor) => {
            actor.$updateTransform();
        });

        //
        // render
        //

        this.render(time, deltaTime);
    }

    /**
     *
     * @param time
     * @param deltaTime
     */
    lastUpdate(time: number, deltaTime: number) {
        this._scene?.traverse((actor) => actor.lastUpdate({ gpu: this._gpu, scene: this._scene!, time, deltaTime }));
    }

    /**
     *
     * @param time[sec]
     * @param deltaTime[sec]
     */
    render(time: number, deltaTime: number) {
        // for debug
        // console.log(`[Engine.render]`);

        this._stats?.clear();

        this.renderer.beforeRender(time, deltaTime);

        // update and render shared textures
        Object.values(this._sharedTextures).forEach((obj) => {
            obj.update(time);
            obj.render();
        });

        if (this._onRender) {
            this._onRender(time, deltaTime);
        }

        // TODO: ここにrenderer.renderを書く
        // this._renderer.renderScene(this._scene!);

        this._stats?.update(time);
    }

    warmRender() {
        // for debug
        // console.log(`[Engine.warmRender]`);

        // 描画させたいので全部中央に置いちゃう
        const tmpTransformPair: { actor: Actor; p: Vector3; r: Rotator }[] = [];
        this._scene?.traverse((actor) => {
            const tmpP = actor.transform.position.clone();
            const tmpR = actor.transform.rotation.clone();
            // TODO: mainカメラだけ抽出したい
            if (actor.type === ActorTypes.Camera) {
                actor.transform.position = new Vector3(0, 0, 10);
                actor.transform.rotation = Rotator.fromQuaternion(Quaternion.fromEulerDegrees(0, 180, 0));
            } else {
                actor.transform.position = Vector3.zero;
            }
            tmpTransformPair.push({ actor, p: tmpP, r: tmpR });
        });

        this.fixedUpdate(0, 0);
        this.update(0, 0);

        tmpTransformPair.forEach((pair) => {
            pair.actor.transform.position = pair.p;
            pair.actor.transform.rotation = pair.r;
        });
    }

    // time[sec]
    run(time: number) {
        this._fixedUpdateFrameTimer.$exec(time / 1000);
        this._updateFrameTimer.$exec(time / 1000);
    }
}
