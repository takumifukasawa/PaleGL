export class Vector4 {
    private elements: Float32Array = new Float32Array(4);

    constructor(x: number, y: number, z: number, w: number) {
        this.set(x, y, z, w);
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
