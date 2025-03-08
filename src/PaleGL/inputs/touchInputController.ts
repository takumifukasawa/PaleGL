import {createAbstractInputController} from '@/PaleGL/inputs/abstractInputController.ts';
import { Vector2 } from '@/PaleGL/math/Vector2';

export function createTouchInputController()  {
    let _tmpIsDown = false;
    const _tmpInputPosition = Vector2.zero;
    
    const inputController = createAbstractInputController();

    const start = () => {
        window.addEventListener('touchstart', _onTouchStart);
        window.addEventListener('touchmove', _onTouchMove);
        window.addEventListener('touchend', _onTouchEnd);
    }

    const update = () => {
        inputController.updateInternal({
            inputPosition: _tmpInputPosition,
            isDown: _tmpIsDown,
        });
    }

    const _onTouchStart = (e: TouchEvent) => {
        _tmpIsDown = true;
        const t = e.touches[0];
        _setInputPosition(t.clientX, t.clientY);
    }

    const _onTouchMove = (e: TouchEvent) => {
        const t = e.touches[0];
        _setInputPosition(t.clientX, t.clientY);
    }

    const _onTouchEnd = (e: TouchEvent) => {
        _tmpIsDown = false;
        const t = e.touches[0];
        _setInputPosition(t.clientX, t.clientY);
        // this.setInputPosition(-Infinity, -Infinity);
    }

    const _setInputPosition = (x: number, y: number) => {
        _tmpInputPosition.set(x, y);
    }

    const dispose = () => {
        window.removeEventListener('touchstart', _onTouchStart);
        window.removeEventListener('touchmove', _onTouchMove);
        window.removeEventListener('touchend', _onTouchEnd);
    }
    
    return {
        ...inputController,
        start,
        update,
        dispose,
    }
}
