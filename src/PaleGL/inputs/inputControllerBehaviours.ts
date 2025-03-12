import {copyVector2, setV2, subVectorsV2, v2x, v2y, Vector2} from "@/PaleGL/math/vector2.ts";
import {InputController, InputControllerType, InputControllerTypes} from "@/PaleGL/inputs/inputController.ts";
import {startMouseInputController} from "@/PaleGL/inputs/mouseInputController.ts";
import {startTouchInputController} from "@/PaleGL/inputs/touchInputController.ts";

export function getIsUpInput (inputController: InputController) {
    return !inputController.isDown;
}

export const startInputControllerBehaviours: Record<InputControllerType, (inputController: InputController) => void> = {
    [InputControllerTypes.Mouse]: startMouseInputController,
    [InputControllerTypes.Touch]: startTouchInputController
}

export const startInputController = (inputController: InputController) => {
    startInputControllerBehaviours[inputController.type](inputController);
}

export function setInputControllerSize(inputController: InputController, width: number, height: number) {
    inputController.width = width;
    inputController.height = height;
}

export function updateInputController (inputController: InputController) {
    updateInternal(inputController, {
        inputPosition: inputController.tmpInputPosition,
        isDown: inputController.tmpIsDown,
    });
}

// inputPosition ... v2
// isDown ... bool
function updateInternal (inputController: InputController, { inputPosition, isDown }: { inputPosition: Vector2; isDown: boolean }) {
    updateState(inputController, isDown);
    updateInputPositions(inputController, inputPosition);
}

function updateState (inputController: InputController, isDown: boolean){
    const isBeforeDown = inputController.isDown;
    inputController.isDown = isDown;

    // pressed
    if (!isBeforeDown && inputController.isDown) {
        inputController.isPressed = true;
        inputController.isReleased = false;
        return;
    }
    // down
    if (!isBeforeDown && inputController.isDown) {
        inputController.isPressed = false;
        inputController.isReleased = false;
        return;
    }
    // released
    if (isBeforeDown && !inputController.isDown) {
        inputController.isPressed = false;
        inputController.isReleased = true;
        return;
    }
    // up
    inputController.isPressed = false;
    inputController.isReleased = false;
}

export function updateInputPositions (inputController: InputController, inputPosition: Vector2){
    // _beforeInputPosition.copy(_currentInputPosition);
    // _currentInputPosition.copy(inputPosition);

    if (getIsUpInput(inputController)) {
        // this.clearInputPositions();
        // NOTE: mousemoveを考慮してreturnしてない
        // return;
    } else if (inputController.isPressed) {
        copyVector2(inputController.currentInputPosition, inputPosition);
        copyVector2(inputController.beforeInputPosition, inputController.currentInputPosition);
        setV2(inputController.deltaInputPosition, 0, 0);
        setV2(inputController.deltaNormalizedInputPosition, 0, 0);
        // NOTE: mousemoveを考慮してreturnしてない
        // return;
    }

    // move
    copyVector2(inputController.beforeInputPosition, inputController.currentInputPosition);
    copyVector2(inputController.currentInputPosition, inputPosition);
    const diff = subVectorsV2(inputController.currentInputPosition, inputController.beforeInputPosition);
    copyVector2(inputController.deltaInputPosition, diff);
    const vmin = Math.min(inputController.width, inputController.height);
    setV2(inputController.deltaNormalizedInputPosition,
        v2x(inputController.deltaInputPosition) / vmin,
        v2y(inputController.deltaInputPosition) / vmin
    );
    setV2(inputController.normalizedInputPosition,
        v2x(inputController.currentInputPosition) /inputController.width,
        v2y(inputController.currentInputPosition) /inputController.height
    );
}

export function clearInputPositions (inputController: InputController) {
    setV2(inputController.beforeInputPosition, -Infinity, -Infinity);
    setV2(inputController.currentInputPosition, -Infinity, -Infinity);
    setV2(inputController.deltaInputPosition, -Infinity, -Infinity);
    setV2(inputController.deltaNormalizedInputPosition, -Infinity, -Infinity);
}

// return {
//     getBeforeInputPosition: () => _beforeInputPosition,
//     setBeforeInputPosition: (value: Vector2) => _beforeInputPosition = value,
//     getCurrentInputPosition: () => _currentInputPosition,
//     setCurrentInputPosition: (value: Vector2) => _currentInputPosition = value,
//     getDeltaInputPosition: () => _deltaInputPosition,
//     setDeltaInputPosition: (value: Vector2) => _deltaInputPosition = value,
//     getDeltaNormalizedInputPosition: () => _deltaNormalizedInputPosition,
//     setDeltaNormalizedInputPosition: (value: Vector2) => _deltaNormalizedInputPosition = value,
//     getNormalizedInputPosition: () => _normalizedInputPosition,
//     setNormalizedInputPosition: (value: Vector2) => _normalizedInputPosition = value,
//     getIsUp,
//     getIsPressed: () => _isPressed,
//     getIsDown: () => _isDown,
//     getIsReleased: () => _isReleased,
//     geDeltaNormalizedInputPosition: () => _deltaNormalizedInputPosition,
//     start,
//     setSize,
//     update,
//     updateInternal,
//     updateState,
//     _updateInputPositions,
//     clearInputPositions,
//     dispose
// }
