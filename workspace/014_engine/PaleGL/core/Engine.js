import {TimeSkipper} from "../utilities/TimeSkipper.js";
import {TimeAccumulator} from "../utilities/TimeAccumulator.js";

export class Engine {
    #renderer;
    #fixedUpdateFrameTimer;
    #updateFrameTimer;
    #renderFrameTimer;
    #onFixedUpdate;
    #onUpdate;
    #onRender;
    
    get renderer() {
        return this.#renderer;
    }
    
    set onUpdate(value) {
        this.#onUpdate = value;
    }
    
    set onRender(value) {
        this.#onRender = value;
    }
    
    constructor({ renderer, onFixedUpdate, onUpdate, onRender }) {
        this.#renderer = renderer;

        // TODO: 外からfps変えられるようにしたい
        this.#fixedUpdateFrameTimer = new TimeAccumulator(60, this.fixedUpdate.bind(this));
        this.#updateFrameTimer = new TimeSkipper(60, this.update.bind(this));
        this.#renderFrameTimer = new TimeSkipper(60, this.render.bind(this));

        this.#onFixedUpdate = onFixedUpdate;
        this.#onUpdate = onUpdate;
        this.#onRender = onRender;
    }
    
    start() {
        const t = performance.now() / 1000;
        this.#fixedUpdateFrameTimer.start(t);
        this.#updateFrameTimer.start(t);
        this.#renderFrameTimer.start(t);
        requestAnimationFrame(this.tick.bind(this));
    }

    fixedUpdate(fixedTime, fixedDeltaTime) {
        if(this.#onFixedUpdate) {
            this.#onFixedUpdate({ fixedTime, fixedDeltaTime });
        }
    }

    update(time, deltaTime) {
        if(this.#onUpdate) {
            this.#onUpdate({ time, deltaTime });
        }
    }
    
    render() {
        if(this.#onRender) {
            this.#onRender();
        }
    }
    
    tick(time) {
        this.#fixedUpdateFrameTimer.exec(time / 1000);
        this.#updateFrameTimer.exec(time / 1000);
        this.#renderFrameTimer.exec(time / 1000);
        requestAnimationFrame(this.tick.bind(this));
    }
}