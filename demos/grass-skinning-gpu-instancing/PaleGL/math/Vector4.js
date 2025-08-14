
export class Vector4 {
    #elements;
    
    constructor(x, y, z, w) {
        this.set(x, y, z, w);
    }
    
    get x() {
        return this.#elements[0];
    }
    
    get y() {
        return this.#elements[1];
    }

    get z() {
        return this.#elements[2];
    }

    get w() {
        return this.#elements[3];
    }
    
    set(x, y, z, w) {
        this.#elements = new Float32Array([x, y, z, w]);
    }
}