import {createAbstractInputController} from '@/PaleGL/inputs/abstractInputController.ts';
import { Vector2 } from '@/PaleGL/math/Vector2';

// export class MouseInputController extends AbstractInputController {
//     _tmpIsDown = false;
//     _tmpInputPosition = Vector2.zero;
// 
//     constructor() {
//         super();
//     }
// 
//     start() {
//         window.addEventListener('mousedown', this._onMouseDown.bind(this));
//         window.addEventListener('mousemove', this._onMouseMove.bind(this));
//         window.addEventListener('mouseup', this._onMouseUp.bind(this));
//     }
// 
//     update() {
//         this.updateInternal({
//             inputPosition: this._tmpInputPosition,
//             isDown: this._tmpIsDown,
//         });
//     }
// 
//     _onMouseDown(e: MouseEvent) {
//         this._tmpIsDown = true;
//         this.setInputPosition(e.clientX, e.clientY);
//     }
// 
//     _onMouseMove(e: MouseEvent) {
//         this.setInputPosition(e.clientX, e.clientY);
//     }
// 
//     _onMouseUp(e: MouseEvent) {
//         this._tmpIsDown = false;
//         this.setInputPosition(e.clientX, e.clientY);
//         // this.setInputPosition(-Infinity, -Infinity);
//     }
// 
//     setInputPosition(x: number, y: number) {
//         this._tmpInputPosition.set(x, y);
//     }
// 
//     dispose() {
//         window.removeEventListener('mousedown', this._onMouseDown.bind(this));
//         window.removeEventListener('mousemove', this._onMouseMove.bind(this));
//         window.removeEventListener('mouseup', this._onMouseUp.bind(this));
//     }
// }

export function createMouseInputController() {
    let _tmpIsDown = false;
    const _tmpInputPosition = Vector2.zero;

    const inputController = createAbstractInputController();
    
    const start = () => {
        window.addEventListener('mousedown', _onMouseDown);
        window.addEventListener('mousemove', _onMouseMove);
        window.addEventListener('mouseup', _onMouseUp);
    }

    const update = () => {
        inputController.updateInternal({
            inputPosition: _tmpInputPosition,
            isDown: _tmpIsDown,
        });
    }

    const _onMouseDown = (e: MouseEvent) => {
        _tmpIsDown = true;
        _setInputPosition(e.clientX, e.clientY);
    }

    const _onMouseMove = (e: MouseEvent) => {
        _setInputPosition(e.clientX, e.clientY);
    }

    const _onMouseUp = (e: MouseEvent) => {
        _tmpIsDown = false;
        _setInputPosition(e.clientX, e.clientY);
        // this.setInputPosition(-Infinity, -Infinity);
    }

    const _setInputPosition = (x: number, y: number) => {
        _tmpInputPosition.set(x, y);
    }

    const dispose = () => {
        window.removeEventListener('mousedown', _onMouseDown);
        window.removeEventListener('mousemove', _onMouseMove);
        window.removeEventListener('mouseup', _onMouseUp);
    }
    
    return {
        ...inputController,
        start,
        update,
        dispose,
    }
}
