export type FpsCounter = {
    renderCount: number;
    startCountTime: number;
    calculateInterval: number;
    currentFPS: number;
};

export function createFPSCounter(calculateInterval = 1) {
    const renderCount = 0;
    const startCountTime = -Infinity;
    const currentFPS = 0;

    return {
        renderCount,
        startCountTime,
        calculateInterval,
        currentFPS,
    };
}

export const startFPSCounter = (fpsCounter: FpsCounter, time: number) => {
    fpsCounter.renderCount = 0;
    fpsCounter.startCountTime = time;
};

export const calculateFPSCounter = (fpsCounter: FpsCounter, time: number) => {
    // first exec
    if (fpsCounter.startCountTime < 0) {
        startFPSCounter(fpsCounter, time);
        return;
    }

    fpsCounter.renderCount++;

    const elapsedTime = time - fpsCounter.startCountTime;
    if (elapsedTime > fpsCounter.calculateInterval) {
        fpsCounter.currentFPS = fpsCounter.renderCount / elapsedTime;
        startFPSCounter(fpsCounter, time);
    }
};
