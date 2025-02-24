type Callback = (lastTime: number, interval: number) => void;

export function createTimeAccumulator(targetFPS: number, callback: Callback, maxChaseCount: number = 60) {
    const _targetFPS: number = targetFPS;
    const _maxChaseCount: number = maxChaseCount;
    const _callback: Callback = callback;
    let _lastTime: number = -Infinity;

    const start = (time: number) => {
        _lastTime = time;
    };

    const exec = (time: number) => {
        const interval = 1 / _targetFPS;

        if (time - interval >= _lastTime) {
            const elapsedTime = time - _lastTime;
            const n = Math.floor(elapsedTime / interval);

            if (n > _maxChaseCount) {
                console.warn('[TimeAccumulator.exec] jump frame');
                _lastTime += interval * n;
                _callback(_lastTime, interval);
                return;
            }

            const loopNum = Math.min(_maxChaseCount, n);
            for (let i = 0; i < loopNum; i++) {
                _lastTime += interval;
                _callback(_lastTime, interval);
            }
        }
    };

    return {
        start,
        exec,
    };
}
