export class Vector3 {
    #elements;
    
    get x() {
        return this.#elements[0];
    }

    get y() {
        return this.#elements[1];
    }

    get z() {
        return this.#elements[2];
    }
    
    set x(value) {
        this.#elements[0] = value;
    }

    set y(value) {
        this.#elements[1] = value;
    }

    set z(value) {
        this.#elements[2] = value;
    }
    
    constructor(x, y, z) {
        this.set(x, y, z);
    }
    
    set(x, y, z) {
        this.#elements = new Float32Array([x, y, z]);
    }
    
    static zero() {
        return new Vector3(0, 0, 0);
    }

    static one() {
        return new Vector3(1, 1, 1);
    }
}