import {AbstractInputController} from "./AbstractInputController";
import {Vector2} from "../math/Vector2";

export class MouseInputController extends AbstractInputController {
    #tmpIsDown = false;
    #tmpInputPosition = Vector2.zero;
    
    constructor() {
        super();
    }
    
    start() {
        window.addEventListener('mousedown', this.#onMouseDown.bind(this));
        window.addEventListener('mousemove', this.#onMouseMove.bind(this));
        window.addEventListener('mouseup', this.#onMouseUp.bind(this));
    }
    
    fixedUpdate() {
        this.updateInternal({
            inputPosition: this.#tmpInputPosition,
            isDown: this.#tmpIsDown
        });
    }

    #onMouseDown(e) {
        this.#tmpIsDown = true;
        this.setInputPosition(e.clientX, e.clientY);
    }

    #onMouseMove(e) {
        this.setInputPosition(e.clientX, e.clientY);
    }

    #onMouseUp() {
        this.#tmpIsDown = false;
        this.setInputPosition(-Infinity, -Infinity);
    }

    setInputPosition(x, y) {
        this.#tmpInputPosition.set(x, y);
    }

    dispose() {
        window.removeEventListener('mousedown', this.#onMouseDown.bind(this));
        window.removeEventListener('mousemove', this.#onMouseMove.bind(this));
        window.removeEventListener('mouseup', this.#onMouseUp.bind(this));
    }
}
