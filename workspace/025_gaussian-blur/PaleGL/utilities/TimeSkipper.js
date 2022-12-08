
export class TimeSkipper {
    targetFPS;
    #callback;
    #lastTime;
 
    constructor(targetFPS, callback) {
        this.targetFPS = targetFPS;
        this.#callback = callback;
    }

    // time [sec]
    start(time) {
        this.#lastTime = time;
    }
   
    // time [sec]
    exec(time) {
        const interval = 1 / this.targetFPS;
        if((time - interval) >= this.#lastTime) {
            const elapsedTime = time - this.#lastTime;
            const n = Math.floor(elapsedTime / interval);
            const deltaTime = interval * n;
            this.#lastTime += deltaTime;
            this.#callback(this.#lastTime, deltaTime);
        }
    }
}