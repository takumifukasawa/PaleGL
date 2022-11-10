import {TimeSkipper} from "../utilities/TimeSkipper.js";

export class Engine {
    #renderer;
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
        this.#updateFrameTimer = new TimeSkipper(60, this.update.bind(this));
        this.#renderFrameTimer = new TimeSkipper(60, this.render.bind(this));
        this.#onFixedUpdate = onFixedUpdate;
        this.#onUpdate = onUpdate;
        this.#onRender = onRender;
    }
    
    start() {
        this.#updateFrameTimer.start(performance.now() / 1000);
        this.#renderFrameTimer.start(performance.now() / 1000);
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
        this.#updateFrameTimer.exec(time / 1000);
        this.#renderFrameTimer.exec(time / 1000);
        requestAnimationFrame(this.tick.bind(this));
    }
}