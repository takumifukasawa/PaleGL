import {Vector2} from "../math/Vector2.js";

export class AbstractInputController {
    #_beforeInputPosition = Vector2.zero;
    #_currentInputPosition = Vector2.zero;
    #_deltaInputPosition = Vector2.zero;
    #_deltaNormalizedInputPosition = Vector2.zero;
    
    #_isPressed = false;
    #_isDown = false;
    #_isReleased = false;
    
    #width;
    #height;
    
    get isUp() {
        return !this.#_isDown;
    }
    
    get isPressed() {
        return this.#_isPressed;
    }

    get isDown() {
        return this.#_isDown;
    }
    
    get isReleased() {
        return this.#_isReleased;
    }
    
    get deltaNormalizedInputPosition() {
        return this.#_deltaNormalizedInputPosition;
    }

    constructor() {
        this.clearInputPositions();
    }

    start() {
        throw "[AbstractInputController] should implementation 'start' method.";
    }
    
    setSize(width, height) {
        this.#width = width;
        this.#height = height;
    }

    // inputPosition ... v2
    // isDown ... bool
    updateInternal({ inputPosition, isDown }) {
        this.#updateState(isDown);
        this.#updateInputPositions(inputPosition);
    }
   
    #updateState(isDown) {
        const isBeforeDown = this.isDown;
        this.#_isDown = isDown;

        // pressed
        if(!isBeforeDown && this.isDown) {
            this.#_isPressed = true;
            this.#_isReleased = false;
            return;
        }
        // down
        if(!isBeforeDown && this.isDown) {
            this.#_isPressed = false;
            this.#_isReleased = false;
            return;
        }
        // released
        if(isBeforeDown && !this.isDown) {
            this.#_isPressed = false;
            this.#_isReleased = true;
            return;
        }
        // up 
        this.#_isPressed = false;
        this.#_isReleased = false;
    }

    #updateInputPositions(inputPosition) {
        // up
        if(this.isUp) {
            this.clearInputPositions();
            return;
        }
        // pressed
        if(this.isPressed) {
            this.#_currentInputPosition.copy(inputPosition);
            this.#_beforeInputPosition.copy(this.#_currentInputPosition);
            this.#_deltaInputPosition.set(0, 0);
            this.#_deltaNormalizedInputPosition.set(0, 0);
            return;
        }
        // move
        this.#_beforeInputPosition.copy(this.#_currentInputPosition);
        this.#_currentInputPosition.copy(inputPosition);
        const diff = Vector2.subVectors(this.#_currentInputPosition, this.#_beforeInputPosition);
        this.#_deltaInputPosition.copy(diff);
        this.#_deltaNormalizedInputPosition.set(
            this.#_deltaInputPosition.x / this.#width,
            this.#_deltaInputPosition.y / this.#height
        );
    }
  
    clearInputPositions() {
        this.#_beforeInputPosition.set(-Infinity, -Infinity);
        this.#_currentInputPosition.set(-Infinity, -Infinity);
        this.#_deltaInputPosition.set(-Infinity, -Infinity);
        this.#_deltaNormalizedInputPosition.set(-Infinity, -Infinity);
    }

    dispose() {}
}