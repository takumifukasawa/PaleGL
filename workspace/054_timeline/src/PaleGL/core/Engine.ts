import { TimeSkipper } from '@/PaleGL/utilities/TimeSkipper';
import { TimeAccumulator } from '@/PaleGL/utilities/TimeAccumulator';
import { ActorTypes } from '@/PaleGL/constants';
import { Stats } from '@/PaleGL/utilities/Stats';
import { GPU } from '@/PaleGL/core/GPU';
import { Scene } from '@/PaleGL/core/Scene';
import { Renderer } from '@/PaleGL/core/Renderer';
import { Mesh } from '@/PaleGL/actors/Mesh.ts';
import { createSharedTextures, SharedTextures } from '@/PaleGL/core/createSharedTextures.ts';

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
    #gpu: GPU;
    #stats: Stats;
    #renderer: Renderer;
    #scene: Scene | null = null;
    // #scenes: Scene[] = [];
    // timers
    #fixedUpdateFrameTimer: TimeAccumulator;
    #updateFrameTimer: TimeSkipper;
    // callbacks
    #onBeforeStart: EngineOnBeforeStartCallback | null = null;
    #onAfterStart: EngineOnAfterStartCallback | null = null;
    #onBeforeFixedUpdate: EngineOnBeforeFixedUpdateCallback | null = null;
    #onBeforeUpdate: EngineOnBeforeUpdateCallback | null = null;
    #onLastUpdate: EngineOnLastUpdateCallback | null = null;
    private _onRender: EngineOnRenderCallback | null = null;

    private _sharedTextures: SharedTextures;

    get renderer() {
        return this.#renderer;
    }

    get sharedTextures() {
        return this._sharedTextures;
    }

    set onBeforeStart(cb: EngineOnBeforeStartCallback) {
        this.#onBeforeStart = cb;
    }

    set onAfterStart(cb: EngineOnAfterStartCallback) {
        this.#onAfterStart = cb;
    }

    set onBeforeUpdate(cb: EngineOnBeforeUpdateCallback) {
        this.#onBeforeUpdate = cb;
    }

    set onBeforeFixedUpdate(cb: EngineOnBeforeFixedUpdateCallback) {
        this.#onBeforeFixedUpdate = cb;
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
        onBeforeFixedUpdate,
        onBeforeUpdate,
        onRender,
        showStats = false,
    }: {
        gpu: GPU;
        renderer: Renderer;
        onBeforeFixedUpdate?: EngineOnBeforeFixedUpdateCallback;
        onBeforeUpdate?: EngineOnBeforeUpdateCallback;
        onRender?: EngineOnRenderCallback;
        showStats?: boolean;
    }) {
        this.#gpu = gpu;
        this.#renderer = renderer;

        this.#stats = new Stats({ showStats, showPipeline: false }); // 一旦手動で
        this.#renderer.setStats(this.#stats);

        // TODO: 外からfps変えられるようにしたい
        this.#fixedUpdateFrameTimer = new TimeAccumulator(60, this.fixedUpdate.bind(this));
        this.#updateFrameTimer = new TimeSkipper(60, this.update.bind(this));

        this.#onBeforeFixedUpdate = onBeforeFixedUpdate || null;
        this.#onBeforeUpdate = onBeforeUpdate || null;
        this._onRender = onRender || null;

        this._sharedTextures = createSharedTextures({ gpu, renderer });
    }

    /**
     *
     * @param scene
     */
    setScene(scene: Scene) {
        this.#scene = scene;
        // this.#scenes.push(scene);
    }

    /**
     *
     */
    start() {
        if (this.#onBeforeStart) {
            this.#onBeforeStart();
        }
        const t = performance.now() / 1000;
        this.#fixedUpdateFrameTimer.start(t);
        this.#updateFrameTimer.start(t);
        if (this.#onAfterStart) {
            this.#onAfterStart();
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
        this.#scene?.traverse((actor) => actor.setSize(w, h));
        // this.#scenes.forEach((scene) => {
        //     scene.traverse((actor) => actor.setSize(w, h));
        // });
        // this.#renderer.setSize(w, h, rw, rh);
        this.#renderer.setSize(rw, rh);
    }

    /**
     *
     * @param fixedTime
     * @param fixedDeltaTime
     */
    fixedUpdate(fixedTime: number, fixedDeltaTime: number) {
        if (this.#onBeforeFixedUpdate) {
            this.#onBeforeFixedUpdate({ fixedTime, fixedDeltaTime });
        }

        this.#scene?.traverse((actor) => actor.fixedUpdate({ gpu: this.#gpu, fixedTime, fixedDeltaTime }));
        // this.#scenes.forEach((scene) => {
        //     scene.traverse((actor) => actor.fixedUpdate({ gpu: this.#gpu, fixedTime, fixedDeltaTime }));
        // });

        // update all actors matrix
        // TODO
        // - scene 側でやった方がよい？
        // - skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
        // - やっぱりcomponentシステムにした方が良い気もする
        this.#scene?.traverse((actor) => {
            actor.updateTransform();
        });
        // this.#scenes.forEach((scene) => {
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
        // before render
        //
        
        if (this.#onBeforeUpdate) {
            this.#onBeforeUpdate({ time, deltaTime });
        }
        
        //
        // update and before render
        //

        // 本当はあんまりgpu渡したくないけど、渡しちゃったほうがいろいろと楽
        this.#scene?.traverse((actor) => {
            actor.update({ gpu: this.#gpu, time, deltaTime });
            switch (actor.type) {
                case ActorTypes.Skybox:
                case ActorTypes.Mesh:
                case ActorTypes.SkinnedMesh:
                    actor.beforeRender({ gpu: this.#gpu });
                    const mesh = actor as Mesh;
                    mesh.materials.forEach((mat) => {
                        this.renderer.checkNeedsBindUniformBufferObjectToMaterial(mat);
                    });
                    if (mesh.depthMaterial) {
                        this.renderer.checkNeedsBindUniformBufferObjectToMaterial(mesh.depthMaterial);
                    }
                    break;
                default:
                    break;
            }
        });
        
        //
        // last update
        //

        if (this.#onLastUpdate) {
            this.#onLastUpdate({ time, deltaTime });
        }
        this.#scene?.traverse((actor) => {
            actor.lastUpdate({ gpu: this.#gpu, time, deltaTime });
        });
        
        //
        // update transform
        //

        this.#scene?.traverse((actor) => {
            actor.updateTransform();
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
        this.#scene?.traverse((actor) => actor.lastUpdate({ gpu: this.#gpu, time, deltaTime }));
    }

    /**
     *
     * @param time[sec]
     * @param deltaTime[sec]
     */
    render(time: number, deltaTime: number) {
        this.#stats.clear();

        // update and render shared textures
        Object.values(this._sharedTextures).forEach((obj) => {
            obj.update(time);
            obj.render();
        });

        if (this._onRender) {
            this._onRender(time, deltaTime);
        }

        // TODO: ここにrenderer.renderを書く
        // this.#renderer.renderScene(this.#scene!);

        this.#stats.update(time);
    }

    /**
     *
     * @param time[sec]
     */
    run(time: number) {
        this.#fixedUpdateFrameTimer.exec(time / 1000);
        this.#updateFrameTimer.exec(time / 1000);
    }
}
