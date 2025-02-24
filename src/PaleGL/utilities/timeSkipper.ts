type Callback = (lastTime: number, deltaTime: number) => void;

export function createTimeSkipper(targetFPS: number, callback: Callback) {
    const _targetFPS: number = targetFPS;
    const _callback: Callback = callback;
    let _lastTime: number = -Infinity;

    const start = (time: number) => {
        _lastTime = time;
    }

    const exec = (time: number) => {
        const interval = 1 / _targetFPS;
        if (time - interval >= _lastTime) {
            const elapsedTime = time - _lastTime;
            const n = Math.floor(elapsedTime / interval);
            const deltaTime = interval * n;
            _lastTime += deltaTime;
            _callback(_lastTime, deltaTime);
        }
    }
    
    return {
        start,
        exec,
    };
}
