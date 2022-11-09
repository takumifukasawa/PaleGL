import {Vector3} from "./Vector3.js";

// memory layout is column order
// (num) ... element index
// 00(0), 01(4), 02(8), 03(12),
// 10(1), 11(5), 12(9), 13(13),
// 20(2), 21(6), 22(10), 23(14),
// 30(3), 31(7), 32(11), 33(15),

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

    // row-order in constructor args
    constructor(
        n00, n01, n02, n03,
        n10, n11, n12, n13,
        n20, n21, n22, n23,
        n30, n31, n32, n33,
        // m00 = 0, m01 = 0, m02 = 0, m03 = 0,
        // m10 = 0, m11 = 0, m12 = 0, m13 = 0,
        // m20 = 0, m21 = 0, m22 = 0, m23 = 0,
        // m30 = 0, m31 = 0, m32 = 0, m33 = 0,
    ) {
        this.elements = new Float32Array([
            n00, n10, n20, n30,
            n01, n11, n21, n31,
            n02, n12, n22, n32,
            n03, n13, n23, n33
            // m00, m01, m02, m03,
            // m10, m11, m12, m13,
            // m20, m21, m22, m23,
            // m30, m31, m32, m33,
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
    
    static translationMatrix(v) {
        return new Matrix4(
            1, 0, 0, v.x,
            0, 1, 0, v.y,
            0, 0, 1, v.z,
            0, 0, 0, 1
        );
    }
    
    static scalingMatrix(v) {
        return new Matrix4(
            v.x, 0, 0, 0,
            0, v.y, 0, 0,
            0, 0, v.z, 0,
            0, 0, 0, 1
        );
    }
    
    static rotationXMatrix(rad) {
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        return new Matrix4(
            1, 0, 0, 0, 
            0, c, -s, 0, 
            0, s, c, 0, 
            0, 0, 0, 1
        );
    }
    
    static rotationYMatrix(rad) {
       const c = Math.cos(rad);
       const s = Math.sin(rad);
       return new Matrix4(
           c, 0, s, 0, 
           0, 1, 0, 0, 
           -s, 0, c, 0, 
           0, 0, 0, 1
       );
    }
    
    static rotationZMatrix(rad) {
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        return new Matrix4(
            c, -s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );
    }
    
    static multiplyMatrices(...matrices) {
        const m = Matrix4.identity();
        matrices.forEach(matrix => m.multiply(matrix));
        return m;
    }
    
    multiply(m2) {
        const m1 = this;
        
        const e1 = m1.elements;
        const e2 = m2.elements; 
        
        const ma00 = e1[0], ma01 = e1[4], ma02 = e1[8], ma03 = e1[12];
        const ma10 = e1[1], ma11 = e1[5], ma12 = e1[9], ma13 = e1[13];
        const ma20 = e1[2], ma21 = e1[6], ma22 = e1[10], ma23 = e1[14];
        const ma30 = e1[3], ma31 = e1[7], ma32 = e1[11], ma33 = e1[15];

        const mb00 = e2[0], mb01 = e2[4], mb02 = e2[8], mb03 = e2[12];
        const mb10 = e2[1], mb11 = e2[5], mb12 = e2[9], mb13 = e2[13];
        const mb20 = e2[2], mb21 = e2[6], mb22 = e2[10], mb23 = e2[14];
        const mb30 = e2[3], mb31 = e2[7], mb32 = e2[11], mb33 = e2[15];
       
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
        
        const m = new Matrix4(
            m00, m01, m02, m03,
            m10, m11, m12, m13,
            m20, m21, m22, m23,
            m30, m31, m32, m33
        );
        
        this.copy(m);
       
        return this;
    }
    
    copy(m) {
        this.m00 = m.m00;
        this.m01 = m.m01;
        this.m02 = m.m02;
        this.m03 = m.m03;
        this.m10 = m.m10;
        this.m11 = m.m11;
        this.m12 = m.m12;
        this.m13 = m.m13;
        this.m20 = m.m20;
        this.m21 = m.m21;
        this.m22 = m.m22;
        this.m23 = m.m23;
        this.m30 = m.m30;
        this.m31 = m.m31;
        this.m32 = m.m32;
        this.m33 = m.m33;
        return this;
    }
    
    clone() {
        const m = Matrix4.identity();
        m.m00 = this.m00;
        m.m01 = this.m01;
        m.m02 = this.m02;
        m.m03 = this.m03;
        m.m10 = this.m10;
        m.m11 = this.m11;
        m.m12 = this.m12;
        m.m13 = this.m13;
        m.m20 = this.m20;
        m.m21 = this.m21;
        m.m22 = this.m22;
        m.m23 = this.m23;
        m.m30 = this.m30;
        m.m31 = this.m31;
        m.m32 = this.m32;
        m.m33 = this.m33;
        return m;
    }

    transpose() {
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
    
    // ref: https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix4.js
    invert() {

        // based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
        const te = this.elements,

            n11 = te[ 0 ], n21 = te[ 1 ], n31 = te[ 2 ], n41 = te[ 3 ],
            n12 = te[ 4 ], n22 = te[ 5 ], n32 = te[ 6 ], n42 = te[ 7 ],
            n13 = te[ 8 ], n23 = te[ 9 ], n33 = te[ 10 ], n43 = te[ 11 ],
            n14 = te[ 12 ], n24 = te[ 13 ], n34 = te[ 14 ], n44 = te[ 15 ],

            t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
            t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
            t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
            t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

        const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

        if ( det === 0 ) return new Matrix4( 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 );

        const detInv = 1 / det;

        te[ 0 ] = t11 * detInv;
        te[ 1 ] = ( n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44 ) * detInv;
        te[ 2 ] = ( n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44 ) * detInv;
        te[ 3 ] = ( n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43 ) * detInv;

        te[ 4 ] = t12 * detInv;
        te[ 5 ] = ( n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44 ) * detInv;
        te[ 6 ] = ( n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44 ) * detInv;
        te[ 7 ] = ( n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43 ) * detInv;

        te[ 8 ] = t13 * detInv;
        te[ 9 ] = ( n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44 ) * detInv;
        te[ 10 ] = ( n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44 ) * detInv;
        te[ 11 ] = ( n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43 ) * detInv;

        te[ 12 ] = t14 * detInv;
        te[ 13 ] = ( n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34 ) * detInv;
        te[ 14 ] = ( n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34 ) * detInv;
        te[ 15 ] = ( n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33 ) * detInv;

        return this;
    }

    // ref: https://marina.sys.wakayama-u.ac.jp/~tokoi/?date=20090829
    static getOrthographicMatrix(left, right, bottom, top, near, far) {
        const m00 = 2 / (right - left); // scale x
        const m11 = 2 / (top - bottom); // scale y
        const m22 = -2 / (far - near); // scale z
        const m03 = -(right + left) / (right - left); // translate x
        const m13 = -(top + bottom) / (top - bottom); // translate y
        const m23 = -(far + near) / (far - near); // translate z
        return new Matrix4(
            m00, 0, 0, m03,
            0, m11, 0, m13,
            0, 0, m22, m23,
            0, 0, 0, 1
        );
    }

    // fov ... rad
    // aspect ... w / h
    static getPerspectiveMatrix(fov, aspect, near, far) {
        const f = 1 / Math.tan(fov / 2);
        const nf = 1 / (near - far);

        const pjm = new Matrix4();

        // https://developer.mozilla.org/ja/docs/Web/API/WebGL_API/WebGL_model_view_projection
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
        // pjm.elements[11] = 2 * far * near * nf;
        // pjm.elements[12] = 0;
        // pjm.elements[13] = 0;
        // pjm.elements[14] = -1; 
        // pjm.elements[15] = 0;

        // https://github.com/toji/gl-matrix/blob/master/src/mat4.js
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
        pjm.elements[11] = -1;
        pjm.elements[12] = 0;
        pjm.elements[13] = 0;
        pjm.elements[15] = 0;
        if (far != null && far !== Infinity) {
            const nf = 1 / (near - far);
            pjm.elements[10] = (far + near) * nf;
            pjm.elements[14] = 2 * far * near * nf;
        } else {
            pjm.elements[10] = -1;
            pjm.elements[14] = -2 * near;
        }
        
        return pjm;
    }
    
    log()
    {
        // col order to row order
        console.log(`--------------------
${this.m00}, ${this.m10}, ${this.m20}, ${this.m30},
${this.m01}, ${this.m11}, ${this.m21}, ${this.m31},
${this.m02}, ${this.m12}, ${this.m22}, ${this.m32},
${this.m03}, ${this.m13}, ${this.m23}, ${this.m33},
--------------------`);
    }
}