import { Vector2 } from '@/PaleGL/math/Vector2';

export class AbstractInputController {
    #beforeInputPosition = Vector2.zero;
    #currentInputPosition = Vector2.zero;
    #deltaInputPosition = Vector2.zero;
    #deltaNormalizedInputPosition = Vector2.zero;

    #isPressed = false;
    #isDown = false;
    #isReleased = false;

    #width: number = 0;
    #height: number = 0;

    get isUp() {
        return !this.#isDown;
    }

    get isPressed() {
        return this.#isPressed;
    }

    get isDown() {
        return this.#isDown;
    }

    get isReleased() {
        return this.#isReleased;
    }

    get deltaNormalizedInputPosition() {
        return this.#deltaNormalizedInputPosition;
    }

    constructor() {
        this.clearInputPositions();
    }

    start() {
        throw "[AbstractInputController] should implementation 'start' method.";
    }

    setSize(width: number, height: number) {
        this.#width = width;
        this.#height = height;
    }

    // inputPosition ... v2
    // isDown ... bool
    updateInternal({ inputPosition, isDown }: { inputPosition: Vector2; isDown: boolean }) {
        this.#updateState(isDown);
        this.#updateInputPositions(inputPosition);
    }

    #updateState(isDown: boolean) {
        const isBeforeDown = this.isDown;
        this.#isDown = isDown;

        // pressed
        if (!isBeforeDown && this.isDown) {
            this.#isPressed = true;
            this.#isReleased = false;
            return;
        }
        // down
        if (!isBeforeDown && this.isDown) {
            this.#isPressed = false;
            this.#isReleased = false;
            return;
        }
        // released
        if (isBeforeDown && !this.isDown) {
            this.#isPressed = false;
            this.#isReleased = true;
            return;
        }
        // up
        this.#isPressed = false;
        this.#isReleased = false;
    }

    #updateInputPositions(inputPosition: Vector2) {
        // up
        if (this.isUp) {
            this.clearInputPositions();
            return;
        }
        // pressed
        if (this.isPressed) {
            this.#currentInputPosition.copy(inputPosition);
            this.#beforeInputPosition.copy(this.#currentInputPosition);
            this.#deltaInputPosition.set(0, 0);
            this.#deltaNormalizedInputPosition.set(0, 0);
            return;
        }
        // move
        this.#beforeInputPosition.copy(this.#currentInputPosition);
        this.#currentInputPosition.copy(inputPosition);
        const diff = Vector2.subVectors(this.#currentInputPosition, this.#beforeInputPosition);
        this.#deltaInputPosition.copy(diff);
        this.#deltaNormalizedInputPosition.set(
            this.#deltaInputPosition.x / this.#width,
            this.#deltaInputPosition.y / this.#height
        );
    }

    clearInputPositions() {
        this.#beforeInputPosition.set(-Infinity, -Infinity);
        this.#currentInputPosition.set(-Infinity, -Infinity);
        this.#deltaInputPosition.set(-Infinity, -Infinity);
        this.#deltaNormalizedInputPosition.set(-Infinity, -Infinity);
    }

    dispose() {}
}
