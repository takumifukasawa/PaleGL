import { createInputController, InputController, InputControllerTypes } from '@/PaleGL/inputs/inputController.ts';
import { setV2x, setV2y } from '@/PaleGL/math/vector2.ts';

export function createMouseInputController(): InputController {
    return createInputController(InputControllerTypes.Mouse);
}

export function startMouseInputController(inputController: InputController) {
    const onMouseDown = (e: MouseEvent) => {
        inputController.tmpIsDown = true;
        setInputPosition(inputController, e.clientX, e.clientY);
    };

    const onMouseMove = (e: MouseEvent) => {
        setInputPosition(inputController, e.clientX, e.clientY);
    };

    const _onMouseUp = (e: MouseEvent) => {
        inputController.tmpIsDown = false;
        setInputPosition(inputController, e.clientX, e.clientY);
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', _onMouseUp);
}

function setInputPosition(inputController: InputController, x: number, y: number) {
    setV2x(inputController.tmpInputPosition, x);
    setV2y(inputController.tmpInputPosition, y);
}
