import {Matrix4} from "@/PaleGL/math/Matrix4.ts";

export class Vector4 {
    e: Float32Array = new Float32Array(4);

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
        return this.e[0];
    }

    get y() {
        return this.e[1];
    }

    get z() {
        return this.e[2];
    }

    get w() {
        return this.e[3];
    }

    set x(value) {
        this.e[0] = value;
    }

    set y(value) {
        this.e[1] = value;
    }

    set z(value) {
        this.e[2] = value;
    }

    set w(value) {
        this.e[3] = value;
    }

    set(x: number, y: number, z: number, w: number) {
        this.e = new Float32Array([x, y, z, w]);
    }


    multiplyMatrix4(m: Matrix4) {
        const tmpX = this.x;
        const tmpY = this.y;
        const tmpZ = this.z;
        const tmpW = this.w;
        const x = m.m00 * tmpX + m.m01 * tmpY + m.m02 * tmpZ + m.m03 * tmpW;
        const y = m.m10 * tmpX + m.m11 * tmpY + m.m12 * tmpZ + m.m13 * tmpW;
        const z = m.m20 * tmpX + m.m21 * tmpY + m.m22 * tmpZ + m.m23 * tmpW;
        const w = m.m30 * tmpX + m.m31 * tmpY + m.m32 * tmpZ + m.m33 * tmpW;
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }
}
