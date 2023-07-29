import { AbstractInputController } from '@/PaleGL/inputs/AbstractInputController';
import { Vector2 } from '@/PaleGL/math/Vector2';

export class TouchInputController extends AbstractInputController {
    #tmpIsDown = false;
    #tmpInputPosition = Vector2.zero;

    constructor() {
        super();
    }

    start() {
        window.addEventListener('touchstart', this.#onTouchStart.bind(this));
        window.addEventListener('touchmove', this.#onTouchMove.bind(this));
        window.addEventListener('touchend', this.#onTouchEnd.bind(this));
    }

    fixedUpdate() {
        this.updateInternal({
            inputPosition: this.#tmpInputPosition,
            isDown: this.#tmpIsDown,
        });
    }

    #onTouchStart(e: TouchEvent) {
        this.#tmpIsDown = true;
        const t = e.touches[0];
        this.setInputPosition(t.clientX, t.clientY);
    }

    #onTouchMove(e: TouchEvent) {
        const t = e.touches[0];
        this.setInputPosition(t.clientX, t.clientY);
    }

    #onTouchEnd() {
        this.#tmpIsDown = false;
        this.setInputPosition(-Infinity, -Infinity);
    }

    setInputPosition(x: number, y: number) {
        this.#tmpInputPosition.set(x, y);
    }

    dispose() {
        window.removeEventListener('touchstart', this.#onTouchStart.bind(this));
        window.removeEventListener('touchmove', this.#onTouchMove.bind(this));
        window.removeEventListener('touchend', this.#onTouchEnd.bind(this));
    }
}
