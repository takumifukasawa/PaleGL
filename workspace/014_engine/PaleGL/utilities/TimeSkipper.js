
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
        if(time > this.#lastTime) {
            let deltaTime = 0;
            // TODO: たくさん時間が空いたときにwhileが回りすぎてしまうので最適化
            while(true) {
                this.#lastTime += interval;
                deltaTime += interval;
                if((time - interval) < this.#lastTime) {
                    break;
                }
            }
            this.#callback(this.#lastTime, deltaTime);
        }
    }
}