export class Vector3 {
    #elements;
    
    get x() {
        return this.elements[0];
    }

    get y() {
        return this.elements[1];
    }

    get z() {
        return this.elements[2];
    }
    
    constructor(x, y, z) {
        this.elements = new Float32Array([x, y, z]);
    }
    
}