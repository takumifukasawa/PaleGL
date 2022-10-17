import {Vector3} from "./Vector3.js";

// row order
export class Matrix4 {
    elements;
    
    get m00() {
        return this.elements[0];
    }
    
    get m01() {
        return this.elements[1];
    }
    
    get m02() {
        return this.elements[2];
    }
    
    get m03() {
        return this.elements[3];
    }

    get m10() {
        return this.elements[4];
    }

    get m11() {
        return this.elements[5];
    }

    get m12() {
        return this.elements[6];
    }

    get m13() {
        return this.elements[7];
    }
    
    get m20() {
        return this.elements[8];
    }

    get m21() {
        return this.elements[9];
    }

    get m22() {
        return this.elements[10];
    }

    get m23() {
        return this.elements[11];
    }

    get m30() {
        return this.elements[12];
    }

    get m31() {
        return this.elements[13];
    }

    get m32() {
        return this.elements[14];
    }

    get m33() {
        return this.elements[15];
    }
    
    set m00(value) {
        this.elements[0] = value;
    }

    set m01(value) {
        this.elements[1] = value;
    }

    set m02(value) {
        this.elements[2] = value;
    }

    set m03(value) {
        this.elements[3] = value;
    }

    set m10(value) {
        this.elements[4] = value;
    }

    set m11(value) {
        this.elements[5] = value;
    }

    set m12(value) {
        return this.elements[6] = value;
    }

    set m13(value) {
        return this.elements[7] = value;
    }

    set m20(value) {
        return this.elements[8] = value;
    }

    set m21(value) {
        return this.elements[9] = value;
    }

    set m22(value) {
        return this.elements[10] = value;
    }

    set m23(value) {
        return this.elements[11] = value;
    }

    set m30(value) {
        return this.elements[12] = value;
    }

    set m31(value) {
        return this.elements[13] = value;
    }

    set m32(value) {
        return this.elements[14] = value;
    }

    set m33(value) {
        return this.elements[15] = value;
    }

    constructor(
        m00 = 0, m01 = 0, m02 = 0, m03 = 0,
        m10 = 0, m11 = 0, m12 = 0, m13 = 0,
        m20 = 0, m21 = 0, m22 = 0, m23 = 0,
        m30 = 0, m31 = 0, m32 = 0, m33 = 0,
    ) {
        this.elements = new Float32Array([
            m00, m01, m02, m03,
            m10, m11, m12, m13,
            m20, m21, m22, m23,
            m30, m31, m32, m33,
        ]);
    }

    static identity() {
        return new Matrix4(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        );
    }
    
    translate(v) {
        this.m03 += v.x;
        this.m13 += v.y;
        this.m23 += v.z;
        return this;
    }
    
    static translateMatrix(v) {
        return Matrix4.identity().translate(v);
    }
    
    scale(v) {
        this.m00 *= v.x;
        this.m11 *= v.y;
        this.m22 *= v.z;
        return this;
    }
    
    static scaleMatrix(v) {
        return Matrix4.identity().scale(v);
    }
    
    static multiplyMatrices(...matrices) {
        const m = Matrix4.identity();
        matrices.forEach(matrix => { m.multiply(matrix); });
        console.log(m, matrices)
        return m;
    }
    
    multiply(m1, m2) {
        const m = Matrix4.identity();

        // r0
        m.m00 = m1.m00 * m2.m00 + m1.m01 * m2.m10 + m1.m02 * m2.m20 + m1.m03 * m2.m30;
        m.m01 = m1.m00 * m2.m01 + m1.m01 * m2.m11 + m1.m02 * m2.m21 + m1.m03 * m2.m31;
        m.m02 = m1.m00 * m2.m02 + m1.m01 * m2.m12 + m1.m02 * m2.m22 + m1.m03 * m2.m32;
        m.m03 = m1.m00 * m2.m03 + m1.m01 * m2.m13 + m1.m02 * m2.m23 + m1.m03 * m2.m33;

        // r1
        m.m10 = m1.m10 * m2.m00 + m1.m11 * m2.m10 + m1.m12 * m2.m20 + m1.m13 * m2.m30;
        m.m11 = m1.m10 * m2.m01 + m1.m11 * m2.m11 + m1.m12 * m2.m21 + m1.m13 * m2.m31;
        m.m12 = m1.m10 * m2.m02 + m1.m11 * m2.m12 + m1.m12 * m2.m22 + m1.m13 * m2.m32;
        m.m13 = m1.m10 * m2.m03 + m1.m11 * m2.m13 + m1.m12 * m2.m23 + m1.m13 * m2.m33;

        // r2
        m.m20 = m1.m20 * m2.m00 + m1.m21 * m2.m10 + m1.m22 * m2.m20 + m1.m23 * m2.m30;
        m.m21 = m1.m20 * m2.m01 + m1.m21 * m2.m11 + m1.m22 * m2.m21 + m1.m23 * m2.m31;
        m.m22 = m1.m20 * m2.m02 + m1.m21 * m2.m12 + m1.m22 * m2.m22 + m1.m23 * m2.m32;
        m.m23 = m1.m20 * m2.m03 + m1.m21 * m2.m13 + m1.m22 * m2.m23 + m1.m23 * m2.m33;

        // r3
        m.m30 = m1.m30 * m2.m00 + m1.m31 * m2.m10 + m1.m32 * m2.m20 + m1.m33 * m2.m30;
        m.m31 = m1.m30 * m2.m01 + m1.m31 * m2.m11 + m1.m32 * m2.m21 + m1.m33 * m2.m31;
        m.m32 = m1.m30 * m2.m02 + m1.m31 * m2.m12 + m1.m32 * m2.m22 + m1.m33 * m2.m32;
        m.m33 = m1.m30 * m2.m03 + m1.m31 * m2.m13 + m1.m32 * m2.m23 + m1.m33 * m2.m33;
       
        return m;
    }
    

    // 00, 01, 02, 03
    // 10, 11, 12, 13
    // 20, 21, 22, 23
    // 30, 31, 32, 33
    transpose()
    {
        const m01 = this.m01;
        const m10 = this.m10;
        this.m01 = m10;
        this.m10 = m01;
        
        const m02 = this.m02;
        const m20 = this.m20;
        this.m02 = m20;
        this.m20 = m02;
        
        const m03 = this.m03;
        const m30 = this.m30;
        this.m03 = m30;
        this.m30 = m03;
        
        const m12 = this.m12;
        const m21 = this.m21;
        this.m12 = m21;
        this.m21 = m12;
        
        const m13 = this.m13;
        const m31 = this.m31;
        this.m13 = m31;
        this.m31 = m13;
        
        const m23 = this.m23;
        const m32 = this.m32;
        this.m23 = m32;
        this.m32 = m23;
        
        return this;
    }

    // https://developer.mozilla.org/ja/docs/Web/API/WebGL_API/WebGL_model_view_projection
    // fov ... rad
    // aspect ... w / h
    static getPerspectiveMatrix(fov, aspect, near, far) {
        const f = 1 / Math.tan(fov / 2);
        const nf = 1 / (near - far);

        const pjm = new Matrix4();

        // pjm.elements[0] = f / aspect;
        // pjm.elements[1] = 0;
        // pjm.elements[2] = 0;
        // pjm.elements[3] = 0;
        // pjm.elements[4] = 0;
        // pjm.elements[5] = f;
        // pjm.elements[6] = 0;
        // pjm.elements[7] = 0;
        // pjm.elements[8] = 0;
        // pjm.elements[9] = 0;
        // pjm.elements[10] = (far + near) * nf;
        // pjm.elements[11] = -1;
        // pjm.elements[12] = 0;
        // pjm.elements[13] = 0;
        // pjm.elements[14] = 2 * far * near * nf;
        // pjm.elements[15] = 0;
        
        // 0, 1, 2, 3 
        // 4, 5, 6, 7
        // 8, 9, 10, 11
        // 12, 13, 14, 15

        pjm.elements[0] = f / aspect;
        pjm.elements[1] = 0;
        pjm.elements[2] = 0;
        pjm.elements[3] = 0;
        pjm.elements[4] = 0;
        pjm.elements[5] = f;
        pjm.elements[6] = 0;
        pjm.elements[7] = 0;
        pjm.elements[8] = 0;
        pjm.elements[9] = 0;
        pjm.elements[10] = (far + near) * nf;
        pjm.elements[11] = 2 * far * near * nf;
        pjm.elements[12] = 0;
        pjm.elements[13] = 0;
        pjm.elements[14] = -1; 
        pjm.elements[15] = 0;

        return pjm;
    }
    
    log()
    {
        console.log(`--------------------
${this.m00}, ${this.m01}, ${this.m02}, ${this.m03},
${this.m10}, ${this.m11}, ${this.m12}, ${this.m13},
${this.m20}, ${this.m21}, ${this.m22}, ${this.m23},
${this.m30}, ${this.m31}, ${this.m32}, ${this.m33},
--------------------`);
    }
}