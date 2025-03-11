import {copyVector2, createVector2Zero, setV2, subVectorsV2, v2x, v2y, Vector2} from '@/PaleGL/math/vector2.ts';

export function createAbstractInputController() {
    let _beforeInputPosition = createVector2Zero();
    let _currentInputPosition = createVector2Zero();
    let _deltaInputPosition = createVector2Zero();
    let _deltaNormalizedInputPosition = createVector2Zero();
    let _normalizedInputPosition = createVector2Zero();

    let _isPressed = false;
    let _isDown = false;
    let _isReleased = false;

    let _width: number = 0;
    let _height: number = 0;

    const getIsUp = () => {
        return !_isDown;
    }

    const start = () => {
        console.error("[AbstractInputController] should implementation 'start' method.");
    }

    const setSize = (width: number, height: number) => {
        _width = width;
        _height = height;
    }

    const update = () => {
        console.error("[AbstractInputController] should implementation 'update' method.");
    }

    // inputPosition ... v2
    // isDown ... bool
    const updateInternal = ({ inputPosition, isDown }: { inputPosition: Vector2; isDown: boolean }) => {
        updateState(isDown);
        _updateInputPositions(inputPosition);
    }

    const updateState = (isDown: boolean) => {
        const isBeforeDown = _isDown;
        _isDown = isDown;

        // pressed
        if (!isBeforeDown && _isDown) {
            _isPressed = true;
            _isReleased = false;
            return;
        }
        // down
        if (!isBeforeDown && _isDown) {
            _isPressed = false;
            _isReleased = false;
            return;
        }
        // released
        if (isBeforeDown && !_isDown) {
            _isPressed = false;
            _isReleased = true;
            return;
        }
        // up
        _isPressed = false;
        _isReleased = false;
    }

    const _updateInputPositions = (inputPosition: Vector2) => {
        // _beforeInputPosition.copy(_currentInputPosition);
        // _currentInputPosition.copy(inputPosition);

        if (getIsUp()) {
            // this.clearInputPositions();
            // NOTE: mousemoveを考慮してreturnしてない
            // return;
        } else if (_isPressed) {
            copyVector2(_currentInputPosition, inputPosition);
            copyVector2(_beforeInputPosition, _currentInputPosition);
            setV2(_deltaInputPosition, 0, 0);
            setV2(_deltaNormalizedInputPosition, 0, 0);
            // NOTE: mousemoveを考慮してreturnしてない
            // return;
        }

        // move
        copyVector2(_beforeInputPosition, _currentInputPosition);
        copyVector2(_currentInputPosition, inputPosition);
        const diff = subVectorsV2(_currentInputPosition, _beforeInputPosition);
        copyVector2(_deltaInputPosition, diff);
        const vmin = Math.min(_width, _height);
        setV2(_deltaNormalizedInputPosition,
           v2x(_deltaInputPosition) / vmin,
           v2y(_deltaInputPosition) / vmin
        );
        setV2(_normalizedInputPosition,
            v2x(_currentInputPosition) / _width,
            v2y(_currentInputPosition) / _height
        );
    }

    const clearInputPositions = () => {
        setV2(_beforeInputPosition, -Infinity, -Infinity);
        setV2(_currentInputPosition, -Infinity, -Infinity);
        setV2(_deltaInputPosition, -Infinity, -Infinity);
        setV2(_deltaNormalizedInputPosition, -Infinity, -Infinity);
    }

    const dispose = () => {}
    
    return {
        getBeforeInputPosition: () => _beforeInputPosition,
        setBeforeInputPosition: (value: Vector2) => _beforeInputPosition = value,
        getCurrentInputPosition: () => _currentInputPosition,
        setCurrentInputPosition: (value: Vector2) => _currentInputPosition = value,
        getDeltaInputPosition: () => _deltaInputPosition,
        setDeltaInputPosition: (value: Vector2) => _deltaInputPosition = value,
        getDeltaNormalizedInputPosition: () => _deltaNormalizedInputPosition,
        setDeltaNormalizedInputPosition: (value: Vector2) => _deltaNormalizedInputPosition = value,
        getNormalizedInputPosition: () => _normalizedInputPosition,
        setNormalizedInputPosition: (value: Vector2) => _normalizedInputPosition = value,
        getIsUp,
        getIsPressed: () => _isPressed,
        getIsDown: () => _isDown,
        getIsReleased: () => _isReleased,
        geDeltaNormalizedInputPosition: () => _deltaNormalizedInputPosition,
        start,
        setSize,
        update,
        updateInternal,
        updateState,
        _updateInputPositions,
        clearInputPositions,
        dispose
    }
}
