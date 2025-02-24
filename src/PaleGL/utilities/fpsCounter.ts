
export type FpsCounter = ReturnType<typeof createFPSCounter>;

export function createFPSCounter(calculateInterval = 1) {
     let _renderCount = 0;
     let _startCountTime = -Infinity;
     const _calculateInterval = calculateInterval;
     let _currentFPS = 0;

    const start = (time: number) => {
        _renderCount = 0;
        _startCountTime = time;
    }

    const calculate = (time: number) => {
        // first exec
        if (_startCountTime < 0) {
            start(time);
            return;
        }

        _renderCount++;

        const elapsedTime = time - _startCountTime;
        if (elapsedTime > _calculateInterval) {
            _currentFPS = _renderCount / elapsedTime;
            start(time);
        }
    }

    return {
        getCurrentFPS: () => _currentFPS,
        start,
        calculate
    }
}
