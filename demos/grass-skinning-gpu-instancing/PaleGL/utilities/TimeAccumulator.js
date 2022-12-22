
export class TimeAccumulator {
    targetFPS;
    #callback;
    #lastTime;
    maxChaseCount;

    constructor(targetFPS, callback, maxChaseCount = 60) {
        this.targetFPS = targetFPS;
        this.#callback = callback;
        this.maxChaseCount = maxChaseCount;
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

            if(n > this.maxChaseCount) {
                console.warn("[TimeAccumulator.exec] jump frame");
                this.#lastTime += interval * n;
                this.#callback(this.#lastTime, interval);
                return;
            }

            const loopNum = Math.min(this.maxChaseCount, n);
            for(let i = 0; i < loopNum; i++) {
                this.#lastTime += interval;
                this.#callback(this.#lastTime, interval);
            }
        }
    }   
}