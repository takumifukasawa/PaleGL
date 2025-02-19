type Callback = (lastTime: number, deltaTime: number) => void;

export class TimeSkipper {
    _targetFPS: number;
    _callback: Callback;
    _lastTime: number = -Infinity;

    constructor(targetFPS: number, callback: Callback) {
        this._targetFPS = targetFPS;
        this._callback = callback;
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
            const deltaTime = interval * n;
            this._lastTime += deltaTime;
            this._callback(this._lastTime, deltaTime);
        }
    }
}
