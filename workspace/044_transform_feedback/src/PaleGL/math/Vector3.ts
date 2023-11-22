import { Matrix4 } from '@/PaleGL/math/Matrix4';

export class Vector3 {
    elements: Float32Array = new Float32Array(3);

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

    get magnitude() {
        const eps = 0.0001;
        return Math.max(eps, Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z));
    }

    constructor(x: number, y: number, z: number) {
        this.set(x, y, z);
    }

    set(x: number, y: number, z: number) {
        this.elements = new Float32Array([x, y, z]);
        return this;
    }

    normalize() {
        // const eps = 0.0001;
        // const length = Math.max(eps, Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z));
        const mag = this.magnitude;
        this.x = this.x / mag;
        this.y = this.y / mag;
        this.z = this.z / mag;
        return this;
    }

    add(s: number) {
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

    scale(s: number) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    multiplyMatrix4(m: Matrix4) {
        const tmpX = this.x;
        const tmpY = this.y;
        const tmpZ = this.z;
        const tmpW = 1;
        const x = m.m00 * tmpX + m.m01 * tmpY + m.m02 * tmpZ + m.m03 * tmpW;
        const y = m.m10 * tmpX + m.m11 * tmpY + m.m12 * tmpZ + m.m13 * tmpW;
        const z = m.m20 * tmpX + m.m21 * tmpY + m.m22 * tmpZ + m.m23 * tmpW;
        // const w = m.m30 * tmpX + m.m31 * tmpY + m.m32 * tmpZ + m.m33 * tmpW;
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    
    static multiplyVectors(v1: Vector3, v2: Vector3) {
        return new Vector3(
            v1.x * v2.x,
            v1.y * v2.y,
            v1.z * v2.z
        );
    }

    equals(v: Vector3) {
        const eps = 0.0000001;
        const flag = Math.abs(this.x - v.x) < eps && Math.abs(this.y - v.y) < eps && Math.abs(this.z - v.z) < eps;
        return flag;
    }

    static get zero() {
        return new Vector3(0, 0, 0);
    }

    static get one() {
        return new Vector3(1, 1, 1);
    }

    static get up() {
        return new Vector3(0, 1, 0);
    }

    static get down() {
        return new Vector3(0, -1, 0);
    }

    static get back() {
        return new Vector3(0, 0, -1);
    }

    static get forward() {
        return new Vector3(0, 0, 1);
    }

    static get right() {
        return new Vector3(1, 0, 0);
    }

    static get left() {
        return new Vector3(-1, 0, 0);
    }

    static fromArray(arr: number[]) {
        return new Vector3(arr[0], arr[1], arr[2]);
    }

    static addVectors(...vectors: Vector3[]) {
        const v = Vector3.zero;
        vectors.forEach((elem) => {
            v.x += elem.x;
            v.y += elem.y;
            v.z += elem.z;
        });
        return v;
    }

    static subVectors(v1: Vector3, v2: Vector3) {
        return new Vector3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
    }

    // v1 x v2
    static crossVectors(v1: Vector3, v2: Vector3) {
        return new Vector3(v1.y * v2.z - v1.z * v2.y, v1.z * v2.x - v1.x * v2.z, v1.x * v2.y - v1.y * v2.x);
    }

    static rotateVectorX(v: Vector3, degree: number) {
        const x = v.x;
        const y = v.y;
        const z = v.z;
        const rad = (degree / 180) * Math.PI;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const rx = x;
        const ry = y * c + z * -s;
        const rz = y * s + z * c;
        return new Vector3(rx, ry, rz);
    }

    static rotateVectorY(v: Vector3, degree: number) {
        const x = v.x;
        const y = v.y;
        const z = v.z;
        const rad = (degree / 180) * Math.PI;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const rx = x * c + z * s;
        const ry = y;
        const rz = x * -s + z * c;
        return new Vector3(rx, ry, rz);
    }

    static rotateVectorZ(v: Vector3, degree: number) {
        const x = v.x;
        const y = v.y;
        const z = v.z;
        const rad = (degree / 180) * Math.PI;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const rx = x * c + y * -s;
        const ry = x * s + y * s;
        const rz = z;
        return new Vector3(rx, ry, rz);
    }

    // TODO: かなり簡易的なtangentで正確ではないのでちゃんと生成する
    static getTangent(n: Vector3) {
        if (n.equals(Vector3.up)) {
            return Vector3.right;
        }
        if (n.equals(Vector3.down)) {
            return Vector3.right;
        }
        return Vector3.crossVectors(n, Vector3.down);
    }

    static getBinormalFromTangent(t: Vector3, n: Vector3) {
        return Vector3.crossVectors(t, n.clone().negate());
    }

    static fill(value: number) {
        return new Vector3(value, value, value);
    }

    static lerpVectors(v1: Vector3, v2: Vector3, r: number) {
        return new Vector3(v1.x + (v2.x - v1.x) * r, v1.y + (v2.y - v1.y) * r, v1.z + (v2.z - v1.z) * r);
    }

    log() {
        console.log(`--------------------
${this.x}, ${this.y}, ${this.z}
--------------------`);
    }
}
