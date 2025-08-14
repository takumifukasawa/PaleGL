import { createInputController, InputController, InputControllerTypes } from '@/PaleGL/inputs/inputController.ts';
import { setV2x, setV2y } from '@/PaleGL/math/vector2.ts';

export function createTouchInputController(): InputController {
    return createInputController(InputControllerTypes.Mouse);
}

export function startTouchInputController(inputController: InputController) {
    const onTouchStart = (e: TouchEvent) => {
        inputController.tmpIsDown = true;
        const t = e.touches[0];
        setInputPosition(inputController, t.clientX, t.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
        const t = e.touches[0];
        setInputPosition(inputController, t.clientX, t.clientY);
    };

    const onTouchEnd = (e: TouchEvent) => {
        inputController.tmpIsDown = false;
        const t = e.touches[0];
        setInputPosition(inputController, t.clientX, t.clientY);
        // this.setInputPosition(-Infinity, -Infinity);
    };

    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
}

function setInputPosition(inputController: InputController, x: number, y: number) {
    setV2x(inputController.tmpInputPosition, x);
    setV2y(inputController.tmpInputPosition, y);
}
