type Callback = (lastTime: number, deltaTime: number) => void;

export type TimeSkipper = ReturnType<typeof createTimeSkipper>;

export function createTimeSkipper(targetFPS: number, callback: Callback) {
    return {
        targetFPS: targetFPS,
        callback: callback,
        lastTime: -Infinity,
    };
}

export const startTimeSkipper = (timeSkipper: TimeSkipper, time: number) => {
    timeSkipper.lastTime = time;
};

export const execTimeSkipper = (timeSkipper: TimeSkipper, time: number) => {
    const interval = 1 / timeSkipper.targetFPS;
    if (time - interval >= timeSkipper.lastTime) {
        const elapsedTime = time - timeSkipper.lastTime;
        const n = Math.floor(elapsedTime / interval);
        const deltaTime = interval * n;
        timeSkipper.lastTime += deltaTime;
        timeSkipper.callback(timeSkipper.lastTime, deltaTime);
    }
};
