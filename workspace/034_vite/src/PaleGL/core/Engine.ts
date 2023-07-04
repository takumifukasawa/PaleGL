import {TimeSkipper} from "@/PaleGL/utilities/TimeSkipper";
import {TimeAccumulator} from "@/PaleGL/utilities/TimeAccumulator";
import {ActorTypes} from "@/PaleGL/constants";
import {Stats} from "@/PaleGL/utilities/Stats";
import {GPU} from "@/PaleGL/core/GPU";
import {Scene} from "@/PaleGL/core/Scene";
import {Renderer} from "@/PaleGL/core/Renderer";

// type EngineOnBeforeStartCallbackArgs = void;

type EngineOnStartCallbackArgs = void;

type EngineOnBeforeFixedUpdateCallbackArgs = {
    fixedTime: number,
    fixedDeltaTime: number;
}

type EngineOnBeforeUpdateCallbackArgs = {
    time: number,
    deltaTime: number
}

// export type EngineOnUpdateCallbackArgs = {
//     time: number,
//     deltaTime: number
// };

export type EngineOnBeforeStartCallback = () => void;
export type EngineOnStartCallback = (args: EngineOnStartCallbackArgs) => void;
export type EngineOnBeforeFixedUpdateCallback = (args: EngineOnBeforeFixedUpdateCallbackArgs) => void;
export type EngineOnBeforeUpdateCallback = (args: EngineOnBeforeUpdateCallbackArgs) => void;
// export type EngineOnUpdateCallback = (args: EngineOnUpdateCallbackArgs) => void;

export type EngineOnRenderCallback = (time: number, deltaTime: number) => void;

export class Engine {
    #gpu: GPU;
    #stats: Stats;
    #renderer: Renderer;
    #scenes: Scene[] = [];
    // timers
    #fixedUpdateFrameTimer: TimeAccumulator;
    #updateFrameTimer: TimeSkipper;
    // callbacks
    #onBeforeStart: EngineOnBeforeStartCallback | null = null;
    #onBeforeFixedUpdate: EngineOnBeforeFixedUpdateCallback | null = null;
    #onBeforeUpdate: EngineOnBeforeUpdateCallback | null = null;
    #onRender: EngineOnRenderCallback | null = null;

    get renderer() {
        return this.#renderer;
    }

    set onBeforeStart(cb: EngineOnBeforeStartCallback) {
        this.#onBeforeStart = cb;
    }

    set onBeforeUpdate(cb: EngineOnBeforeUpdateCallback) {
        this.#onBeforeUpdate = cb;
    }

    set onBeforeFixedUpdate(cb: EngineOnBeforeFixedUpdateCallback) {
        this.#onBeforeFixedUpdate = cb;
    }

    set onRender(cb: EngineOnRenderCallback) {
        this.#onRender = cb;
    }

    constructor({
                    gpu,
                    renderer,
                    onBeforeFixedUpdate,
                    onBeforeUpdate,
                    onRender
                }: {
        gpu: GPU,
        renderer: Renderer,
        onBeforeFixedUpdate?: EngineOnBeforeFixedUpdateCallback,
        onBeforeUpdate?: EngineOnBeforeUpdateCallback,
        onRender?: EngineOnRenderCallback
    }) {
        this.#gpu = gpu;
        this.#renderer = renderer;

        this.#stats = new Stats();
        this.#renderer.setStats(this.#stats);

        // TODO: 外からfps変えられるようにしたい
        this.#fixedUpdateFrameTimer = new TimeAccumulator(60, this.fixedUpdate.bind(this));
        this.#updateFrameTimer = new TimeSkipper(60, this.update.bind(this));

        this.#onBeforeFixedUpdate = onBeforeFixedUpdate || null;
        this.#onBeforeUpdate = onBeforeUpdate || null;
        this.#onRender = onRender || null;
    }

    setScene(scene: Scene) {
        // this.#scene = scene;
        this.#scenes.push(scene);
    }

    setScenes(scenes: Scene[]) {
        this.#scenes = scenes;
    }

    start() {
        if (this.#onBeforeStart) {
            this.#onBeforeStart();
        }
        const t = performance.now() / 1000;
        this.#fixedUpdateFrameTimer.start(t);
        this.#updateFrameTimer.start(t);
    }

    setSize(width: number, height: number) {
        const rw = width * this.renderer.pixelRatio;
        const rh = height * this.renderer.pixelRatio;
        const w = Math.floor(rw);
        const h = Math.floor(rh);
        // this.#scene.traverse((actor) => actor.setSize(w, h));
        this.#scenes.forEach(scene => {
            scene.traverse((actor) => actor.setSize(w, h));
        });
        // this.#renderer.setSize(w, h, rw, rh);
        this.#renderer.setSize(rw, rh);
    }

    fixedUpdate(fixedTime: number, fixedDeltaTime: number) {
        if (this.#onBeforeFixedUpdate) {
            this.#onBeforeFixedUpdate({fixedTime, fixedDeltaTime});
        }

        // this.#scene.traverse((actor) => actor.fixedUpdate({ gpu: this.#gpu, fixedTime, fixedDeltaTime }));
        this.#scenes.forEach(scene => {
            scene.traverse((actor) => actor.fixedUpdate({gpu: this.#gpu, fixedTime, fixedDeltaTime}));
        });

        // update all actors matrix
        // TODO
        // - scene 側でやった方がよい？
        // - skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
        // - やっぱりcomponentシステムにした方が良い気もする
        // this.#scene.traverse((actor) => actor.updateTransform());
        this.#scenes.forEach(scene => {
            scene.traverse((actor) => actor.updateTransform());
        });
    }

    update(time: number, deltaTime: number) {
        if (this.#onBeforeUpdate) {
            this.#onBeforeUpdate({time, deltaTime});
        }

        // 本当はあんまりgpu渡したくないけど、渡しちゃったほうがいろいろと楽
        this.#scenes.forEach((scene) => {
            scene.traverse((actor) => {
                actor.update({gpu: this.#gpu, time, deltaTime});
                switch (actor.type) {
                    case ActorTypes.Skybox:
                    case ActorTypes.Mesh:
                    case ActorTypes.SkinnedMesh:
                        actor.beforeRender({gpu: this.#gpu});
                        break;
                    default:
                        break;
                }
            });
        });

        this.render(time, deltaTime);
    }

    render(time: number, deltaTime: number) {
        this.#stats.clear();
        // this.#renderer.render(this.#scene, this.#scene.mainCamera);
        // this.#scenes.forEach(scene => {
        //     this.#renderer.render(scene, scene.mainCamera);
        // });
        if (this.#onRender) {
            this.#onRender(time, deltaTime);
        }
        this.#stats.updateView();
    }

    // time [sec]
    run(time: number) {
        this.#fixedUpdateFrameTimer.exec(time / 1000);
        this.#updateFrameTimer.exec(time / 1000);
    }
}
