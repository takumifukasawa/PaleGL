type Callback = (lastTime: number, interval: number) => void;

export class TimeAccumulator {
    _targetFPS: number;
    _maxChaseCount: number;
    _callback: Callback;
    _lastTime: number = -Infinity;

    /**
     *
     * @param targetFPS
     * @param callback
     * @param maxChaseCount
     */
    constructor(targetFPS: number, callback: Callback, maxChaseCount: number = 60) {
        this._targetFPS = targetFPS;
        this._callback = callback;
        this._maxChaseCount = maxChaseCount;
    }

    /**
     *
     * @param time [sec]
     */
    $start(time: number) {
        this._lastTime = time;
    }

    /**
     *
     * @param time [sec]
     */
    $exec(time: number) {
        const interval = 1 / this._targetFPS;

        if (time - interval >= this._lastTime) {
            const elapsedTime = time - this._lastTime;
            const n = Math.floor(elapsedTime / interval);

            if (n > this._maxChaseCount) {
                console.warn('[TimeAccumulator.exec] jump frame');
                this._lastTime += interval * n;
                this._callback(this._lastTime, interval);
                return;
            }

            const loopNum = Math.min(this._maxChaseCount, n);
            for (let i = 0; i < loopNum; i++) {
                this._lastTime += interval;
                this._callback(this._lastTime, interval);
            }
        }
    }
}
