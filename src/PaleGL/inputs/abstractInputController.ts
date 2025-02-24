import { Vector2 } from '@/PaleGL/math/Vector2';

// export class AbstractInputController {
//     #beforeInputPosition = Vector2.zero;
//     #currentInputPosition = Vector2.zero;
//     #deltaInputPosition = Vector2.zero;
//     #deltaNormalizedInputPosition = Vector2.zero;
//     #normalizedInputPosition = Vector2.zero;
// 
//     #isPressed = false;
//     #isDown = false;
//     #isReleased = false;
// 
//     #width: number = 0;
//     #height: number = 0;
// 
//     get isUp() {
//         return !_isDown;
//     }
// 
//     get isPressed() {
//         return _isPressed;
//     }
// 
//     get isDown() {
//         return _isDown;
//     }
// 
//     get isReleased() {
//         return _isReleased;
//     }
// 
//     get deltaNormalizedInputPosition() {
//         return _deltaNormalizedInputPosition;
//     }
// 
//     get normalizedInputPosition() {
//         return _normalizedInputPosition;
//     }
// 
//     constructor() {
//         // this.clearInputPositions();
//     }
// 
//     start() {
//         console.error("[AbstractInputController] should implementation 'start' method.");
//     }
// 
//     setSize(width: number, height: number) {
//         _width = width;
//         _height = height;
//     }
// 
//     update() {
//         console.error("[AbstractInputController] should implementation 'update' method.");
//     }
// 
//     // inputPosition ... v2
//     // isDown ... bool
//     updateInternal({ inputPosition, isDown }: { inputPosition: Vector2; isDown: boolean }) {
//         _updateState(isDown);
//         _updateInputPositions(inputPosition);
//     }
// 
//     #updateState(isDown: boolean) {
//         const isBeforeDown = _isDown;
//         _isDown = isDown;
// 
//         // pressed
//         if (!isBeforeDown && _isDown) {
//             _isPressed = true;
//             _isReleased = false;
//             return;
//         }
//         // down
//         if (!isBeforeDown && _isDown) {
//             _isPressed = false;
//             _isReleased = false;
//             return;
//         }
//         // released
//         if (isBeforeDown && !_isDown) {
//             _isPressed = false;
//             _isReleased = true;
//             return;
//         }
//         // up
//         _isPressed = false;
//         _isReleased = false;
//     }
// 
//     #updateInputPositions(inputPosition: Vector2) {
//         // _beforeInputPosition.copy(_currentInputPosition);
//         // _currentInputPosition.copy(inputPosition);
// 
//         if (_isUp) {
//             // this.clearInputPositions();
//             // NOTE: mousemoveを考慮してreturnしてない
//             // return;
//         } else if (_isPressed) {
//             _currentInputPosition.copy(inputPosition);
//             _beforeInputPosition.copy(_currentInputPosition);
//             _deltaInputPosition.set(0, 0);
//             _deltaNormalizedInputPosition.set(0, 0);
//             // NOTE: mousemoveを考慮してreturnしてない
//             // return;
//         }
// 
//         // move
//         _beforeInputPosition.copy(_currentInputPosition);
//         _currentInputPosition.copy(inputPosition);
//         const diff = Vector2.subVectors(_currentInputPosition, _beforeInputPosition);
//         _deltaInputPosition.copy(diff);
//         const vmin = Math.min(_width, _height);
//         _deltaNormalizedInputPosition.set(
//             // _deltaInputPosition.x / _width,
//             // _deltaInputPosition.y / _height
//             // deltaはvminを考慮
//             _deltaInputPosition.x / vmin,
//             _deltaInputPosition.y / vmin
//         );
//         _normalizedInputPosition.set(
//             _currentInputPosition.x / _width,
//             _currentInputPosition.y / _height
//         );
//     }
// 
//     clearInputPositions() {
//         _beforeInputPosition.set(-Infinity, -Infinity);
//         _currentInputPosition.set(-Infinity, -Infinity);
//         _deltaInputPosition.set(-Infinity, -Infinity);
//         _deltaNormalizedInputPosition.set(-Infinity, -Infinity);
//     }
// 
//     dispose() {}
// }

export type AbstractInputController = ReturnType<typeof createAbstractInputController>;

export function createAbstractInputController() {
    let _beforeInputPosition = Vector2.zero;
    let _currentInputPosition = Vector2.zero;
    let _deltaInputPosition = Vector2.zero;
    let _deltaNormalizedInputPosition = Vector2.zero;
    let _normalizedInputPosition = Vector2.zero;

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
            _currentInputPosition.copy(inputPosition);
            _beforeInputPosition.copy(_currentInputPosition);
            _deltaInputPosition.set(0, 0);
            _deltaNormalizedInputPosition.set(0, 0);
            // NOTE: mousemoveを考慮してreturnしてない
            // return;
        }

        // move
        _beforeInputPosition.copy(_currentInputPosition);
        _currentInputPosition.copy(inputPosition);
        const diff = Vector2.subVectors(_currentInputPosition, _beforeInputPosition);
        _deltaInputPosition.copy(diff);
        const vmin = Math.min(_width, _height);
        _deltaNormalizedInputPosition.set(
            // _deltaInputPosition.x / _width,
            // _deltaInputPosition.y / _height
            // deltaはvminを考慮
            _deltaInputPosition.x / vmin,
            _deltaInputPosition.y / vmin
        );
        _normalizedInputPosition.set(
            _currentInputPosition.x / _width,
            _currentInputPosition.y / _height
        );
    }

    const clearInputPositions = () => {
        _beforeInputPosition.set(-Infinity, -Infinity);
        _currentInputPosition.set(-Infinity, -Infinity);
        _deltaInputPosition.set(-Infinity, -Infinity);
        _deltaNormalizedInputPosition.set(-Infinity, -Infinity);
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
