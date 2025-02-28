type Callback = (lastTime: number, interval: number) => void;

export type TimeAccumulator = ReturnType<typeof createTimeAccumulator>;

export function createTimeAccumulator(targetFPS: number, callback: Callback, maxChaseCount: number = 60) {
    return {
        targetFPS,
        maxChaseCount,
        callback,
        lastTime: -Infinity
    }
}


export const startTimeAccumulator = (timeAccumulator: TimeAccumulator, time: number) => {
    timeAccumulator.lastTime = time;
};

export const execTimeAccumulator = (timeAccumulator: TimeAccumulator, time: number) => {
    const interval = 1 / timeAccumulator.targetFPS;

    if (time - interval >= timeAccumulator.lastTime) {
        const elapsedTime = time - timeAccumulator.lastTime;
        const n = Math.floor(elapsedTime / interval);

        if (n > timeAccumulator.maxChaseCount) {
            console.warn('[TimeAccumulator.exec] jump frame');
            timeAccumulator.lastTime += interval * n;
            timeAccumulator.callback(timeAccumulator.lastTime, interval);
            return;
        }

        const loopNum = Math.min(timeAccumulator.maxChaseCount, n);
        for (let i = 0; i < loopNum; i++) {
            timeAccumulator.lastTime += interval;
            timeAccumulator.callback(timeAccumulator.lastTime, interval);
        }
    }
};
