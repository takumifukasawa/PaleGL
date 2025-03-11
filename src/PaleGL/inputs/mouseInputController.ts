import { createAbstractInputController } from '@/PaleGL/inputs/abstractInputController.ts';
import { createVector2Zero, setV2x, setV2y } from '@/PaleGL/math/vector2.ts';

export function createMouseInputController() {
    let _tmpIsDown = false;
    const _tmpInputPosition = createVector2Zero();

    const inputController = createAbstractInputController();

    const start = () => {
        window.addEventListener('mousedown', _onMouseDown);
        window.addEventListener('mousemove', _onMouseMove);
        window.addEventListener('mouseup', _onMouseUp);
    };

    const update = () => {
        inputController.updateInternal({
            inputPosition: _tmpInputPosition,
            isDown: _tmpIsDown,
        });
    };

    const _onMouseDown = (e: MouseEvent) => {
        _tmpIsDown = true;
        _setInputPosition(e.clientX, e.clientY);
    };

    const _onMouseMove = (e: MouseEvent) => {
        _setInputPosition(e.clientX, e.clientY);
    };

    const _onMouseUp = (e: MouseEvent) => {
        _tmpIsDown = false;
        _setInputPosition(e.clientX, e.clientY);
        // this.setInputPosition(-Infinity, -Infinity);
    };

    const _setInputPosition = (x: number, y: number) => {
        setV2x(_tmpInputPosition, x);
        setV2y(_tmpInputPosition, y);
    };

    const dispose = () => {
        window.removeEventListener('mousedown', _onMouseDown);
        window.removeEventListener('mousemove', _onMouseMove);
        window.removeEventListener('mouseup', _onMouseUp);
    };

    return {
        ...inputController,
        start,
        update,
        dispose,
    };
}
