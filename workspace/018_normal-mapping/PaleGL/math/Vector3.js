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
    
    add(s) {
        this.x += s;
        this.y += s;
        this.z += s;
        return this;
    }
    
    negate() {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        return this;
    }
    
    scale(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }
    
    clone() {
        return new Vector3(this.x, this.y, this.z);
    }
    
    multiplyMatrix4(m) {
        const tmpX = this.x;
        const tmpY = this.y;
        const tmpZ = this.z;
        const tmpW = 1;
        const x = m.m00 * tmpX + m.m01 * tmpY + m.m02 * tmpZ + m.m03 * tmpW;
        const y = m.m10 * tmpX + m.m11 * tmpY + m.m12 * tmpZ + m.m13 * tmpW;
        const z = m.m20 * tmpX + m.m21 * tmpY + m.m22 * tmpZ + m.m23 * tmpW;
        const w = m.m30 * tmpX + m.m31 * tmpY + m.m32 * tmpZ + m.m33 * tmpW;
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    
    equals(v) {
        const eps = 0.0000001;
        const flag = 
            Math.abs(this.x - v.x) < eps &&
            Math.abs(this.y - v.y) < eps &&
            Math.abs(this.z - v.z) < eps;
        return flag;
    }
    
    static zero() {
        return new Vector3(0, 0, 0);
    }

    static one() {
        return new Vector3(1, 1, 1);
    }
    
    static up() {
        return new Vector3(0, 1, 0);
    }
    
    static down() {
        return new Vector3(0, -1, 0);
    }
    
    static back() {
        return new Vector3(0, 0, -1);
    }
    
    static forward() {
        return new Vector3(0, 0, 1);
    }
    
    static right() {
        return new Vector3(1, 0, 0);
    }

    static left() {
        return new Vector3(-1, 0, 0);
    }
    
    static fromArray(arr) {
        return new Vector3(arr[0], arr[1], arr[2]);
    }
    
    static addVectors(...vectors) {
        const v = Vector3.zero();
        vectors.forEach(elem => {
            v.x += elem.x;
            v.y += elem.y;
            v.z += elem.z;
        });
        return v;
    }
    
    static subVectors(v1, v2) {
        return new Vector3(
            v1.x - v2.x,
            v1.y - v2.y,
            v1.z - v2.z
        );
    }
   
    // v1 x v2
    static crossVectors(v1, v2) {
        return new Vector3(
            v1.y * v2.z - v1.z * v2.y,
            v1.z * v2.x - v1.x * v2.z,
            v1.x * v2.y - v1.y * v2.x
        );
    }
 
    // TODO: かなり簡易的なtangentで正確ではないのでちゃんと生成する
    static getTangent(n) {
        if(n.equals(Vector3.up())) {
            return Vector3.right();
        }
        if(n.equals(Vector3.down())) {
            return Vector3.right();
        }
        return Vector3.crossVectors(n, Vector3.down());
    }

    static getBinormalFromTangent(t, n) {
        // if(t.equals(Vector3.right())) {
        //     return Vector3.forward();
        // }
        // if(t.equals(Vector3.left())) {
        //     return Vector3.back();
        // }
        // return Vector3.crossVectors(t, n);
        return Vector3.crossVectors(t, n.clone().negate());
    }
    
    static fill(value) {
        return new Vector3(value, value, value);
    }
    
    log() {
         // col order to row order
        console.log(`--------------------
${this.x}, ${this.y}, ${this.z}
--------------------`);       
    }
}