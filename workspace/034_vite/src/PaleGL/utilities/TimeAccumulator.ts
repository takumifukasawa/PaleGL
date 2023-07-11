type Callback = (lastTime: number, interval: number) => void;

export class TimeAccumulator {
    targetFPS: number;
    maxChaseCount: number;
    private callback: Callback;
    private lastTime: number = -Infinity;

    /**
     *
     * @param targetFPS
     * @param callback
     * @param maxChaseCount
     */
    constructor(targetFPS: number, callback: Callback, maxChaseCount: number = 60) {
        this.targetFPS = targetFPS;
        this.callback = callback;
        this.maxChaseCount = maxChaseCount;
    }

    /**
     *
     * @param time [sec]
     */
    start(time: number) {
        this.lastTime = time;
    }

    /**
     *
     * @param time [sec]
     */
    exec(time: number) {
        const interval = 1 / this.targetFPS;

        if (time - interval >= this.lastTime) {
            const elapsedTime = time - this.lastTime;
            const n = Math.floor(elapsedTime / interval);

            if (n > this.maxChaseCount) {
                console.warn('[TimeAccumulator.exec] jump frame');
                this.lastTime += interval * n;
                this.callback(this.lastTime, interval);
                return;
            }

            const loopNum = Math.min(this.maxChaseCount, n);
            for (let i = 0; i < loopNum; i++) {
                this.lastTime += interval;
                this.callback(this.lastTime, interval);
            }
        }
    }
}
