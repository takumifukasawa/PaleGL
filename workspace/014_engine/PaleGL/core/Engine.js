import {TimeSkipper} from "../utilities/TimeSkipper.js";
import {TimeAccumulator} from "../utilities/TimeAccumulator.js";

export class Engine {
    #renderer;
    #fixedUpdateFrameTimer;
    #updateFrameTimer;
    // #renderFrameTimer;
    #onFixedUpdate;
    #onUpdate;
    #scene;
    #gpu;
    
    get renderer() {
        return this.#renderer;
    }
    
    set onUpdate(value) {
        this.#onUpdate = value;
    }
    
    constructor({ gpu, renderer, onFixedUpdate, onUpdate }) {
        this.#gpu = gpu;
        this.#renderer = renderer;

        // TODO: 外からfps変えられるようにしたい
        this.#fixedUpdateFrameTimer = new TimeAccumulator(60, this.fixedUpdate.bind(this));
        this.#updateFrameTimer = new TimeSkipper(60, this.update.bind(this));
        // this.#renderFrameTimer = new TimeSkipper(60, this.render.bind(this));

        this.#onFixedUpdate = onFixedUpdate;
        this.#onUpdate = onUpdate;
    }
    
    setScene(scene) {
        this.#scene = scene;
    }
    
    start() {
        const t = performance.now() / 1000;
        this.#fixedUpdateFrameTimer.start(t);
        this.#updateFrameTimer.start(t);
        // this.#renderFrameTimer.start(t);
    }
    
    setSize(width, height) {
        this.#scene.traverse((actor) => actor.setSize(width, height));
        this.#renderer.setSize(width, height);
    }

    fixedUpdate(fixedTime, fixedDeltaTime) {
        if(this.#onFixedUpdate) {
            this.#onFixedUpdate({ fixedTime, fixedDeltaTime });
        }
        
        this.#scene.traverse((actor) => actor.fixedUpdate({ gpu: this.#gpu, fixedTime, fixedDeltaTime }));

        // update all actors matrix
        // TODO
        // - scene 側でやった方がよい？
        // - skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
        // - やっぱりcomponentシステムにした方が良い気もする
        this.#scene.traverse((actor) => actor.updateTransform());

        // this.#scene.traverse((actor) => actor.afterUpdatedTransform());
    }

    update(time, deltaTime) {
        if(this.#onUpdate) {
            this.#onUpdate({ time, deltaTime });
        }

        // 本当はあんまりgpu渡したくないけど、渡しちゃったほうがいろいろと楽
        this.#scene.traverse((actor) => actor.update({ gpu: this.#gpu, time, deltaTime }));
        
        this.render();
    }
    
    render() {
        this.#renderer.render(this.#scene, this.#scene.mainCamera);
    }
   
    // time [sec]
    run(time) {
        this.#fixedUpdateFrameTimer.exec(time / 1000);
        this.#updateFrameTimer.exec(time / 1000);
    }
}