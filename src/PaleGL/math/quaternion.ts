// import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
// 
// export class Quaternion {
//     e: Float32Array = new Float32Array(4);
// 
//     get x() {
//         return this.e[0];
//     }
// 
//     get y() {
//         return this.e[1];
//     }
// 
//     get z() {
//         return this.e[2];
//     }
// 
//     get w() {
//         return this.e[3];
//     }
// 
//     constructor(x: number, y: number, z: number, w: number) {
//         this.set(x, y, z, w);
//     }
// 
//     set(x: number, y: number, z: number, w: number) {
//         this.e = new Float32Array([x, y, z, w]);
//         return this;
//     }
//     
//     copy(q: Quaternion) {
//         this.e = new Float32Array(q.e);
//         return this;
//     }
//   
//     // ref:
//     // https://zenn.dev/mebiusbox/books/132b654aa02124/viewer/2966c7
//     toRotationMatrix() {
//         const x = this.x;
//         const y = this.y;
//         const z = this.z;
//         const w = this.w;
//         
//         // const xy2 = this.x * this.y * 2;
//         // const xz2 = this.x * this.z * 2;
//         // const xw2 = this.x * this.w * 2;
//         // const yz2 = this.y * this.z * 2;
//         // const yw2 = this.y * this.w * 2;
//         // const zw2 = this.z * this.w * 2;
//         // // const ww2 = this.w * this.w * 2;
//         // 
//         // const m00 = w * w + x * x - y * y - z * z;
//         // const m01 = xy2 - zw2;
//         // const m02 = xz2 + yw2;
//         // const m03 = 0;
//         // 
//         // const m10 = xy2 + zw2;
//         // const m11 = w * w - x * x + y * y - z * z;
//         // const m12 = yz2 - xw2;
//         // const m13 = 0;
//         // 
//         // const m20 = xz2 - yw2;
//         // const m21 = yz2 + xw2;
//         // const m22 = w * w - x * x - y * y + z * z;
//         // const m23 = 0;
//         // 
//         // const m30 = 0;
//         // const m31 = 0;
//         // const m32 = 0;
//         // const m33 = 1;
//         // 
//         // return new Matrix4(
//         //     m00, m01, m02, m03,
//         //     m10, m11, m12, m13,
//         //     m20, m21, m22, m23,
//         //     m30, m31, m32, m33
//         // );
//         
//         const m00 = 2 * w * w + 2 * x * x - 1;
//         const m01 = 2 * x * y - 2 * z * w;
//         const m02 = 2 * x * z + 2 * y * w;
//         const m03 = 0;
//         
//         const m10 = 2 * x * y + 2 * z * w;
//         const m11 = 2 * w * w + 2 * y * y - 1;
//         const m12 = 2 * y * z - 2 * x * w;
//         const m13 = 0;
//         
//         const m20 = 2 * x * z - 2 * y * w;
//         const m21 = 2 * y * z + 2 * x * w;
//         const m22 = 2 * w * w + 2 * z * z - 1;
//         const m23 = 0;
//         
//         const m30 = 0;
//         const m31 = 0;
//         const m32 = 0;
//         const m33 = 1;
//         
//         return new Matrix4(
//             m00, m01, m02, m03,
//             m10, m11, m12, m13,
//             m20, m21, m22, m23,
//             m30, m31, m32, m33
//         );
//         
//     }
//     
//     static rotationMatrixToQuaternion(mat: Matrix4) {
//         const m00 = mat.m00;
//         const m11 = mat.m11;
//         const m22 = mat.m22;
//         
//         const trace = m00 + m11 + m22;
//         
//         let x = 0;
//         let y = 0;
//         let z = 0;
//         let w = 0;
//         
//         if (trace > 0) {
//             const s = Math.sqrt(trace + 1.0) * 2;
//             w = 0.25 * s;
//             x = (mat.m21 - mat.m12) / s;
//             y = (mat.m02 - mat.m20) / s;
//             z = (mat.m10 - mat.m01) / s;
//         } else if (m00 > m11 && m00 > m22) {
//             const s = Math.sqrt(1.0 + m00 - m11 - m22) * 2;
//             w = (mat.m21 - mat.m12) / s;
//             x = 0.25 * s;
//             y = (mat.m01 + mat.m10) / s;
//             z = (mat.m02 + mat.m20) / s;
//         } else if (m11 > m22) {
//             const s = Math.sqrt(1.0 + m11 - m00 - m22) * 2;
//             w = (mat.m02 - mat.m20) / s;
//             x = (mat.m01 + mat.m10) / s;
//             y = 0.25 * s;
//             z = (mat.m12 + mat.m21) / s;
//         } else {
//             const s = Math.sqrt(1.0 + m22 - m00 - m11) * 2;
//             w = (mat.m10 - mat.m01) / s;
//             x = (mat.m02 + mat.m20) / s;
//             y = (mat.m12 + mat.m21) / s;
//             z = 0.25 * s;
//         }
//         
//         return new Quaternion(x, y, z, w);
//     }
// 
//     // ref:
//     // - https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles#Quaternion_to_Euler_angles_conversion
//     // - https://github.com/infusion/Quaternion.js/blob/master/quaternion.js
//     // - https://qiita.com/aa_debdeb/items/3d02e28fb9ebfa357eaf
//     toEulerRadian() {
//         const x = this.x;
//         const y = this.y;
//         const z = this.z;
//         const w = this.w;
//         const wx = w * x;
//         const wy = w * y;
//         const wz = w * z;
//         const ww = w * w;
//         const xx = x * x;
//         const xy = x * y;
//         const xz = x * z;
//         const yy = y * y;
//         const yz = y * z;
//         const zz = z * z;
// 
//         const isOtherWise = Math.cos(x) === 0;
//        
//         // TODO: fallback
//         // const sx = 2 * x * z + 2 * x * w;
//         // const unlocked = Math.abs(sx) < .9999;
// 
//         const asin = (t: number) => {
//             // prettier-ignore
//             return t >= 1 ? Math.PI / 2 : (t <= -1 ? -Math.PI / 2 : Math.asin(t));
//         };
// 
//         return {
//             // x: -Math.atan2(2 * (xy - wz), 1 - 2 * (xx + zz)),
//             // y: asin(2 * (yz + wx)), // default
//             // z: -Math.atan2(2 * (xz - wy), 1 - 2 * (xx + yy)),
//             x: asin(2 * yz + 2 * wx),
//             y: !isOtherWise ? Math.atan2(-(2 * xz - 2 * wy), 2 * ww + 2 * zz - 1) : 0,
//             z: !isOtherWise
//                 ? Math.atan2(-(2 * xy - 2 * wz), 2 * ww + 2 * yy - 1)
//                 : Math.atan2(2 * xy + 2 * wz, 2 * ww + 2 * xx - 1),
//         };
//     }
// 
//     toEulerDegree() {
//         const rad = this.toEulerRadian();
//         return {
//             x: (rad.x * 180) / Math.PI,
//             y: (rad.y * 180) / Math.PI,
//             z: (rad.z * 180) / Math.PI,
//         };
//     }
// 
//     // zxy
//     static fromEulerRadians(x: number, y: number, z: number) {
//         const cx = Math.cos(x / 2);
//         const sx = Math.sin(x / 2);
//         const cy = Math.cos(y / 2);
//         const sy = Math.sin(y / 2);
//         const cz = Math.cos(z / 2);
//         const sz = Math.sin(z / 2);
// 
//         // right hand zxy
//         // const qx = -cx * sy * sz + sx * cy * cz;
//         // const qy = cx * sy * cz + sx * cy * sz;
//         // const qz = sx * sy * cz + cx * cy * sz;
//         // const qw = -sx * sy * sz + cx * cy * cz;
// 
//         // left hand zxy   
//         const qw = cx * cy * cz - sx * sy * sz;
//         const qx = sx * cy * cz + cx * sy * sz;
//         const qy = cx * sy * cz - sx * cy * sz;
//         const qz = cx * cy * sz + sx * sy * cz;
// 
//         return new Quaternion(qx, qy, qz, qw);
//     }
// 
//     static fromEulerDegrees(x: number, y: number, z: number) {
//         return Quaternion.fromEulerRadians((x * Math.PI) / 180, (y * Math.PI) / 180, (z * Math.PI) / 180);
//     }
// 
//     toMatrix4() {
//         const x = this.x;
//         const y = this.y;
//         const z = this.z;
//         const w = this.w;
// 
//         const wx = w * x;
//         const wy = w * y;
//         const wz = w * z;
//         const xx = x * x;
//         const xy = x * y;
//         const xz = x * z;
//         const yy = y * y;
//         const yz = y * z;
//         const zz = z * z;
// 
//         // prettier-ignore
//         return new Matrix4(
//             1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), 0,
//             2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), 0,
//             2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), 0,
//             0, 0, 0, 1
//         );
//     }
// 
//     invertAxis() {
//         return new Quaternion(-this.x, -this.y, -this.z, this.w);
//     }
// 
//     static identity() {
//         return new Quaternion(0, 0, 0, 1);
//     }
// }


import {
    createMatrix4,
    mat4m00, mat4m01,
    mat4m02, mat4m10,
    mat4m11,
    mat4m12,
    mat4m20,
    mat4m21,
    mat4m22,
    Matrix4,
} from '@/PaleGL/math/Matrix4.ts';

export type Quaternion = { e :Float32Array };

export function createQuaternion(x: number, y: number, z: number, w: number) {
    return {e: new Float32Array([x, y, z, w])};
}

const qx = (q: Quaternion) => q.e[0];
const qy = (q: Quaternion) => q.e[1];
const qz = (q: Quaternion) => q.e[2];
const qw = (q: Quaternion) => q.e[3];

export function copyQuaternion(sq: Quaternion, tq: Quaternion) {
    sq.e = new Float32Array(tq.e);
    return sq;
}

// ref:
// https://zenn.dev/mebiusbox/books/132b654aa02124/viewer/2966c7
export function createRotationMatrixFromQuaternion(q: Quaternion) {
    const x = qx(q);
    const y = qy(q);
    const z = qz(q);
    const w = qw(q);

    // const xy2 = this.x * this.y * 2;
    // const xz2 = this.x * this.z * 2;
    // const xw2 = this.x * this.w * 2;
    // const yz2 = this.y * this.z * 2;
    // const yw2 = this.y * this.w * 2;
    // const zw2 = this.z * this.w * 2;
    // // const ww2 = this.w * this.w * 2;
    // 
    // const m00 = w * w + x * x - y * y - z * z;
    // const m01 = xy2 - zw2;
    // const m02 = xz2 + yw2;
    // const m03 = 0;
    // 
    // const m10 = xy2 + zw2;
    // const m11 = w * w - x * x + y * y - z * z;
    // const m12 = yz2 - xw2;
    // const m13 = 0;
    // 
    // const m20 = xz2 - yw2;
    // const m21 = yz2 + xw2;
    // const m22 = w * w - x * x - y * y + z * z;
    // const m23 = 0;
    // 
    // const m30 = 0;
    // const m31 = 0;
    // const m32 = 0;
    // const m33 = 1;
    // 
    // return new Matrix4(
    //     m00, m01, m02, m03,
    //     m10, m11, m12, m13,
    //     m20, m21, m22, m23,
    //     m30, m31, m32, m33
    // );

    const m00 = 2 * w * w + 2 * x * x - 1;
    const m01 = 2 * x * y - 2 * z * w;
    const m02 = 2 * x * z + 2 * y * w;
    const m03 = 0;

    const m10 = 2 * x * y + 2 * z * w;
    const m11 = 2 * w * w + 2 * y * y - 1;
    const m12 = 2 * y * z - 2 * x * w;
    const m13 = 0;

    const m20 = 2 * x * z - 2 * y * w;
    const m21 = 2 * y * z + 2 * x * w;
    const m22 = 2 * w * w + 2 * z * z - 1;
    const m23 = 0;

    const m30 = 0;
    const m31 = 0;
    const m32 = 0;
    const m33 = 1;

    return createMatrix4(
        m00, m01, m02, m03,
        m10, m11, m12, m13,
        m20, m21, m22, m23,
        m30, m31, m32, m33
    );

}

export function rotationMatrixToQuaternion(mat: Matrix4) {
    const m00 = mat4m00(mat);
    const m11 = mat4m11(mat);
    const m22 = mat4m22(mat);

    const trace = m00 + m11 + m22;

    let x = 0;
    let y = 0;
    let z = 0;
    let w = 0;

    if (trace > 0) {
        const s = Math.sqrt(trace + 1.0) * 2;
        w = 0.25 * s;
        x = (mat4m21(mat) - mat4m12(mat)) / s;
        y = (mat4m02(mat) - mat4m20(mat)) / s;
        z = (mat4m10(mat) - mat4m01(mat)) / s;
    } else if (m00 > m11 && m00 > m22) {
        const s = Math.sqrt(1.0 + m00 - m11 - m22) * 2;
        w = (mat4m21(mat) - mat4m12(mat)) / s;
        x = 0.25 * s;
        y = (mat4m01(mat) + mat4m10(mat)) / s;
        z = (mat4m02(mat) + mat4m20(mat)) / s;
    } else if (m11 > m22) {
        const s = Math.sqrt(1.0 + m11 - m00 - m22) * 2;
        w = (mat4m02(mat) - mat4m20(mat)) / s;
        x = (mat4m01(mat) + mat4m10(mat)) / s;
        y = 0.25 * s;
        z = (mat4m12(mat) + mat4m21(mat)) / s;
    } else {
        const s = Math.sqrt(1.0 + m22 - m00 - m11) * 2;
        w = (mat4m10(mat) - mat4m01(mat)) / s;
        x = (mat4m02(mat) + mat4m20(mat)) / s;
        y = (mat4m12(mat) + mat4m21(mat)) / s;
        z = 0.25 * s;
    }

    return createQuaternion(x, y, z, w);
}

// ref:
// - https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles#Quaternion_to_Euler_angles_conversion
// - https://github.com/infusion/Quaternion.js/blob/master/quaternion.js
// - https://qiita.com/aa_debdeb/items/3d02e28fb9ebfa357eaf
export function toEulerRadianFromQuaternion(q: Quaternion) {
    const x = qx(q);
    const y = qy(q);
    const z = qz(q);
    const w = qw(q);
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

export function toEulerDegreeFromQuaternion(q: Quaternion) {
    const rad = toEulerRadianFromQuaternion(q);
    return {
        x: (rad.x * 180) / Math.PI,
        y: (rad.y * 180) / Math.PI,
        z: (rad.z * 180) / Math.PI,
    };
}

// zxy
export function createQuaternionFromEulerRadians(x: number, y: number, z: number) {
    const cx = Math.cos(x / 2);
    const sx = Math.sin(x / 2);
    const cy = Math.cos(y / 2);
    const sy = Math.sin(y / 2);
    const cz = Math.cos(z / 2);
    const sz = Math.sin(z / 2);

    // right hand zxy
    // const qx = -cx * sy * sz + sx * cy * cz;
    // const qy = cx * sy * cz + sx * cy * sz;
    // const qz = sx * sy * cz + cx * cy * sz;
    // const qw = -sx * sy * sz + cx * cy * cz;

    // left hand zxy   
    const qw = cx * cy * cz - sx * sy * sz;
    const qx = sx * cy * cz + cx * sy * sz;
    const qy = cx * sy * cz - sx * cy * sz;
    const qz = cx * cy * sz + sx * sy * cz;

    return createQuaternion(qx, qy, qz, qw);
}

export function createQuaternionFromEulerDegrees(x: number, y: number, z: number) {
    return createQuaternionFromEulerRadians((x * Math.PI) / 180, (y * Math.PI) / 180, (z * Math.PI) / 180);
}

export function createMatrix4FromQuaternion(q: Quaternion) {
    const x = qx(q);
    const y = qy(q);
    const z = qz(q);
    const w = qw(q);

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
    return createMatrix4(
        1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), 0,
        2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), 0,
        2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), 0,
        0, 0, 0, 1
    );
}

export function createQuaternionInvertAxis(q: Quaternion) {
    return createQuaternion(-qx(q), -qy(q), -qz(q), qw(q));
}

export function createQuaternionIdentity() {
    return createQuaternion(0, 0, 0, 1);
}
