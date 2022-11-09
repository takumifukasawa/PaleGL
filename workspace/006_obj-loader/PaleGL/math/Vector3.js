export class Vector3 {
    elements;
    
    get x() {
        return this.elements[0];
    }

    get y() {
        return this.elements[1];
    }

    get z() {
        return this.elements[2];
    }
    
    set x(value) {
        this.elements[0] = value;
    }

    set y(value) {
        this.elements[1] = value;
    }

    set z(value) {
        this.elements[2] = value;
    }
    
    constructor(x, y, z) {
        this.set(x, y, z);
    }
    
    set(x, y, z) {
        this.elements = new Float32Array([x, y, z]);
        return this;
    }
    
    normalize() {
        const eps = 0.0001;
        const length = Math.max(eps, Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z));
        this.x = this.x / length;
        this.y = this.y / length;
        this.z = this.z / length;
        return this;
    }
    
    negate() {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        return this;
    }
    
    static zero() {
        return new Vector3(0, 0, 0);
    }

    static one() {
        return new Vector3(1, 1, 1);
    }
    
    static addVectors(v1, v2) {
        return new Vector3(
            v1.x + v2.x,
            v1.y + v2.y,
            v1.z + v2.z
        );
    }
    
    static subVectors(v1, v2) {
        return new Vector3(
            v1.x - v2.x,
            v1.y - v2.y,
            v1.z - v2.z
        );
    }
    
    static crossVectors(v1, v2) {
        return new Vector3(
            v1.y * v2.z - v1.z * v2.y,
            v1.z * v2.x - v1.x * v2.z,
            v1.x * v2.y - v1.y * v2.x
        );
    }
    
    log() {
         // col order to row order
        console.log(`--------------------
${this.x}, ${this.y}, ${this.z}
--------------------`);       
    }
}