import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';

export class Quaternion {
    elements: Float32Array = new Float32Array(4);

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

    constructor(x: number, y: number, z: number, w: number) {
        this.set(x, y, z, w);
    }

    set(x: number, y: number, z: number, w: number) {
        this.elements = new Float32Array([x, y, z, w]);
        return this;
    }
  
    // ref:
    // https://zenn.dev/mebiusbox/books/132b654aa02124/viewer/2966c7
    toRotationMatrix() {
        const xy2 = this.x * this.y * 2;
        const xz2 = this.x * this.z * 2;
        const xw2 = this.x * this.w * 2;
        const yz2 = this.y * this.z * 2;
        const yw2 = this.y * this.w * 2;
        const zw2 = this.z * this.w * 2;
        // const ww2 = this.w * this.w * 2;
        
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = this.w;
        
        const m00 = w * w + x * x - y * y - z * z;
        const m01 = xy2 - zw2;
        const m02 = xz2 + yw2;
        const m03 = 0;
        
        const m10 = xy2 + zw2;
        const m11 = w * w - x * x + y * y - z * z;
        const m12 = yz2 - xw2;
        const m13 = 0;
        
        const m20 = xz2 - yw2;
        const m21 = yz2 + xw2;
        const m22 = w * w - x * x - y * y + z * z;
        const m23 = 0;
        
        const m30 = 0;
        const m31 = 0;
        const m32 = 0;
        const m33 = 1;
        
        return new Matrix4(
            m00, m01, m02, m03,
            m10, m11, m12, m13,
            m20, m21, m22, m23,
            m30, m31, m32, m33
        );
    }

    // ref:
    // - https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles#Quaternion_to_Euler_angles_conversion
    // - https://github.com/infusion/Quaternion.js/blob/master/quaternion.js
    // - https://qiita.com/aa_debdeb/items/3d02e28fb9ebfa357eaf
    toEulerRadian() {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = this.w;
        const wx = w * x;
        const wy = w * y;
        const wz = w * z;
        const ww = w * w;
        const xx = x * x;
        const xy = x * y;
        const xz = x * z;
        const yy = y * y;
        const yz = y * z;
        const zz = z * z;

        const isOtherWise = Math.cos(x) === 0;
       
        // TODO: fallback
        // const sx = 2 * x * z + 2 * x * w;
        // const unlocked = Math.abs(sx) < .9999;

        const asin = (t: number) => {
            // prettier-ignore
            return t >= 1 ? Math.PI / 2 : (t <= -1 ? -Math.PI / 2 : Math.asin(t));
        };

        return {
            // x: -Math.atan2(2 * (xy - wz), 1 - 2 * (xx + zz)),
            // y: asin(2 * (yz + wx)), // default
            // z: -Math.atan2(2 * (xz - wy), 1 - 2 * (xx + yy)),
            x: asin(2 * yz + 2 * wx),
            y: !isOtherWise ? Math.atan2(-(2 * xz - 2 * wy), 2 * ww + 2 * zz - 1) : 0,
            z: !isOtherWise
                ? Math.atan2(-(2 * xy - 2 * wz), 2 * ww + 2 * yy - 1)
                : Math.atan2(2 * xy + 2 * wz, 2 * ww + 2 * xx - 1),
        };
    }

    toEulerDegree() {
        const rad = this.toEulerRadian();
        return {
            x: (rad.x * 180) / Math.PI,
            y: (rad.y * 180) / Math.PI,
            z: (rad.z * 180) / Math.PI,
        };
    }

    static fromEulerRadians(x: number, y: number, z: number) {
        const cxh = Math.cos(x / 2);
        const sxh = Math.sin(x / 2);
        const cyh = Math.cos(y / 2);
        const syh = Math.sin(y / 2);
        const czh = Math.cos(z / 2);
        const szh = Math.sin(z / 2);

        const qx = -cxh * syh * szh + sxh * cyh * czh;
        const qy = cxh * syh * czh + sxh * cyh * szh;
        const qz = sxh * syh * czh + cxh * cyh * szh;
        const qw = -sxh * syh * szh + cxh * cyh * czh;

        return new Quaternion(qx, qy, qz, qw);
    }

    static fromEulerDegrees(x: number, y: number, z: number) {
        return Quaternion.fromEulerRadians((x * Math.PI) / 180, (y * Math.PI) / 180, (z * Math.PI) / 180);
    }

    toMatrix4() {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = this.w;

        const wx = w * x;
        const wy = w * y;
        const wz = w * z;
        const xx = x * x;
        const xy = x * y;
        const xz = x * z;
        const yy = y * y;
        const yz = y * z;
        const zz = z * z;

        // prettier-ignore
        return new Matrix4(
            1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), 0,
            2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), 0,
            2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), 0,
            0, 0, 0, 1
        );
    }

    invertAxis() {
        return new Quaternion(-this.x, -this.y, -this.z, this.w);
    }

    static identity() {
        return new Quaternion(0, 0, 0, 1);
    }
}
