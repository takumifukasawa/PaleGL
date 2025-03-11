// import {Matrix4} from "@/PaleGL/math/Matrix4.ts";
// 
// export class Vector4 {
//     e: Float32Array = new Float32Array(4);
// 
//     constructor(x: number, y: number, z: number, w: number) {
//         this.set(x, y, z, w);
//     }
//     
//     static get one() {
//         return new Vector4(1, 1, 1, 1);
//     }
//     
//     static get zero() {
//         return new Vector4(0, 0, 0, 0);
//     }
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
//     set x(value) {
//         this.e[0] = value;
//     }
// 
//     set y(value) {
//         this.e[1] = value;
//     }
// 
//     set z(value) {
//         this.e[2] = value;
//     }
// 
//     set w(value) {
//         this.e[3] = value;
//     }
// 
//     set(x: number, y: number, z: number, w: number) {
//         this.e = new Float32Array([x, y, z, w]);
//     }
// 
// 
//     multiplyMatrix4(m: Matrix4) {
//         const tmpX = this.x;
//         const tmpY = this.y;
//         const tmpZ = this.z;
//         const tmpW = this.w;
//         const x = m.m00 * tmpX + m.m01 * tmpY + m.m02 * tmpZ + m.m03 * tmpW;
//         const y = m.m10 * tmpX + m.m11 * tmpY + m.m12 * tmpZ + m.m13 * tmpW;
//         const z = m.m20 * tmpX + m.m21 * tmpY + m.m22 * tmpZ + m.m23 * tmpW;
//         const w = m.m30 * tmpX + m.m31 * tmpY + m.m32 * tmpZ + m.m33 * tmpW;
//         this.x = x;
//         this.y = y;
//         this.z = z;
//         this.w = w;
//         return this;
//     }
// }


import {Matrix4} from "@/PaleGL/math/Matrix4.ts";

export type Vector4 = { e: Float32Array };

export function createVector4(x: number, y: number, z: number, w: number): Vector4 {
    return {e: new Float32Array([x, y, z, w])}
}

export function createVector4One() {
    return createVector4(1, 1, 1, 1);
}

export function createVector4zero() {
    return createVector4(0, 0, 0, 0);
}

export const v4x = (v: Vector4) => v.e[0];
export const v4y = (v: Vector4) => v.e[1];
export const v4z = (v: Vector4) => v.e[2];
export const v4w = (v: Vector4) => v.e[3];
export const setV4x = (v: Vector4, value: number) => v.e[0] = value;
export const setV4y = (v: Vector4, value: number) => v.e[1] = value;
export const setV4z = (v: Vector4, value: number) => v.e[2] = value;
export const setV4w = (v: Vector4, value: number) => v.e[3] = value;

export function multiplyVector4AndMatrix4(v: Vector4, m: Matrix4) {
    const tmpX = v4x(v);
    const tmpY = v4y(v);
    const tmpZ = v4z(v);
    const tmpW = v4w(v);
    const x = m.m00 * tmpX + m.m01 * tmpY + m.m02 * tmpZ + m.m03 * tmpW;
    const y = m.m10 * tmpX + m.m11 * tmpY + m.m12 * tmpZ + m.m13 * tmpW;
    const z = m.m20 * tmpX + m.m21 * tmpY + m.m22 * tmpZ + m.m23 * tmpW;
    const w = m.m30 * tmpX + m.m31 * tmpY + m.m32 * tmpZ + m.m33 * tmpW;
    setV4x(v, x);
    setV4y(v, y);
    setV4z(v, z);
    setV4w(v, w);
    return v;
}
