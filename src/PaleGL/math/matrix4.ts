// import {
//     createVector3,
//     createVector3Up,
//     crossVectorsV3,
//     normalizeVector3,
//     subVectorsV3,
//     v3x,
//     v3y,
//     v3z,
//     Vector3,
// } from '@/PaleGL/math/vector3.ts';
// import { getRotatorAxesRadians, Rotator } from '@/PaleGL/math/rotator.ts';
// import { Quaternion, toEulerRadianFromQuaternion } from '@/PaleGL/math/quaternion.ts';
//
// // memory layout is column order.
// // setter and getter are row order.
// // (num) ... element index
// // m00(0), m01(4), m02(8), m03(12),
// // m10(1), m11(5), m12(9), m13(13),
// // m20(2), m21(6), m22(10), m23(14),
// // m30(3), m31(7), m32(11), m33(15),
//
// export class Matrix4 {
//     e: Float32Array = new Float32Array(16);
//
//     get m00() {
//         return this.e[0];
//     }
//
//     get m01() {
//         return this.e[4];
//     }
//
//     get m02() {
//         return this.e[8];
//     }
//
//     get m03() {
//         return this.e[12];
//     }
//
//     get m10() {
//         return this.e[1];
//     }
//
//     get m11() {
//         return this.e[5];
//     }
//
//     get m12() {
//         return this.e[9];
//     }
//
//     get m13() {
//         return this.e[13];
//     }
//
//     get m20() {
//         return this.e[2];
//     }
//
//     get m21() {
//         return this.e[6];
//     }
//
//     get m22() {
//         return this.e[10];
//     }
//
//     get m23() {
//         return this.e[14];
//     }
//
//     get m30() {
//         return this.e[3];
//     }
//
//     get m31() {
//         return this.e[7];
//     }
//
//     get m32() {
//         return this.e[11];
//     }
//
//     get m33() {
//         return this.e[15];
//     }
//
//     set m00(value: number) {
//         this.e[0] = value;
//     }
//
//     set m01(value: number) {
//         this.e[4] = value;
//     }
//
//     set m02(value: number) {
//         this.e[8] = value;
//     }
//
//     set m03(value: number) {
//         this.e[12] = value;
//     }
//
//     set m10(value: number) {
//         this.e[1] = value;
//     }
//
//     set m11(value: number) {
//         this.e[5] = value;
//     }
//
//     set m12(value: number) {
//         this.e[9] = value;
//     }
//
//     set m13(value: number) {
//         this.e[13] = value;
//     }
//
//     set m20(value: number) {
//         this.e[2] = value;
//     }
//
//     set m21(value: number) {
//         this.e[6] = value;
//     }
//
//     set m22(value: number) {
//         this.e[10] = value;
//     }
//
//     set m23(value: number) {
//         this.e[14] = value;
//     }
//
//     set m30(value: number) {
//         this.e[3] = value;
//     }
//
//     set m31(value: number) {
//         this.e[7] = value;
//     }
//
//     set m32(value: number) {
//         this.e[11] = value;
//     }
//
//     set m33(value: number) {
//         this.e[15] = value;
//     }
//
//     get position() {
//         return createVector3(this.m03, this.m13, this.m23);
//     }
//
//     getScale() {
//         const m00 = this.m00;
//         const m01 = this.m01;
//         const m02 = this.m02;
//         const m10 = this.m10;
//         const m11 = this.m11;
//         const m12 = this.m12;
//         const m20 = this.m20;
//         const m21 = this.m21;
//         const m22 = this.m22;
//
//         const sx = Math.sqrt(m00 ** 2 + m01 ** 2 + m02 ** 2);
//         const sy = Math.sqrt(m10 ** 2 + m11 ** 2 + m12 ** 2);
//         const sz = Math.sqrt(m20 ** 2 + m21 ** 2 + m22 ** 2);
//
//         return createVector3(sx, sy, sz);
//     }
//
//     // get clipPosition() {
//     //     const w = this.m33 === 0 ? 0.0001 : this.m33; // TODO: cheap NaN fallback
//     //     return new Vector3(this.m03 / w, this.m13 / w, this.m23 / w);
//     // }
//
//     // prettier-ignore
//     constructor(
//         n00: number, n01: number, n02: number, n03: number,
//         n10: number, n11: number, n12: number, n13: number,
//         n20: number, n21: number, n22: number, n23: number,
//         n30: number, n31: number, n32: number, n33: number
//         // m00 = 0, m01 = 0, m02 = 0, m03 = 0,
//         // m10 = 0, m11 = 0, m12 = 0, m13 = 0,
//         // m20 = 0, m21 = 0, m22 = 0, m23 = 0,
//         // m30 = 0, m31 = 0, m32 = 0, m33 = 0,
//     ) {
//         // prettier-ignore
//         this.set(
//             n00, n01, n02, n03,
//             n10, n11, n12, n13,
//             n20, n21, n22, n23,
//             n30, n31, n32, n33
//         );
//     }
//
//     // constructorではrow-order
//     // データはcol-order
//     // prettier-ignore
//     set(
//         n00: number, n01: number, n02: number, n03: number,
//         n10: number, n11: number, n12: number, n13: number,
//         n20: number, n21: number, n22: number, n23: number,
//         n30: number, n31: number, n32: number, n33: number,
//     ) {
//         // prettier-ignore
//         this.e = new Float32Array([
//             n00, n10, n20, n30,
//             n01, n11, n21, n31,
//             n02, n12, n22, n32,
//             n03, n13, n23, n33,
//         ]);
//         return this;
//     }
//
//     /**
//      *
//      */
//     static get identity() {
//         return new Matrix4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
//     }
//
//     /**
//      *
//      * @param v
//      */
//     setTranslation(v: Vector3) {
//         this.m03 = v3x(v);
//         this.m13 = v3y(v);
//         this.m23 = v3z(v);
//         return this;
//     }
//
//     /**
//      *
//      * @param v
//      */
//     static translationMatrix(v: Vector3) {
//         // prettier-ignore
//         return new Matrix4(
//             1, 0, 0, v3x(v),
//             0, 1, 0, v3y(v),
//             0, 0, 1, v3z(v),
//             0, 0, 0, 1,
//         );
//     }
//
//     /**
//      *
//      * @param v
//      */
//     static scalingMatrix(v: Vector3) {
//         // prettier-ignore
//         return new Matrix4(
//             v3x(v), 0, 0, 0,
//             0, v3y(v), 0, 0,
//             0, 0, v3z(v), 0,
//             0, 0, 0, 1,
//         );
//     }
//
//     /**
//      *
//      * @param rad
//      */
//     static rotationXMatrix(rad: number) {
//         const c = Math.cos(rad);
//         const s = Math.sin(rad);
//         // prettier-ignore
//         return new Matrix4(
//             1, 0, 0, 0,
//             0, c, -s, 0,
//             0, s, c, 0,
//             0, 0, 0, 1,
//         );
//     }
//
//     /**
//      *
//      * @param rad
//      */
//     static rotationYMatrix(rad: number) {
//         const c = Math.cos(rad);
//         const s = Math.sin(rad);
//         // prettier-ignore
//         return new Matrix4(
//             c, 0, s, 0,
//             0, 1, 0, 0,
//             -s, 0, c, 0,
//             0, 0, 0, 1,
//         );
//     }
//
//     /**
//      *
//      * @param rad
//      */
//     static rotationZMatrix(rad: number) {
//         const c = Math.cos(rad);
//         const s = Math.sin(rad);
//         // prettier-ignore
//         return new Matrix4(
//             c, -s, 0, 0,
//             s, c, 0, 0,
//             0, 0, 1, 0,
//             0, 0, 0, 1,
//         );
//     }
//
//     /**
//      *
//      * @param matrices
//      */
//     static multiplyMatrices(...matrices: Matrix4[]) {
//         const m = Matrix4.identity;
//         matrices.forEach((matrix) => m.multiply(matrix));
//         return m;
//     }
//
//     /**
//      *
//      * @param m2
//      */
//     multiply(m2: Matrix4) {
//         // const m1 = this;
//
//         const e1 = this.e;
//         const e2 = m2.e;
//
//         const ma00 = e1[0],
//             ma01 = e1[4],
//             ma02 = e1[8],
//             ma03 = e1[12];
//         const ma10 = e1[1],
//             ma11 = e1[5],
//             ma12 = e1[9],
//             ma13 = e1[13];
//         const ma20 = e1[2],
//             ma21 = e1[6],
//             ma22 = e1[10],
//             ma23 = e1[14];
//         const ma30 = e1[3],
//             ma31 = e1[7],
//             ma32 = e1[11],
//             ma33 = e1[15];
//
//         const mb00 = e2[0],
//             mb01 = e2[4],
//             mb02 = e2[8],
//             mb03 = e2[12];
//         const mb10 = e2[1],
//             mb11 = e2[5],
//             mb12 = e2[9],
//             mb13 = e2[13];
//         const mb20 = e2[2],
//             mb21 = e2[6],
//             mb22 = e2[10],
//             mb23 = e2[14];
//         const mb30 = e2[3],
//             mb31 = e2[7],
//             mb32 = e2[11],
//             mb33 = e2[15];
//
//         // r0
//         const m00 = ma00 * mb00 + ma01 * mb10 + ma02 * mb20 + ma03 * mb30;
//         const m01 = ma00 * mb01 + ma01 * mb11 + ma02 * mb21 + ma03 * mb31;
//         const m02 = ma00 * mb02 + ma01 * mb12 + ma02 * mb22 + ma03 * mb32;
//         const m03 = ma00 * mb03 + ma01 * mb13 + ma02 * mb23 + ma03 * mb33;
//
//         // r1
//         const m10 = ma10 * mb00 + ma11 * mb10 + ma12 * mb20 + ma13 * mb30;
//         const m11 = ma10 * mb01 + ma11 * mb11 + ma12 * mb21 + ma13 * mb31;
//         const m12 = ma10 * mb02 + ma11 * mb12 + ma12 * mb22 + ma13 * mb32;
//         const m13 = ma10 * mb03 + ma11 * mb13 + ma12 * mb23 + ma13 * mb33;
//
//         // r2
//         const m20 = ma20 * mb00 + ma21 * mb10 + ma22 * mb20 + ma23 * mb30;
//         const m21 = ma20 * mb01 + ma21 * mb11 + ma22 * mb21 + ma23 * mb31;
//         const m22 = ma20 * mb02 + ma21 * mb12 + ma22 * mb22 + ma23 * mb32;
//         const m23 = ma20 * mb03 + ma21 * mb13 + ma22 * mb23 + ma23 * mb33;
//
//         // r3
//         const m30 = ma30 * mb00 + ma31 * mb10 + ma32 * mb20 + ma33 * mb30;
//         const m31 = ma30 * mb01 + ma31 * mb11 + ma32 * mb21 + ma33 * mb31;
//         const m32 = ma30 * mb02 + ma31 * mb12 + ma32 * mb22 + ma33 * mb32;
//         const m33 = ma30 * mb03 + ma31 * mb13 + ma32 * mb23 + ma33 * mb33;
//
//         // prettier-ignore
//         const m = new Matrix4(
//             m00, m01, m02, m03,
//             m10, m11, m12, m13,
//             m20, m21, m22, m23,
//             m30, m31, m32, m33,
//         );
//
//         this.copy(m);
//
//         return this;
//     }
//
//     /**
//      *
//      * @param m
//      */
//     copy(m: Matrix4) {
//         // tmp
//         // this.m00 = m.m00;
//         // this.m01 = m.m01;
//         // this.m02 = m.m02;
//         // this.m03 = m.m03;
//         // this.m10 = m.m10;
//         // this.m11 = m.m11;
//         // this.m12 = m.m12;
//         // this.m13 = m.m13;
//         // this.m20 = m.m20;
//         // this.m21 = m.m21;
//         // this.m22 = m.m22;
//         // this.m23 = m.m23;
//         // this.m30 = m.m30;
//         // this.m31 = m.m31;
//         // this.m32 = m.m32;
//         // this.m33 = m.m33;
//
//         this.e = new Float32Array([...m.e]);
//
//         return this;
//     }
//
//     /**
//      *
//      */
//     clone() {
//         const m = Matrix4.identity;
//         m.m00 = this.m00;
//         m.m01 = this.m01;
//         m.m02 = this.m02;
//         m.m03 = this.m03;
//         m.m10 = this.m10;
//         m.m11 = this.m11;
//         m.m12 = this.m12;
//         m.m13 = this.m13;
//         m.m20 = this.m20;
//         m.m21 = this.m21;
//         m.m22 = this.m22;
//         m.m23 = this.m23;
//         m.m30 = this.m30;
//         m.m31 = this.m31;
//         m.m32 = this.m32;
//         m.m33 = this.m33;
//         return m;
//     }
//
//     /**
//      *
//      */
//     transpose() {
//         const m01 = this.m01;
//         const m10 = this.m10;
//         this.m01 = m10;
//         this.m10 = m01;
//
//         const m02 = this.m02;
//         const m20 = this.m20;
//         this.m02 = m20;
//         this.m20 = m02;
//
//         const m03 = this.m03;
//         const m30 = this.m30;
//         this.m03 = m30;
//         this.m30 = m03;
//
//         const m12 = this.m12;
//         const m21 = this.m21;
//         this.m12 = m21;
//         this.m21 = m12;
//
//         const m13 = this.m13;
//         const m31 = this.m31;
//         this.m13 = m31;
//         this.m31 = m13;
//
//         const m23 = this.m23;
//         const m32 = this.m32;
//         this.m23 = m32;
//         this.m32 = m23;
//
//         return this;
//     }
//
//     /**
//      // ref: https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix4.js
//      *
//      */
//     invert() {
//         // based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
//         const te = this.e,
//             n11 = te[0],
//             n21 = te[1],
//             n31 = te[2],
//             n41 = te[3],
//             n12 = te[4],
//             n22 = te[5],
//             n32 = te[6],
//             n42 = te[7],
//             n13 = te[8],
//             n23 = te[9],
//             n33 = te[10],
//             n43 = te[11],
//             n14 = te[12],
//             n24 = te[13],
//             n34 = te[14],
//             n44 = te[15],
//             t11 =
//                 n23 * n34 * n42 -
//                 n24 * n33 * n42 +
//                 n24 * n32 * n43 -
//                 n22 * n34 * n43 -
//                 n23 * n32 * n44 +
//                 n22 * n33 * n44,
//             t12 =
//                 n14 * n33 * n42 -
//                 n13 * n34 * n42 -
//                 n14 * n32 * n43 +
//                 n12 * n34 * n43 +
//                 n13 * n32 * n44 -
//                 n12 * n33 * n44,
//             t13 =
//                 n13 * n24 * n42 -
//                 n14 * n23 * n42 +
//                 n14 * n22 * n43 -
//                 n12 * n24 * n43 -
//                 n13 * n22 * n44 +
//                 n12 * n23 * n44,
//             t14 =
//                 n14 * n23 * n32 -
//                 n13 * n24 * n32 -
//                 n14 * n22 * n33 +
//                 n12 * n24 * n33 +
//                 n13 * n22 * n34 -
//                 n12 * n23 * n34;
//
//         const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;
//
//         if (det === 0) return new Matrix4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
//
//         const detInv = 1 / det;
//
//         te[0] = t11 * detInv;
//         te[1] =
//             (n24 * n33 * n41 -
//                 n23 * n34 * n41 -
//                 n24 * n31 * n43 +
//                 n21 * n34 * n43 +
//                 n23 * n31 * n44 -
//                 n21 * n33 * n44) *
//             detInv;
//         te[2] =
//             (n22 * n34 * n41 -
//                 n24 * n32 * n41 +
//                 n24 * n31 * n42 -
//                 n21 * n34 * n42 -
//                 n22 * n31 * n44 +
//                 n21 * n32 * n44) *
//             detInv;
//         te[3] =
//             (n23 * n32 * n41 -
//                 n22 * n33 * n41 -
//                 n23 * n31 * n42 +
//                 n21 * n33 * n42 +
//                 n22 * n31 * n43 -
//                 n21 * n32 * n43) *
//             detInv;
//
//         te[4] = t12 * detInv;
//         te[5] =
//             (n13 * n34 * n41 -
//                 n14 * n33 * n41 +
//                 n14 * n31 * n43 -
//                 n11 * n34 * n43 -
//                 n13 * n31 * n44 +
//                 n11 * n33 * n44) *
//             detInv;
//         te[6] =
//             (n14 * n32 * n41 -
//                 n12 * n34 * n41 -
//                 n14 * n31 * n42 +
//                 n11 * n34 * n42 +
//                 n12 * n31 * n44 -
//                 n11 * n32 * n44) *
//             detInv;
//         te[7] =
//             (n12 * n33 * n41 -
//                 n13 * n32 * n41 +
//                 n13 * n31 * n42 -
//                 n11 * n33 * n42 -
//                 n12 * n31 * n43 +
//                 n11 * n32 * n43) *
//             detInv;
//
//         te[8] = t13 * detInv;
//         te[9] =
//             (n14 * n23 * n41 -
//                 n13 * n24 * n41 -
//                 n14 * n21 * n43 +
//                 n11 * n24 * n43 +
//                 n13 * n21 * n44 -
//                 n11 * n23 * n44) *
//             detInv;
//         te[10] =
//             (n12 * n24 * n41 -
//                 n14 * n22 * n41 +
//                 n14 * n21 * n42 -
//                 n11 * n24 * n42 -
//                 n12 * n21 * n44 +
//                 n11 * n22 * n44) *
//             detInv;
//         te[11] =
//             (n13 * n22 * n41 -
//                 n12 * n23 * n41 -
//                 n13 * n21 * n42 +
//                 n11 * n23 * n42 +
//                 n12 * n21 * n43 -
//                 n11 * n22 * n43) *
//             detInv;
//
//         te[12] = t14 * detInv;
//         te[13] =
//             (n13 * n24 * n31 -
//                 n14 * n23 * n31 +
//                 n14 * n21 * n33 -
//                 n11 * n24 * n33 -
//                 n13 * n21 * n34 +
//                 n11 * n23 * n34) *
//             detInv;
//         te[14] =
//             (n14 * n22 * n31 -
//                 n12 * n24 * n31 -
//                 n14 * n21 * n32 +
//                 n11 * n24 * n32 +
//                 n12 * n21 * n34 -
//                 n11 * n22 * n34) *
//             detInv;
//         te[15] =
//             (n12 * n23 * n31 -
//                 n13 * n22 * n31 +
//                 n13 * n21 * n32 -
//                 n11 * n23 * n32 -
//                 n12 * n21 * n33 +
//                 n11 * n22 * n33) *
//             detInv;
//
//         return this;
//     }
//
//     /**
//      *
//      // ref: https://marina.sys.wakayama-u.ac.jp/~tokoi/?date=20090829
//      * @param left
//      * @param right
//      * @param bottom
//      * @param top
//      * @param near
//      * @param far
//      */
//     static getOrthographicMatrix(left: number, right: number, bottom: number, top: number, near: number, far: number) {
//         const m00 = 2 / (right - left); // scale x
//         const m11 = 2 / (top - bottom); // scale y
//         const m22 = -2 / (far - near); // scale z
//         const m03 = -(right + left) / (right - left); // translate x
//         const m13 = -(top + bottom) / (top - bottom); // translate y
//         const m23 = -(far + near) / (far - near); // translate z
//         // prettier-ignore
//         return new Matrix4(
//             m00, 0, 0, m03,
//             0, m11, 0, m13,
//             0, 0, m22, m23,
//             0, 0, 0, 1,
//         );
//     }
//
//     /**
//      *
//      // ref
//      // https://developer.mozilla.org/ja/docs/Web/API/WebGL_API/WebGL_model_view_projection
//      // fov ... rad
//      // aspect ... w / h
//      * @param fov
//      * @param aspect
//      * @param near
//      * @param far
//      */
//     static getPerspectiveMatrix(fov: number, aspect: number, near: number, far: number) {
//         const f = 1 / Math.tan(fov / 2);
//         // const nf = 1 / (near - far);
//
//         const pjm = Matrix4.identity;
//
//         pjm.m00 = f / aspect;
//         pjm.m10 = 0;
//         pjm.m20 = 0;
//         pjm.m30 = 0;
//         pjm.m01 = 0;
//         pjm.m11 = f;
//         pjm.m21 = 0;
//         pjm.m31 = 0;
//         pjm.m02 = 0;
//         pjm.m12 = 0;
//         pjm.m32 = -1;
//         pjm.m03 = 0;
//         pjm.m13 = 0;
//         pjm.m33 = 0;
//         if (far != null && far !== Infinity) {
//             const nf = 1 / (near - far);
//             pjm.m22 = (far + near) * nf;
//             pjm.m23 = 2 * far * near * nf;
//         } else {
//             pjm.m22 = -1;
//             pjm.m23 = -2 * near;
//         }
//
//         // row-order
//         // // https://github.com/toji/gl-matrix/blob/master/src/mat4.js
//         // pjm.e[0]= f / aspect; // m00
//         // pjm.e[1]= 0; // m10
//         // pjm.e[2]= 0; // m20
//         // pjm.e[3]= 0; // m30
//         // pjm.e[4]= 0; // m01
//         // pjm.e[5]= f; // m11
//         // pjm.e[6]= 0; // m21
//         // pjm.e[7]= 0; // m31
//         // pjm.e[8]= 0; // m02
//         // pjm.e[9]= 0; // m12
//         // pjm.e[11]= -1; // m32
//         // pjm.e[12]= 0; // m03
//         // pjm.e[13]= 0; // m13
//         // pjm.e[15]= 0; // m33
//         // if (far != null && far !== Infinity) {
//         //     const nf = 1 / (near - far);
//         //     pjm.e[10]= (far + near) * nf; // m22
//         //     pjm.e[14]= 2 * far * near * nf; // m23
//         // } else {
//         //     pjm.e[10]= -1; // m22
//         //     pjm.e[14]= -2 * near; // m23
//         // }
//
//         return pjm;
//     }
//
//     /**
//      *
//      * @param eye
//      * @param center
//      * @param up
//      * @param inverseForward
//      */
//     static getLookAtMatrix(eye: Vector3, center: Vector3, up = createVector3Up(), inverseForward = false) {
//         const f = inverseForward
//             ? normalizeVector3(subVectorsV3(eye, center)) // ex. 主にカメラ。投影の関係で逆になるので。
//             : normalizeVector3(subVectorsV3(center, eye));
//         const r = normalizeVector3(crossVectorsV3(normalizeVector3(up), f));
//         const u = crossVectorsV3(f, r);
//         // prettier-ignore
//         const result = new Matrix4(
//             // r.x, u.x, f.x, eye.x,
//             // r.y, u.y, f.y, eye.y,
//             // r.z, u.z, f.z, eye.z,
//             // 0, 0, 0, 1
//             v3x(r), v3x(u), v3x(f), v3x(eye),
//             v3y(r), v3y(u), v3y(f), v3y(eye),
//             v3z(r), v3z(u), v3z(f), v3z(eye),
//             0, 0, 0, 1,
//         );
//         return result;
//     }
//
//     /**
//      *
//      // position ... vector3
//      // rotation ... rotator
//      // scaling ... vector3
//      * @param position
//      * @param rotation
//      * @param scaling
//      */
//     static fromTRS(position: Vector3, rotation: Rotator, scaling: Vector3) {
//         const rotationRadians = getRotatorAxesRadians(rotation);
//         return Matrix4.multiplyMatrices(
//             Matrix4.translationMatrix(position),
//             Matrix4.rotationYMatrix(rotationRadians.y),
//             Matrix4.rotationXMatrix(rotationRadians.x),
//             Matrix4.rotationZMatrix(rotationRadians.z),
//             Matrix4.scalingMatrix(scaling)
//         );
//     }
//
//     /**
//      *
//      * @param q
//      */
//     static fromQuaternion(q: Quaternion) {
//         const eulerRadian = toEulerRadianFromQuaternion(q);
//         return Matrix4.multiplyMatrices(
//             Matrix4.rotationYMatrix(eulerRadian.y),
//             Matrix4.rotationXMatrix(eulerRadian.x),
//             Matrix4.rotationZMatrix(eulerRadian.z)
//         );
//     }
//
//     /**
//      *
//      * @param arr
//      */
//     static fromArray(arr: number[]) {
//         return new Matrix4(
//             arr[0],
//             arr[1],
//             arr[2],
//             arr[3],
//             arr[4],
//             arr[5],
//             arr[6],
//             arr[7],
//             arr[8],
//             arr[9],
//             arr[10],
//             arr[11],
//             arr[12],
//             arr[13],
//             arr[14],
//             arr[15]
//         );
//     }
//
//     /**
//      *
//      */
//     log() {
//         console.log(`--------------------
// ${this.m00}, ${this.m01}, ${this.m02}, ${this.m03},
// ${this.m10}, ${this.m11}, ${this.m12}, ${this.m13},
// ${this.m20}, ${this.m21}, ${this.m22}, ${this.m23},
// ${this.m30}, ${this.m31}, ${this.m32}, ${this.m33},
// --------------------`);
//     }
//
//     /**
//      *
//      */
//     getPrettyLine() {
//         return `--------------------
// ${this.m00}, ${this.m01}, ${this.m02}, ${this.m03},
// ${this.m10}, ${this.m11}, ${this.m12}, ${this.m13},
// ${this.m20}, ${this.m21}, ${this.m22}, ${this.m23},
// ${this.m30}, ${this.m31}, ${this.m32}, ${this.m33},
// --------------------`;
//     }
// }

import {
    createVector3,
    createVector3Up,
    crossVectorsV3,
    normalizeVector3,
    subVectorsV3,
    v3x,
    v3y,
    v3z,
    Vector3,
} from '@/PaleGL/math/vector3.ts';
import { getRotatorAxesRadians, Rotator } from '@/PaleGL/math/rotator.ts';
import { Quaternion, toEulerRadianFromQuaternion } from '@/PaleGL/math/quaternion.ts';

// memory layout is column order.
// setter and getter are row order.
// (num) ... element index
// m00(0), m01(4), m02(8), m03(12),
// m10(1), m11(5), m12(9), m13(13),
// m20(2), m21(6), m22(10), m23(14),
// m30(3), m31(7), m32(11), m33(15),

export type Matrix4 = { e: Float32Array };

// prettier-ignore
export function createMatrix4(
    n00: number, n01: number, n02: number, n03: number,
    n10: number, n11: number, n12: number, n13: number,
    n20: number, n21: number, n22: number, n23: number,
    n30: number, n31: number, n32: number, n33: number,
    // m00 = 0, m01 = 0, m02 = 0, m03 = 0,
    // m10 = 0, m11 = 0, m12 = 0, m13 = 0,
    // m20 = 0, m21 = 0, m22 = 0, m23 = 0,
    // m30 = 0, m31 = 0, m32 = 0, m33 = 0,
) {
    // prettier-ignore
    const e = new Float32Array([
        n00, n10, n20, n30,
        n01, n11, n21, n31,
        n02, n12, n22, n32,
        n03, n13, n23, n33,
    ]);
    return { e };
}

export function mat4m00(m: Matrix4) {
    return m.e[0];
}

export function mat4m01(m: Matrix4) {
    return m.e[4];
}

export function mat4m02(m: Matrix4) {
    return m.e[8];
}

export function mat4m03(m: Matrix4) {
    return m.e[12];
}

export function mat4m10(m: Matrix4) {
    return m.e[1];
}

export function mat4m11(m: Matrix4) {
    return m.e[5];
}

export function mat4m12(m: Matrix4) {
    return m.e[9];
}

export function mat4m13(m: Matrix4) {
    return m.e[13];
}

export function mat4m20(m: Matrix4) {
    return m.e[2];
}

export function mat4m21(m: Matrix4) {
    return m.e[6];
}

export function mat4m22(m: Matrix4) {
    return m.e[10];
}

export function mat4m23(m: Matrix4) {
    return m.e[14];
}

export function mat4m30(m: Matrix4) {
    return m.e[3];
}

export function mat4m31(m: Matrix4) {
    return m.e[7];
}

export function mat4m32(m: Matrix4) {
    return m.e[11];
}

export function mat4m33(m: Matrix4) {
    return m.e[15];
}

export function setMat4m00(m: Matrix4, value: number) {
    m.e[0] = value;
}

export function setMat4m01(m: Matrix4, value: number) {
    m.e[4] = value;
}

export function setMat4m02(m: Matrix4, value: number) {
    m.e[8] = value;
}

export function setMat4m03(m: Matrix4, value: number) {
    m.e[12] = value;
}

export function setMat4m10(m: Matrix4, value: number) {
    m.e[1] = value;
}

export function setMat4m11(m: Matrix4, value: number) {
    m.e[5] = value;
}

export function setMat4m12(m: Matrix4, value: number) {
    m.e[9] = value;
}

export function setMat4m13(m: Matrix4, value: number) {
    m.e[13] = value;
}

export function setMat4m20(m: Matrix4, value: number) {
    m.e[2] = value;
}

export function setMat4m21(m: Matrix4, value: number) {
    m.e[6] = value;
}

export function setMat4m22(m: Matrix4, value: number) {
    m.e[10] = value;
}

export function setMat4m23(m: Matrix4, value: number) {
    m.e[14] = value;
}

export function setMat4m30(m: Matrix4, value: number) {
    m.e[3] = value;
}

export function setMat4m31(m: Matrix4, value: number) {
    m.e[7] = value;
}

export function setMat4m32(m: Matrix4, value: number) {
    m.e[11] = value;
}

export function setMat4m33(m: Matrix4, value: number) {
    m.e[15] = value;
}

export function getMat4Position(m: Matrix4) {
    return createVector3(mat4m03(m), mat4m13(m), mat4m23(m));
}

export function getMat4Scale(m: Matrix4) {
    const m00 = mat4m00(m);
    const m01 = mat4m01(m);
    const m02 = mat4m02(m);
    const m10 = mat4m10(m);
    const m11 = mat4m11(m);
    const m12 = mat4m12(m);
    const m20 = mat4m20(m);
    const m21 = mat4m21(m);
    const m22 = mat4m22(m);

    const sx = Math.sqrt(m00 ** 2 + m01 ** 2 + m02 ** 2);
    const sy = Math.sqrt(m10 ** 2 + m11 ** 2 + m12 ** 2);
    const sz = Math.sqrt(m20 ** 2 + m21 ** 2 + m22 ** 2);

    return createVector3(sx, sy, sz);
}

// get clipPosition() {
//     const w = this.m33 === 0 ? 0.0001 : this.m33; // TODO: cheap NaN fallback
//     return new Vector3(this.m03 / w, this.m13 / w, this.m23 / w);
// }

export function createMat4Identity() {
    return createMatrix4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
}

export function setMat4Translation(m: Matrix4, v: Vector3) {
    setMat4m03(m, v3x(v));
    setMat4m13(m, v3y(v));
    setMat4m23(m, v3z(v));
    return m;
}

export function createTranslationMatrix(v: Vector3) {
    // prettier-ignore
    return createMatrix4(
        1, 0, 0, v3x(v),
        0, 1, 0, v3y(v),
        0, 0, 1, v3z(v),
        0, 0, 0, 1,
    );
}

export function createScalingMatrix(v: Vector3) {
    // prettier-ignore
    return createMatrix4(
        v3x(v), 0, 0, 0,
        0, v3y(v), 0, 0,
        0, 0, v3z(v), 0,
        0, 0, 0, 1,
    );
}

export function createRotationXMatrix(rad: number) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    // prettier-ignore
    return createMatrix4(
        1, 0, 0, 0,
        0, c, -s, 0,
        0, s, c, 0,
        0, 0, 0, 1,
    );
}

export function createRotationYMatrix(rad: number) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    // prettier-ignore
    return createMatrix4(
        c, 0, s, 0,
        0, 1, 0, 0,
        -s, 0, c, 0,
        0, 0, 0, 1,
    );
}

export function createRotationZMatrix(rad: number) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    // prettier-ignore
    return createMatrix4(
        c, -s, 0, 0,
        s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    );
}

export function multiplyMat4Array(...matrices: Matrix4[]) {
    const m = createMat4Identity();
    matrices.forEach((matrix) => multiplyMat4(m, matrix));
    return m;
}

export function multiplyMat4(m1: Matrix4, m2: Matrix4) {
    // const m1 = this;

    const e1 = m1.e;
    const e2 = m2.e;

    const ma00 = e1[0],
        ma01 = e1[4],
        ma02 = e1[8],
        ma03 = e1[12];
    const ma10 = e1[1],
        ma11 = e1[5],
        ma12 = e1[9],
        ma13 = e1[13];
    const ma20 = e1[2],
        ma21 = e1[6],
        ma22 = e1[10],
        ma23 = e1[14];
    const ma30 = e1[3],
        ma31 = e1[7],
        ma32 = e1[11],
        ma33 = e1[15];

    const mb00 = e2[0],
        mb01 = e2[4],
        mb02 = e2[8],
        mb03 = e2[12];
    const mb10 = e2[1],
        mb11 = e2[5],
        mb12 = e2[9],
        mb13 = e2[13];
    const mb20 = e2[2],
        mb21 = e2[6],
        mb22 = e2[10],
        mb23 = e2[14];
    const mb30 = e2[3],
        mb31 = e2[7],
        mb32 = e2[11],
        mb33 = e2[15];

    // r0
    const m00 = ma00 * mb00 + ma01 * mb10 + ma02 * mb20 + ma03 * mb30;
    const m01 = ma00 * mb01 + ma01 * mb11 + ma02 * mb21 + ma03 * mb31;
    const m02 = ma00 * mb02 + ma01 * mb12 + ma02 * mb22 + ma03 * mb32;
    const m03 = ma00 * mb03 + ma01 * mb13 + ma02 * mb23 + ma03 * mb33;

    // r1
    const m10 = ma10 * mb00 + ma11 * mb10 + ma12 * mb20 + ma13 * mb30;
    const m11 = ma10 * mb01 + ma11 * mb11 + ma12 * mb21 + ma13 * mb31;
    const m12 = ma10 * mb02 + ma11 * mb12 + ma12 * mb22 + ma13 * mb32;
    const m13 = ma10 * mb03 + ma11 * mb13 + ma12 * mb23 + ma13 * mb33;

    // r2
    const m20 = ma20 * mb00 + ma21 * mb10 + ma22 * mb20 + ma23 * mb30;
    const m21 = ma20 * mb01 + ma21 * mb11 + ma22 * mb21 + ma23 * mb31;
    const m22 = ma20 * mb02 + ma21 * mb12 + ma22 * mb22 + ma23 * mb32;
    const m23 = ma20 * mb03 + ma21 * mb13 + ma22 * mb23 + ma23 * mb33;

    // r3
    const m30 = ma30 * mb00 + ma31 * mb10 + ma32 * mb20 + ma33 * mb30;
    const m31 = ma30 * mb01 + ma31 * mb11 + ma32 * mb21 + ma33 * mb31;
    const m32 = ma30 * mb02 + ma31 * mb12 + ma32 * mb22 + ma33 * mb32;
    const m33 = ma30 * mb03 + ma31 * mb13 + ma32 * mb23 + ma33 * mb33;

    // prettier-ignore
    const m = createMatrix4(
        m00, m01, m02, m03,
        m10, m11, m12, m13,
        m20, m21, m22, m23,
        m30, m31, m32, m33,
    );

    copyMat4(m1, m);

    return m1;
}

export function copyMat4(sm: Matrix4, tm: Matrix4) {
    // tmp
    // this.m00 = m.m00;
    // this.m01 = m.m01;
    // this.m02 = m.m02;
    // this.m03 = m.m03;
    // this.m10 = m.m10;
    // this.m11 = m.m11;
    // this.m12 = m.m12;
    // this.m13 = m.m13;
    // this.m20 = m.m20;
    // this.m21 = m.m21;
    // this.m22 = m.m22;
    // this.m23 = m.m23;
    // this.m30 = m.m30;
    // this.m31 = m.m31;
    // this.m32 = m.m32;
    // this.m33 = m.m33;

    sm.e = new Float32Array([...tm.e]);

    return sm;
}

export function cloneMat4(sm: Matrix4) {
    const m = createMat4Identity();
    // m.m00 = mat4m00(sm);
    // m.m01 = mat4m01(sm);
    // m.m02 = mat4m02(sm);
    // m.m03 = mat4m03(sm);
    // m.m10 = mat4m10(sm);
    // m.m11 = mat4m11(sm);
    // m.m12 = mat4m12(sm);
    // m.m13 = mat4m13(sm);
    // m.m20 = mat4m20(sm);
    // m.m21 = mat4m21(sm);
    // m.m22 = mat4m22(sm);
    // m.m23 = mat4m23(sm);
    // m.m30 = mat4m30(sm);
    // m.m31 = mat4m31(sm);
    // m.m32 = mat4m32(sm);
    // m.m33 = mat4m33(sm);
    setMat4m00(m, mat4m00(sm))
    setMat4m01(m, mat4m01(sm))
    setMat4m02(m, mat4m02(sm))
    setMat4m03(m, mat4m03(sm))
    setMat4m10(m, mat4m10(sm))
    setMat4m11(m, mat4m11(sm))
    setMat4m12(m, mat4m12(sm))
    setMat4m13(m, mat4m13(sm))
    setMat4m20(m, mat4m20(sm))
    setMat4m21(m, mat4m21(sm))
    setMat4m22(m, mat4m22(sm))
    setMat4m23(m, mat4m23(sm))
    setMat4m30(m, mat4m30(sm))
    setMat4m31(m, mat4m31(sm))
    setMat4m32(m, mat4m32(sm))
    setMat4m33(m, mat4m33(sm))
    return m;
}

export function transposeMat4(m: Matrix4) {
    const m01 = mat4m01(m);
    const m10 = mat4m10(m);
    setMat4m01(m, m10);
    setMat4m10(m, m01);

    const m02 = mat4m02(m);
    const m20 = mat4m20(m);
    setMat4m02(m, m20);
    setMat4m20(m, m02);

    const m03 = mat4m03(m);
    const m30 = mat4m30(m);
    setMat4m03(m, m30);
    setMat4m30(m, m03);

    const m12 = mat4m12(m);
    const m21 = mat4m21(m);
    setMat4m12(m, m21);
    setMat4m21(m, m12);

    const m13 = mat4m13(m);
    const m31 = mat4m31(m);
    setMat4m13(m, m31);
    setMat4m31(m, m13);

    const m23 = mat4m23(m);
    const m32 = mat4m32(m);
    setMat4m23(m, m32);
    setMat4m32(m, m23);

    return m;
}

export function invertMat4(m: Matrix4) {
    // based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
    const te = m.e,
        n11 = te[0],
        n21 = te[1],
        n31 = te[2],
        n41 = te[3],
        n12 = te[4],
        n22 = te[5],
        n32 = te[6],
        n42 = te[7],
        n13 = te[8],
        n23 = te[9],
        n33 = te[10],
        n43 = te[11],
        n14 = te[12],
        n24 = te[13],
        n34 = te[14],
        n44 = te[15],
        t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
        t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
        t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
        t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

    const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

    if (det === 0) return createMatrix4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

    const detInv = 1 / det;

    te[0] = t11 * detInv;
    te[1] =
        (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) *
        detInv;
    te[2] =
        (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) *
        detInv;
    te[3] =
        (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) *
        detInv;

    te[4] = t12 * detInv;
    te[5] =
        (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) *
        detInv;
    te[6] =
        (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) *
        detInv;
    te[7] =
        (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) *
        detInv;

    te[8] = t13 * detInv;
    te[9] =
        (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) *
        detInv;
    te[10] =
        (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) *
        detInv;
    te[11] =
        (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) *
        detInv;

    te[12] = t14 * detInv;
    te[13] =
        (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) *
        detInv;
    te[14] =
        (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) *
        detInv;
    te[15] =
        (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) *
        detInv;

    return m;
}

// ref: https://marina.sys.wakayama-u.ac.jp/~tokoi/?date=20090829
export function createOrthographicMatrix(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number
) {
    const m00 = 2 / (right - left); // scale x
    const m11 = 2 / (top - bottom); // scale y
    const m22 = -2 / (far - near); // scale z
    const m03 = -(right + left) / (right - left); // translate x
    const m13 = -(top + bottom) / (top - bottom); // translate y
    const m23 = -(far + near) / (far - near); // translate z
    // prettier-ignore
    return createMatrix4(
        m00, 0, 0, m03,
        0, m11, 0, m13,
        0, 0, m22, m23,
        0, 0, 0, 1,
    );
}

// ref
// https://developer.mozilla.org/ja/docs/Web/API/WebGL_API/WebGL_model_view_projection
// fov ... rad
// aspect ... w / h
export function createPerspectiveMatrix(fov: number, aspect: number, near: number, far: number) {
    const f = 1 / Math.tan(fov / 2);
    // const nf = 1 / (near - far);

    const pjm = createMat4Identity();

    // pjm.m00 = f / aspect;
    // pjm.m10 = 0;
    // pjm.m20 = 0;
    // pjm.m30 = 0;
    // pjm.m01 = 0;
    // pjm.m11 = f;
    // pjm.m21 = 0;
    // pjm.m31 = 0;
    // pjm.m02 = 0;
    // pjm.m12 = 0;
    // pjm.m32 = -1;
    // pjm.m03 = 0;
    // pjm.m13 = 0;
    // pjm.m33 = 0;
    setMat4m00(pjm, f / aspect);
    setMat4m10(pjm, 0);
    setMat4m20(pjm, 0);
    setMat4m30(pjm, 0);
    setMat4m01(pjm, 0);
    setMat4m11(pjm, f);
    setMat4m21(pjm, 0);
    setMat4m31(pjm, 0);
    setMat4m02(pjm, 0);
    setMat4m12(pjm, 0);
    setMat4m32(pjm, -1);
    setMat4m03(pjm, 0);
    setMat4m13(pjm, 0);
    setMat4m33(pjm, 0);

    if (far != null && far !== Infinity) {
        const nf = 1 / (near - far);
        // pjm.m22 = (far + near) * nf;
        // pjm.m23 = 2 * far * near * nf;
        setMat4m22(pjm, (far + near) * nf);
        setMat4m23(pjm, 2 * far * near * nf);
    } else {
        // pjm.m22 = -1;
        // pjm.m23 = -2 * near;
        setMat4m22(pjm, -1);
        setMat4m23(pjm, -2 * near);
    }

    // row-order
    // // https://github.com/toji/gl-matrix/blob/master/src/mat4.js
    // pjm.e[0]= f / aspect; // m00
    // pjm.e[1]= 0; // m10
    // pjm.e[2]= 0; // m20
    // pjm.e[3]= 0; // m30
    // pjm.e[4]= 0; // m01
    // pjm.e[5]= f; // m11
    // pjm.e[6]= 0; // m21
    // pjm.e[7]= 0; // m31
    // pjm.e[8]= 0; // m02
    // pjm.e[9]= 0; // m12
    // pjm.e[11]= -1; // m32
    // pjm.e[12]= 0; // m03
    // pjm.e[13]= 0; // m13
    // pjm.e[15]= 0; // m33
    // if (far != null && far !== Infinity) {
    //     const nf = 1 / (near - far);
    //     pjm.e[10]= (far + near) * nf; // m22
    //     pjm.e[14]= 2 * far * near * nf; // m23
    // } else {
    //     pjm.e[10]= -1; // m22
    //     pjm.e[14]= -2 * near; // m23
    // }

    return pjm;
}

export function createLookAtMatrix(eye: Vector3, center: Vector3, up = createVector3Up(), inverseForward = false) {
    const f = inverseForward
        ? normalizeVector3(subVectorsV3(eye, center)) // ex. 主にカメラ。投影の関係で逆になるので。
        : normalizeVector3(subVectorsV3(center, eye));
    const r = normalizeVector3(crossVectorsV3(normalizeVector3(up), f));
    const u = crossVectorsV3(f, r);
    // prettier-ignore
    const result = createMatrix4(
        // r.x, u.x, f.x, eye.x,
        // r.y, u.y, f.y, eye.y,
        // r.z, u.z, f.z, eye.z,
        // 0, 0, 0, 1
        v3x(r), v3x(u), v3x(f), v3x(eye),
        v3y(r), v3y(u), v3y(f), v3y(eye),
        v3z(r), v3z(u), v3z(f), v3z(eye),
        0, 0, 0, 1,
    );
    return result;
}

export function createMat4FromTRS(position: Vector3, rotation: Rotator, scaling: Vector3) {
    const rotationRadians = getRotatorAxesRadians(rotation);
    return multiplyMat4Array(
        createTranslationMatrix(position),
        createRotationYMatrix(rotationRadians.y),
        createRotationXMatrix(rotationRadians.x),
        createRotationZMatrix(rotationRadians.z),
        createScalingMatrix(scaling)
    );
}

export function createMat4FromQuaternion(q: Quaternion) {
    const eulerRadians = toEulerRadianFromQuaternion(q);
    return multiplyMat4Array(
        createRotationYMatrix(eulerRadians.y),
        createRotationXMatrix(eulerRadians.x),
        createRotationZMatrix(eulerRadians.z)
    );
}

export function mat4fromNumArray(arr: number[]) {
    return createMatrix4(
        arr[0],
        arr[1],
        arr[2],
        arr[3],
        arr[4],
        arr[5],
        arr[6],
        arr[7],
        arr[8],
        arr[9],
        arr[10],
        arr[11],
        arr[12],
        arr[13],
        arr[14],
        arr[15]
    );
}

export function logMat4(m: Matrix4) {
    console.log(getPrettyLine(m));
}

export function getPrettyLine(m: Matrix4) {
    return `--------------------

${mat4m00(m)}, ${mat4m01(m)}, ${mat4m02(m)}, ${mat4m03(m)},
${mat4m10(m)}, ${mat4m11(m)}, ${mat4m12(m)}, ${mat4m13(m)},
${mat4m20(m)}, ${mat4m21(m)}, ${mat4m22(m)}, ${mat4m23(m)},
${mat4m30(m)}, ${mat4m31(m)}, ${mat4m32(m)}, ${mat4m33(m)},
--------------------`;
}
