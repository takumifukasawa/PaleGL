export class Vector4 {
    elements: Float32Array = new Float32Array(4);

    constructor(x: number, y: number, z: number, w: number) {
        this.set(x, y, z, w);
    }
    
    static get one() {
        return new Vector4(1, 1, 1, 1);
    }
    
    static get zero() {
        return new Vector4(0, 0, 0, 0);
    }

    get x() {
        return this.elements[0];
    }

    get y() {
        return this.elements[1];
    }

    get z() {
        return this.elements[2];
    }

    get w() {
        return this.elements[3];
    }

    set(x: number, y: number, z: number, w: number) {
        this.elements = new Float32Array([x, y, z, w]);
    }
}
