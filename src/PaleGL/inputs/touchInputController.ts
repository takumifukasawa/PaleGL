import {createAbstractInputController} from '@/PaleGL/inputs/abstractInputController.ts';
import { Vector2 } from '@/PaleGL/math/Vector2';

// export class TouchInputController extends AbstractInputController {
//     _tmpIsDown = false;
//     _tmpInputPosition = Vector2.zero;
// 
//     constructor() {
//         super();
//     }
// 
//     start() {
//         window.addEventListener('touchstart', this._onTouchStart.bind(this));
//         window.addEventListener('touchmove', this._onTouchMove.bind(this));
//         window.addEventListener('touchend', this._onTouchEnd.bind(this));
//     }
// 
//     update() {
//         this.updateInternal({
//             inputPosition: this._tmpInputPosition,
//             isDown: this._tmpIsDown,
//         });
//     }
// 
//     _onTouchStart(e: TouchEvent) {
//         this._tmpIsDown = true;
//         const t = e.touches[0];
//         this.setInputPosition(t.clientX, t.clientY);
//     }
// 
//     _onTouchMove(e: TouchEvent) {
//         const t = e.touches[0];
//         this.setInputPosition(t.clientX, t.clientY);
//     }
// 
//     _onTouchEnd(e: TouchEvent) {
//         this._tmpIsDown = false;
//         const t = e.touches[0];
//         this.setInputPosition(t.clientX, t.clientY);
//         // this.setInputPosition(-Infinity, -Infinity);
//     }
// 
//     setInputPosition(x: number, y: number) {
//         this._tmpInputPosition.set(x, y);
//     }
// 
//     dispose() {
//         window.removeEventListener('touchstart', this._onTouchStart.bind(this));
//         window.removeEventListener('touchmove', this._onTouchMove.bind(this));
//         window.removeEventListener('touchend', this._onTouchEnd.bind(this));
//     }
// }


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
