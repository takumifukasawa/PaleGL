import {TimeSkipper} from "../utilities/TimeSkipper.js";
import {TimeAccumulator} from "../utilities/TimeAccumulator.js";
import {ActorTypes} from "../constants.js";
import {Stats} from "../utilities/Stats.js";

export class Engine {
    #gpu;
    #stats;
    #renderer;
    #scenes = [];
    // timers
    #fixedUpdateFrameTimer;
    #updateFrameTimer;
    // callbacks
    #onBeforeFixedUpdate;
    #onBeforeUpdate;
    #onRender;
    
    get renderer() {
        return this.#renderer;
    }
    
    set onBeforeUpdate(cb) {
        this.#onBeforeUpdate = cb;
    }
    
    set onRender(cb) {
        this.#onRender = cb;
    }
    
    constructor({ gpu, renderer, onBeforeFixedUpdate, onBeforeUpdate, onRender }) {
        this.#gpu = gpu;
        this.#renderer = renderer;
        
        this.#stats = new Stats();
        this.#renderer.setStats(this.#stats);

        // TODO: 外からfps変えられるようにしたい
        this.#fixedUpdateFrameTimer = new TimeAccumulator(60, this.fixedUpdate.bind(this));
        this.#updateFrameTimer = new TimeSkipper(60, this.update.bind(this));

        this.#onBeforeFixedUpdate = onBeforeFixedUpdate;
        this.#onBeforeUpdate = onBeforeUpdate;
        this.#onRender = onRender;
    }
    
    setScene(scene) {
        // this.#scene = scene;
        this.#scenes.push(scene);
    }
    
    setScenes(scenes) {
        this.#scenes = scenes;
    }
    
    start() {
        const t = performance.now() / 1000;
        this.#fixedUpdateFrameTimer.start(t);
        this.#updateFrameTimer.start(t);
    }
    
    setSize(width, height) {
        const rw = width * this.renderer.pixelRatio;
        const rh = height * this.renderer.pixelRatio;
        const w = Math.floor(rw);
        const h = Math.floor(rh);
        // this.#scene.traverse((actor) => actor.setSize(w, h));
        this.#scenes.forEach(scene => {
            scene.traverse((actor) => actor.setSize(w, h));
        });
        this.#renderer.setSize(w, h, rw, rh);
    }

    fixedUpdate(fixedTime, fixedDeltaTime) {
        if(this.#onBeforeFixedUpdate) {
            this.#onBeforeFixedUpdate({ fixedTime, fixedDeltaTime });
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

    update(time, deltaTime) {
        if(this.#onBeforeUpdate) {
            this.#onBeforeUpdate({ time, deltaTime });
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
    
    render(time, deltaTime) {
        this.#stats.clear();
        // this.#renderer.render(this.#scene, this.#scene.mainCamera);
        // this.#scenes.forEach(scene => {
        //     this.#renderer.render(scene, scene.mainCamera);
        // });
        if(this.#onRender) {
            this.#onRender(time, deltaTime);
        }
        this.#stats.updateView();
    }
   
    // time [sec]
    run(time) {
        this.#fixedUpdateFrameTimer.exec(time / 1000);
        this.#updateFrameTimer.exec(time / 1000);
    }
}