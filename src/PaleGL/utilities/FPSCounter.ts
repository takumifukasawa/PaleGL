export class FPSCounter {
    private renderCount = 0;
    private startCountTime = -Infinity;
    private calculateInterval = 1;
    private _currentFPS = 0;

    get currentFPS() {
        return this._currentFPS;
    }

    constructor(calculateInterval = 1) {
        this.calculateInterval = calculateInterval;
    }

    /**
     *
     * @param time[sec]
     * @private
     */
    private start(time: number) {
        this.renderCount = 0;
        this.startCountTime = time;
    }

    /**
     *
     * @param time[sec]
     */
    calculate(time: number) {
        // first exec
        if (this.startCountTime < 0) {
            this.start(time);
            return;
        }

        this.renderCount++;

        const elapsedTime = time - this.startCountTime;
        if (elapsedTime > this.calculateInterval) {
            this._currentFPS = this.renderCount / elapsedTime;
            this.start(time);
        }
    }
}
