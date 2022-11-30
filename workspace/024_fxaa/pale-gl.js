class Vector3 {
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
        return Vector3.crossVectors(t, n.clone().negate());
    }
    
    static fill(value) {
        return new Vector3(value, value, value);
    }
    
    log() {
        console.log(`--------------------
${this.x}, ${this.y}, ${this.z}
--------------------`);       
    }
}
﻿

// memory layout is column order.
// setter and getter are row order.
// (num) ... element index
// m00(0), m01(4), m02(8), m03(12),
// m10(1), m11(5), m12(9), m13(13),
// m20(2), m21(6), m22(10), m23(14),
// m30(3), m31(7), m32(11), m33(15),

class Matrix4 {
    elements;
    
    get m00() {
        return this.elements[0];
    }
    
    get m01() {
        return this.elements[4];
    }
    
    get m02() {
        return this.elements[8];
    }
    
    get m03() {
        return this.elements[12];
    }

    get m10() {
        return this.elements[1];
    }

    get m11() {
        return this.elements[5];
    }

    get m12() {
        return this.elements[9];
    }

    get m13() {
        return this.elements[13];
    }
    
    get m20() {
        return this.elements[2];
    }

    get m21() {
        return this.elements[6];
    }

    get m22() {
        return this.elements[10];
    }

    get m23() {
        return this.elements[14];
    }

    get m30() {
        return this.elements[3];
    }

    get m31() {
        return this.elements[7];
    }

    get m32() {
        return this.elements[11];
    }

    get m33() {
        return this.elements[15];
    }
    
    set m00(value) {
        this.elements[0]= value;
    }

    set m01(value) {
        this.elements[4]= value;
    }

    set m02(value) {
        this.elements[8]= value;
    }

    set m03(value) {
        this.elements[12]= value;
    }

    set m10(value) {
        this.elements[1]= value;
    }

    set m11(value) {
        this.elements[5]= value;
    }

    set m12(value) {
        return this.elements[9]= value;
    }

    set m13(value) {
        return this.elements[13]= value;
    }

    set m20(value) {
        return this.elements[2]= value;
    }

    set m21(value) {
        return this.elements[6]= value;
    }

    set m22(value) {
        return this.elements[10]= value;
    }

    set m23(value) {
        return this.elements[14]= value;
    }

    set m30(value) {
        return this.elements[3]= value;
    }

    set m31(value) {
        return this.elements[7]= value;
    }

    set m32(value) {
        return this.elements[11]= value;
    }

    set m33(value) {
        return this.elements[15]= value;
    }
    
    get position() {
        return new Vector3(this.m03, this.m13, this.m23);
    }
    
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
        this.set(
            n00, n01, n02, n03,
            n10, n11, n12, n13,
            n20, n21, n22, n23,
            n30, n31, n32, n33
        );
    }

    // row-order in constructor args
    set(
        n00, n01, n02, n03,
        n10, n11, n12, n13,
        n20, n21, n22, n23,
        n30, n31, n32, n33,
    ) {
        this.elements = new Float32Array([
           n00, n10, n20, n30,
           n01, n11, n21, n31,
           n02, n12, n22, n32,
           n03, n13, n23, n33
        ]);
        return this;
    }

    static identity() {
        return new Matrix4(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        );
    }
    
    setTranslation(v) {
        this.m03 = v.x;
        this.m13 = v.y;
        this.m23 = v.z;
        return this;
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
        return;
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
   
    // ref: http://www.info.hiroshima-cu.ac.jp/~miyazaki/knowledge/tech0023.html
    // invert() {
    //     const m11 = this.m00;
    //     const m12 = this.m01;
    //     const m13 = this.m02;
    //     const m14 = this.m03;
    //     const m21 = this.m10;
    //     const m22 = this.m11;
    //     const m23 = this.m12;
    //     const m24 = this.m13;
    //     const m31 = this.m20;
    //     const m32 = this.m21;
    //     const m33 = this.m22;
    //     const m34 = this.m23;
    //     const m41 = this.m30;
    //     const m42 = this.m31;
    //     const m43 = this.m32;
    //     const m44 = this.m33;
    //     
    //     const det = 
    //               m11 * m22 * m33 * m44 + m11 * m23 * m34 * m42 + m11 * m24 * m32 * m43
    //             + m12 * m21 * m34 * m43 + m12 * m23 * m31 * m44 + m12 * m24 * m33 * m41
    //             + m13 * m21 * m32 * m44 + m13 * m22 * m34 * m41 + m13 * m24 * m31 * m42
    //             + m14 * m21 * m33 * m42 - m14 * m22 * m31 * m43 + m14 * m23 * m32 * m41
    //             - m11 * m22 * m34 * m43 - m11 * m23 * m32 * m44 - m11 * m24 * m33 * m42
    //             - m12 * m21 * m33 * m44 - m12 * m23 * m34 * m41 - m12 * m24 * m31 * m43
    //             - m13 * m21 * m34 * m42 - m13 * m22 * m31 * m44 - m13 * m24 * m32 * m41
    //             - m14 * m21 * m32 * m43 - m14 * m22 * m33 * m41 - m14 * m23 * m31 * m42;
    //     
    //     const invD = 1 / det;
    //    
    //     const n11 = (m22 * m33 * m44 + m23 * m34 * m42 + m24 * m32 * m43 - m22 * m34 * m43 - m23 * m32 * m44 - m24 * m33 * m42) * invD;
    //     const n12 = (m12 * m34 * m43 + m13 * m32 * m44 + m14 * m33 * m42 - m12 * m33 * m44 - m13 * m34 * m42 - m14 * m32 * m43) * invD;
    //     const n13 = (m12 * m23 * m44 + m13 * m24 * m42 + m14 * m22 * m43 - m12 * m24 * m43 - m13 * m22 * m44 - m14 * m23 * m42) * invD;
    //     const n14 = (m12 * m24 * m33 + m13 * m22 * m34 + m14 * m23 * m32 - m12 * m23 * m34 - m13 * m24 * m32 - m14 * m22 * m33) * invD;
    //     
    //     const n21 = (m21 * m34 * m43 + m23 * m31 * m44 + m24 * m33 * m41 - m21 * m33 * m44 - m23 * m34 * m41 - m24 * m31 * m43) * invD;
    //     const n22 = (m11 * m33 * m44 + m13 + m34 * m41 + m14 * m31 * m43 - m11 * m34 * m43 - m13 * m31 * m44 - m14 * m33 * m41) * invD;
    //     const n23 = (m11 * m24 * m43 + m13 * m21 * m44 + m14 * m23 * m41 - m11 * m23 * m44 - m13 * m24 * m41 - m14 * m21 * m43) * invD;
    //     const n24 = (m11 * m23 * m34 + m13 * m24 * m31 + m14 * m21 * m33 - m11 * m24 * m33 - m13 * m21 * m34 - m14 * m23 * m31) * invD;
    //     
    //     const n31 = (m21 * m32 * m44 + m22 * m34 * m41 + m24 * m31 * m42 - m21 * m34 * m41 - m22 * m31 * m44 - m24 * m32 * m41) * invD;
    //     const n32 = (m11 * m34 * m42 + m12 * m31 * m44 + m14 * m32 * m41 - m11 * m32 * m44 - m12 * m34 * m41 - m14 * m31 * m42) * invD;
    //     const n33 = (m11 * m22 * m44 + m12 * m24 * m41 + m14 * m21 * m42 - m11 * m24 * m42 - m12 * m21 * m44 - m14 * m22 * m41) * invD;
    //     const n34 = (m11 * m24 * m32 + m12 * m21 * m34 + m14 * m22 * m31 - m11 * m22 * m34 - m12 * m24 * m31 - m14 * m21 * m32) * invD;
    //     
    //     const n41 = (m21 * m33 * m41 + m22 * m31 * m42 + m23 * m32 * m41 - m21 * m32 * m43 - m22 * m33 * m41 - m23 * m32 * m42) * invD;
    //     const n42 = (m11 * m32 * m43 + m12 * m33 * m41 + m13 * m31 * m42 - m11 * m33 * m42 - m12 * m31 * m43 - m13 * m32 * m41) * invD;
    //     const n43 = (m11 * m23 * m42 + m12 * m21 * m43 + m13 + m22 * m41 - m11 * m22 * m43 - m12 * m23 * m41 - m13 * m21 * m42) * invD;
    //     const n44 = (m11 * m22 * m33 + m12 * m23 * m31 + m13 * m21 * m32 - m11 * m23 * m32 - m12 * m21 * m33 - m13 * m22 * m31) * invD;
    //     
    //     return new Matrix4(
    //         n11, n12, n13, n14,
    //         n21, n22, n23, n24,
    //         n31, n32, n33, n34,
    //         n41, n42, n43, n44
    //     );
    // }
    
    // ref: https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix4.js
    invert() {

        // based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
        const te = this.elements,

            n11 = te[0], n21 = te[1], n31 = te[2], n41 = te[3],
            n12 = te[4], n22 = te[5], n32 = te[6], n42 = te[7],
            n13 = te[8], n23 = te[9], n33 = te[10], n43 = te[11],
            n14 = te[12], n24 = te[13], n34 = te[14], n44 = te[15],

            t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
            t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
            t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
            t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

        const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

        if (det === 0) return new Matrix4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

        const detInv = 1 / det;

        te[0]= t11 * detInv;
        te[1]= (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * detInv;
        te[2]= (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * detInv;
        te[3]= (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * detInv;

        te[4]= t12 * detInv;
        te[5]= (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * detInv;
        te[6]= (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * detInv;
        te[7]= (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * detInv;

        te[8]= t13 * detInv;
        te[9]= (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * detInv;
        te[10]= (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * detInv;
        te[11]= (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * detInv;

        te[12]= t14 * detInv;
        te[13]= (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * detInv;
        te[14]= (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * detInv;
        te[15]= (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * detInv;

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

    // ref
    // https://developer.mozilla.org/ja/docs/Web/API/WebGL_API/WebGL_model_view_projection
    // fov ... rad
    // aspect ... w / h
    static getPerspectiveMatrix(fov, aspect, near, far) {
        const f = 1 / Math.tan(fov / 2);
        // const nf = 1 / (near - far);

        const pjm = new Matrix4();

        pjm.m00 = f / aspect;
        pjm.m10 = 0;
        pjm.m20 = 0;
        pjm.m30 = 0;
        pjm.m01 = 0;
        pjm.m11 = f;
        pjm.m21 = 0;
        pjm.m31 = 0;
        pjm.m02 = 0;
        pjm.m12 = 0;
        pjm.m32 = -1;
        pjm.m03 = 0;
        pjm.m13 = 0;
        pjm.m33 = 0;
        if (far != null && far !== Infinity) {
            const nf = 1 / (near - far);
            pjm.m22 = (far + near) * nf;
            pjm.m23 = 2 * far * near * nf;
        } else {
            pjm.m22 = -1;
            pjm.m23 = -2 * near;
        }
       
        // row-order
        // // https://github.com/toji/gl-matrix/blob/master/src/mat4.js
        // pjm.elements[0]= f / aspect; // m00
        // pjm.elements[1]= 0; // m10
        // pjm.elements[2]= 0; // m20
        // pjm.elements[3]= 0; // m30
        // pjm.elements[4]= 0; // m01
        // pjm.elements[5]= f; // m11
        // pjm.elements[6]= 0; // m21
        // pjm.elements[7]= 0; // m31
        // pjm.elements[8]= 0; // m02
        // pjm.elements[9]= 0; // m12
        // pjm.elements[11]= -1; // m32
        // pjm.elements[12]= 0; // m03
        // pjm.elements[13]= 0; // m13
        // pjm.elements[15]= 0; // m33
        // if (far != null && far !== Infinity) {
        //     const nf = 1 / (near - far);
        //     pjm.elements[10]= (far + near) * nf; // m22
        //     pjm.elements[14]= 2 * far * near * nf; // m23
        // } else {
        //     pjm.elements[10]= -1; // m22
        //     pjm.elements[14]= -2 * near; // m23
        // }
        
        return pjm;
    }
    
    static getLookAtMatrix(eye, center, up = new Vector3(0, 1, 0), inverseForward = false) {
        const f = inverseForward
            ? Vector3.subVectors(eye, center).normalize() // ex. 主にカメラ。投影の関係で逆になるので。
            : Vector3.subVectors(center, eye).normalize();
        const r = Vector3.crossVectors(up.normalize(), f).normalize();
        const u = Vector3.crossVectors(f, r);
        const result = new Matrix4(
            r.x, u.x, f.x, eye.x,
            r.y, u.y, f.y, eye.y,
            r.z, u.z, f.z, eye.z,
            0, 0, 0, 1,
        );
        return result;
    }
    
    static fromTRS(position, rotation, scaling) {
        const rotationRadians = rotation.getAxesRadians();
        return Matrix4.multiplyMatrices(
            Matrix4.translationMatrix(position),
            Matrix4.rotationYMatrix(rotationRadians.y),
            Matrix4.rotationXMatrix(rotationRadians.x),
            Matrix4.rotationZMatrix(rotationRadians.z),
            Matrix4.scalingMatrix(scaling)
        );
    }
    
    static fromQuaternion(q) {
        const euler = q.toEulerRadian();
        return Matrix4.multiplyMatrices(
            Matrix4.rotationYMatrix(euler.y),
            Matrix4.rotationXMatrix(euler.x),
            Matrix4.rotationZMatrix(euler.z),
        );
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
﻿const PrimitiveTypes = {
    Points: "Points",
    Lines: "Lines",
    LineLoop: "LineLoop",
    LineStrip: "LineStrip",
    Triangles: "Triangles",
    TriangleStrip: "TriangleStrip",
    TriangleFan: "TriangleFan",
};

const AttributeTypes = {
    Position: "Position",
};

const UniformTypes = {
    Matrix4: "Matrix4",
    Matrix4Array: "Matrix4Array",
    Texture: "Texture",
    CubeMap: "CubeMap",
    Vector2: "Vector2",
    Vector3: "Vector3",
    Struct: "Struct",
    Float: "Float",
    Color: "Color",
};

const TextureTypes = {
    RGBA: "RGBA",
    Depth: "Depth",
};

const TextureWrapTypes = {
    Repeat: "Repeat",
    ClampToEdge: "ClampToEdge",
};

const TextureFilterTypes = {
    Nearest: "Nearest", // min, mag
    Linear: "Linear", // min, mag
    NearestMipmapNearest: "NearestMipmapNearest", // only min filter
    NearestMipmapLinear: "NearestMipmapLinear", // only min filter,
    LinearMipmapNearest: "LinearMipmapNearest", // only min filter
    LinearMipmapLinear: "LinearMipmapLinear", // only min filter
};

const BlendTypes = {
    Opaque: "Opaque",
    Transparent: "Transparent",
    Additive: "Additive",
};

const RenderQueues = {
    Skybox: 1,
    Opaque: 2,
    AlphaTest: 3,
    Transparent: 4
};

const RenderbufferTypes = {
    Depth: "Depth",
};

const ActorTypes = {
    Null: "Null",
    Mesh: "Mesh",
    SkinnedMesh: "SkinnedMesh",
    Light: "Light",
    Skybox: "Skybox",
    Camera: "Camera",
};

const CubeMapAxis = {
    PositiveX: "PositiveX",
    NegativeX: "NegativeX",
    PositiveY: "PositiveY",
    NegativeY: "NegativeY",
    PositiveZ: "PositiveZ",
    NegativeZ: "NegativeZ",
};

// const CameraClearType = {
//     Skybox: "Skybox",
//     Color: "Color",
//     // TODO: type for NONE
// };

const FaceSide = {
    Front: "Front",
    Back: "Back",
    Double: "Double"
};

// TODO: rename Type"s"
const AttributeUsageType = {
    StaticDraw: "StaticDraw",
    DynamicDraw: "DynamicDraw"
};

const RenderTargetTypes = {
    RGBA: "RGBA",
    Depth: "Depth"
};

const AnimationKeyframeTypes = {
    Vector3: "Vector3",
    Quaternion: "Quaternion"
    // Rotator: "Rotator",
    // Scalar: "Scalar"
};
﻿class Rotator {
    // x, y, z axes
    // 一旦そのままdegreeが入る想定
    elements; 
   
    // degree
    get x() {
        return this.elements[0];
    }
   
    // degree
    get y() {
        return this.elements[1];
    }
   
    // degree
    get z() {
        return this.elements[2];
    }

    // degree
    get roll() {
        return this.elements[2];
    }

    // degree
    get pitch() {
        return this.elements[0];
    }

    // degree
    get yaw() {
        return this.elements[1];
    }
    
    getAxes() {
        return {
            x: this.elements[0],
            y: this.elements[1],
            z: this.elements[2],
        }
    }
    
    getAxesRadians() {
        return {
            x: this.elements[0] * Math.PI / 180 ,
            y: this.elements[1] * Math.PI / 180 ,
            z: this.elements[2] * Math.PI / 180 ,
        }
    }

    // degrees
    constructor(x, y, z) {
        this.set(x, y, z);
    }
    
    set(x, y, z) {
        this.elements = new Float32Array([x, y, z]);
        return this;
    }
    
    static zero() {
        return new Rotator(0, 0, 0);
    }
    
    static fromRadian(x, y, z) {
        const rotator = new Rotator().set(
            x * 180 / Math.PI,
            y * 180 / Math.PI,
            z * 180 / Math.PI,
        );
        return rotator;
    }
    
    setRotationX(degree) {
        this.elements[0] = degree;
    }
    
    setRotationY(degree) {
        this.elements[1] = degree;
    }
    
    setRotationZ(degree) {
        this.elements[2] = degree;
    }
}

﻿




// TODO: 
// - 外側から各種propertyを取得するときはmatrix更新した方がいい？
// - NodeBaseを継承
class Transform {
    parent;
    actor;
    children = [];
    #worldMatrix = Matrix4.identity();
    #localMatrix = Matrix4.identity();
    position = Vector3.zero();
    rotation = Rotator.zero(); // degree vector
    scale = Vector3.one();
    lookAtTarget = null; // world v

    get childCount() {
        return this.children.length;
    }

    get hasChild() {
        return this.childCount > 0;
    }

    get worldMatrix() {
        return this.#worldMatrix;
    }

    get localMatrix() {
        return this.#localMatrix;
    }

    // get localPosition() {
    //     return this.position.clone();
    // }

    get worldPosition() {
        return this.#worldMatrix.position;
    }
    
    get worldRight() {
        return new Vector3(this.#worldMatrix.m00, this.#worldMatrix.m10, this.#worldMatrix.m20).normalize();
    }

    get worldUp() {
        return new Vector3(this.#worldMatrix.m01, this.#worldMatrix.m11, this.#worldMatrix.m21).normalize();
    }

    get worldForward() {
        return new Vector3(this.#worldMatrix.m02, this.#worldMatrix.m12, this.#worldMatrix.m22).normalize();
    }

    addChild(child) {
        this.children.push(child);
    }

    // TODO: 引数でworldMatrixとdirty_flagを渡すべきな気がする
    updateMatrix() {
        if (this.lookAtTarget) {
            // TODO:
            // - up vector 渡せるようにする
            // - parentがあるとlookatの方向が正しくなくなるので親の回転を打ち消す必要がある
            const lookAtMatrix = this.actor.type === ActorTypes.Camera
                ? Matrix4.getLookAtMatrix(this.position, this.lookAtTarget, Vector3.up(), true)
                : Matrix4.getLookAtMatrix(this.position, this.lookAtTarget);
            const scalingMatrix = Matrix4.scalingMatrix(this.scale);
            this.#localMatrix = Matrix4.multiplyMatrices(lookAtMatrix, scalingMatrix);
        } else {
            const translationMatrix = Matrix4.translationMatrix(this.position);
            const rotationAxes = this.rotation.getAxes();
            const rotationXMatrix = Matrix4.rotationXMatrix(rotationAxes.x / 180 * Math.PI);
            const rotationYMatrix = Matrix4.rotationYMatrix(rotationAxes.y / 180 * Math.PI);
            const rotationZMatrix = Matrix4.rotationZMatrix(rotationAxes.z / 180 * Math.PI);
            // roll(Z), pitch(X), yaw(Y)
            const rotationMatrix = Matrix4.multiplyMatrices(rotationYMatrix, rotationXMatrix, rotationZMatrix);
            const scalingMatrix = Matrix4.scalingMatrix(this.scale);
            this.#localMatrix = Matrix4.multiplyMatrices(translationMatrix, rotationMatrix, scalingMatrix);
        }
        this.#worldMatrix = this.parent
            ? Matrix4.multiplyMatrices(this.parent.worldMatrix, this.#localMatrix)
            : this.#localMatrix;
    }

    setScaling(s) {
        this.scale = s;
    }

    setRotationX(degree) {
        // this.rotation.x = degree;
        this.rotation.setRotationX(degree);
    }

    setRotationY(degree) {
        // this.rotation.y = degree;
        this.rotation.setRotationY(degree);
    }

    setRotationZ(degree) {
        // this.rotation.z = degree;
        this.rotation.setRotationZ(degree);
    }

    setTranslation(v) {
        this.position = v;
    }

    lookAt(lookAtTarget) {
        this.lookAtTarget = lookAtTarget;
    }

    // lookAt(center, up = new Vector3(0, 1, 0)) {
    //     console.log(this.#localMatrix.clone())
    //     this.#localMatrix.lookAt(center, up);
    //     console.log(this.#localMatrix.clone())
    // }
}

// ref: https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

class Animator {
    #animationClips;
    #playingAnimationClip;
    
    get animationClips() {
        return this.#animationClips;
    }
    
    constructor(animationClips) {
        this.#animationClips = animationClips || [];
    }
    
    setAnimationClips(animationClips) {
        this.#animationClips = animationClips;
    }
    
    play(name) {
        const animationClip = this.#animationClips.find(animationClip => name === animationClip.name);
        if(!animationClip) {
            return;
        }
        animationClip.play();
        this.#playingAnimationClip = animationClip;
    }
   
    // 呼ぶ側によってはdeltaTimeでもfixedDeltaTimeでもOK
    update(deltaTime) {
        if(!this.#playingAnimationClip) {
            return;
        }
        this.#playingAnimationClip.update(deltaTime);
    }
}
﻿




class Actor {
    transform = new Transform();
    type;
    uuid;
    isStarted = false;
    animator; // NOTE: いよいよcomponentっぽくしたくなってきた
    // lifecycle callback
    #onStart;
    #onFixedUpdate;
    #onUpdate;
    
    set onStart(value) {
        this.#onStart = value;
    }
    
    set onFixedUpdate(value) {
        this.#onFixedUpdate = value;
    }
    
    set onUpdate(value) {
        this.#onUpdate = value;
    }
    
    constructor(type) {
        this.transform.actor = this;
        this.type = type || ActorTypes.Null;
        this.uuid = uuidv4();
        this.animator = new Animator();
    }
    
    addChild(child) {
        this.transform.addChild(child);
        child.transform.parent = this.transform;
    }
   
    setSize(width, height) {
    }
    
    #tryStart({ gpu }) {
        if(this.isStarted) {
            return;
        }
        this.isStarted = true;
        this.start({ gpu });
    }

    updateTransform() {
        this.transform.updateMatrix();
    }
    
    // -----------------------------------------------------------------
    // actor lifecycle
    // -----------------------------------------------------------------
    
    start({ gpu } = {}) {
        if(this.#onStart) {
            this.#onStart({ actor: this, gpu });
        }
    }
    
    fixedUpdate({ gpu, fixedTime, fixedDeltaTime } = {}) {
        this.#tryStart({ gpu });
        if(this.animator) {
            this.animator.update(fixedDeltaTime);
        }
        if(this.#onFixedUpdate) {
            this.#onFixedUpdate({ actor: this, gpu, fixedTime, fixedDeltaTime });
        }
    }

    update({ gpu, time, deltaTime } = {}) {
        this.#tryStart({ gpu });
        if(this.#onUpdate) {
            this.#onUpdate({ actor: this, gpu, time, deltaTime });
        }
    }
}
﻿class GLObject {
    get glObject() {
        throw "should implementation glObject getter";
    }
}
﻿

class Shader extends GLObject {
    #program;
    
    get glObject() {
        return this.#program;
    }
    
    constructor({ gpu, vertexShader, fragmentShader }) {
        super();
       
        // cache
        const gl = gpu.gl;
      
        // vertex shader
        
        // create vertex shader  
        const vs = gl.createShader(gl.VERTEX_SHADER);
        // set shader source (string)
        gl.shaderSource(vs, vertexShader);
        // compile vertex shader
        gl.compileShader(vs);
        // check shader info log
        const vsInfo = gl.getShaderInfoLog(vs);
        if(vsInfo.length > 0) {
            console.error("[Shader] vertex shader has error");
            throw vsInfo;
        }

        // fragment shader

        // create fragment shader  
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        // set shader source (string)
        gl.shaderSource(fs, fragmentShader);
        // compile fragment shader
        gl.compileShader(fs);
        const fsInfo = gl.getShaderInfoLog(fs);
        // check shader info log
        if(fsInfo.length > 0) {
            console.error("[Shader] fragment shader has error");
            throw fsInfo;
        }
        
        // program object
        
        this.#program = gl.createProgram();
       
        // attach shaders
        gl.attachShader(this.#program, vs);
        gl.attachShader(this.#program, fs);
       
        // program link to gl context
        gl.linkProgram(this.#program);

        // check program info log
        const programInfo = gl.getProgramInfoLog(this.#program);
        if(programInfo.length > 0) {
            throw programInfo;
        }
    }
}
﻿const generateDepthFragmentShader = () => `#version 300 es

precision mediump float;

out vec4 outColor;

void main() {
    outColor = vec4(1., 1., 1., 1.);
}
`;

﻿





class Material {
    shader;
    primitiveType;
    blendType;
    renderQueue;
    uniforms = {};
    depthUniforms;
    depthTest;
    depthWrite;
    alphaTest;
    culling;
    faceSide;
    receiveShadow;
    isSkinning;
    queue;
    
    vertexShader;
    fragmentShader;
    depthFragmentShader;
   
    get isCompiledShader() {
        return !!this.shader;
    }
    
    constructor({
        gpu,
        vertexShader,
        fragmentShader,
        depthFragmentShader,
        primitiveType,
        depthTest = null,
        depthWrite = null,
        alphaTest = null,
        faceSide = FaceSide.Front,
        receiveShadow = false,
        blendType,
        renderQueue,
        isSkinning,
        queue,
        uniforms = {},
        depthUniforms = {}
    }) {
        // 外側から任意のタイミングでcompileした方が都合が良さそう
        // this.shader = new Shader({gpu, vertexShader, fragmentShader});

        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;
        this.depthFragmentShader = depthFragmentShader;
        
        this.primitiveType = primitiveType || PrimitiveTypes.Triangles;
        this.blendType = blendType || BlendTypes.Opaque;

        this.depthTest = depthTest !== null ? depthTest : true;
        this.depthWrite = depthWrite;
        this.alphaTest = alphaTest;

        this.faceSide = faceSide;
        this.receiveShadow = !!receiveShadow;

        if (!!renderQueue) {
            this.renderQueue = renderQueue;
        } else {
            switch (this.blendType) {
                case BlendTypes.Opaque:
                    this.renderQueue = RenderQueues.Opaque;
                    break;
                case BlendTypes.Transparent:
                case BlendTypes.Additive:
                    this.renderQueue = RenderQueues.Transparent;
                    break;
            }
        }

        if (!this.renderQueue) {
            throw "[Material.constructor] invalid render queue";
        }
        
        this.isSkinning = isSkinning || !!uniforms.uJointMatrices;

        // TODO: シェーダーごとにわける？(postprocessやreceiveShadow:falseの場合はいらないuniformなどがある
        const commonUniforms = {
            uWorldMatrix: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity()
            },
            uViewMatrix: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity()
            },
            uProjectionMatrix: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity()
            },
            uNormalMatrix: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity()
            },
            // TODO: viewmatrixから引っ張ってきてもよい
            uViewPosition: {
                type: UniformTypes.Vector3,
                value: Vector3.zero()
            },

            ...(this.alphaTest ? {
                uAlphaTestThreshold: {
                    type: UniformTypes.Float,
                    value: this.alphaTest
                }
            } : {})
        };
        
        const shadowUniforms = this.receiveShadow ? {
            uShadowMap: {
                type: UniformTypes.Texture,
                value: null,
            },
            uShadowMapProjectionMatrix: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity()
            },
            // TODO: shadow map class を作って bias 持たせた方がよい
            uShadowBias: {
                type: UniformTypes.Float,
                value: 0.01
            }
        } : {};
        
        this.queue = queue || null;

        this.uniforms = {...commonUniforms, ...shadowUniforms, ...uniforms};
        
        this.depthUniforms = {...commonUniforms, ...depthUniforms };
    }
    
    compileShader({ gpu }) {
        this.shader = new Shader({
            gpu,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
        });
    }
}

﻿




class Mesh extends Actor {
    geometry;
    // material;
    materials = [];
    depthMaterial;
    castShadow;
    autoGenerateDepthMaterial;
    
    get material() {
        if(this.materials.length > 1) {
            console.warn("[Mesh.material getter] materials length > 1. material is head of materials.")
        }
        // return this.materials[0];
        return this.mainMaterial;
    }
    
    set material(material) {
        this.materials = [material];
    }
    
    get mainMaterial() {
        // materiamainMaterial.alphaTest
        return this.materials[0];
    }
    
    constructor({
        geometry,
        material,
        materials,
        depthMaterial = null,
        actorType = ActorTypes.Mesh,
        castShadow = false,
        autoGenerateDepthMaterial = true
    }) {
        super(actorType);
        this.geometry = geometry;
        // this.material = material;
        // TODO: check material is array
        this.materials = material !== null ? [material] : materials;
        this.depthMaterial = depthMaterial;
        this.castShadow = !!castShadow;
        this.autoGenerateDepthMaterial = autoGenerateDepthMaterial;
    }
 
    start(options) {
        super.start(options);
        
        const { gpu } = options;
        
        if(
            !this.depthMaterial &&
            this.autoGenerateDepthMaterial
        ) {
            this.depthMaterial = new Material({
                gpu,
                vertexShader: this.material.vertexShader,
                fragmentShader: this.material.depthFragmentShader || generateDepthFragmentShader(),
                uniforms: this.material.depthUniforms,
                faceSide: this.material.faceSide
            });
        }
    }

    // beforeRenderはActorに持たせても良い
    beforeRender(options) {
        const { gpu } = options;

        this.materials.forEach(material => {
            if(!material.isCompiledShader) {
                material.compileShader({ gpu });
            }
        });
        if(this.depthMaterial && !this.depthMaterial.isCompiledShader) {
            this.depthMaterial.compileShader({ gpu });
        }       
    }
}
﻿
async function loadObj(path) {
    const response = await fetch(path);
    const content = await response.text();
    return parseObj(content);
}

function parseObj(content) {
    const rawPositions = [];
    const rawNormals = [];
    const rawUvs = [];
    const rawFaces = [];
   
    // for debug
    // console.log(content);
    
    const lines = content.split("\n");
    lines.forEach(line => {
        const elements = line.split(" ");
        const header = elements[0];
        switch(header) {
            // ------------------------------------------------------------------------------
            // # format position
            // v x y z [,w]
            // ------------------------------------------------------------------------------
            case "v":
                rawPositions.push([
                    Number.parseFloat(elements[1]),
                    Number.parseFloat(elements[2]),
                    Number.parseFloat(elements[3]),
                ]);
                break;
            // ------------------------------------------------------------------------------
            // # format normal. normal is may not be normalized
            // vn x y z
            // ------------------------------------------------------------------------------
            case "vn":
                rawNormals.push([
                    Number.parseFloat(elements[1]),
                    Number.parseFloat(elements[2]),
                    Number.parseFloat(elements[3]),
                ]);
                break;
            // ------------------------------------------------------------------------------
            // # format uv
            // vt u v [,w]
            // ------------------------------------------------------------------------------
            case "vt":
                rawUvs.push([
                    Number.parseFloat(elements[1]),
                    Number.parseFloat(elements[2]),
                ]);
                break;
            // ------------------------------------------------------------------------------
            // # format face indices
            //
            // - pattern_1: has position
            // f p_index p_index p_index
            //
            // - pattern_2: has position and uv
            // f p_index/uv_index p_index/uv_index p_index/uv_index
            //
            // - pattern_3: has position, uv and normal
            // f p_index/uv_index/n_index p_index/uv_index/n_index p_index/uv_index/n_index
            // ------------------------------------------------------------------------------
            case "f":
                rawFaces.push([
                    elements[1],
                    elements[2],
                    elements[3],
                ]);
                break;
        }
    });
    
    const positions = [];
    const uvs = [];
    const normals = [];
    const indices = [];
   
    // TODO: uv, normal がない時の対処
    rawFaces.forEach((face, i) => {
        const v0 = face[0].split("/");
        const v1 = face[1].split("/");
        const v2 = face[2].split("/");
        
        // should offset -1 because face indices begin 1
        
        const p0Index = Number.parseInt(v0[0], 10) - 1;
        const uv0Index = Number.parseInt(v0[1], 10) - 1;
        const normal0Index = Number.parseInt(v0[2], 10) - 1;
        
        const p1Index = Number.parseInt(v1[0], 10) - 1;
        const uv1Index = Number.parseInt(v1[1], 10) - 1;
        const normal1Index = Number.parseInt(v1[2], 10) - 1;
        
        const p2Index = Number.parseInt(v2[0], 10) - 1;
        const uv2Index = Number.parseInt(v2[1], 10) - 1;
        const normal2Index = Number.parseInt(v2[2], 10) - 1;
        
        positions.push(
            rawPositions[p0Index],
            rawPositions[p1Index],
            rawPositions[p2Index]
        );
        
        uvs.push(
            rawUvs[uv0Index],
            rawUvs[uv1Index],
            rawUvs[uv2Index]
        );
        
        normals.push(
            rawNormals[normal0Index],
            rawNormals[normal1Index],
            rawNormals[normal2Index]
        );
       
        const offset = i * 2;
        indices.push(
            i + offset,
            i + offset + 1,
            i + offset + 2
        );
    });
   
    return {
        positions: positions.flat(),
        uvs: uvs.flat(),
        normals: normals.flat(),
        indices
    }
}

﻿

class Attribute {
    data; // data
    location; // layout location index
    size; // data per vertex. ex) position: 3, uv: 2
    offset;
    usageType;
    
    constructor({ data, location, size, offset = 0, usageType = AttributeUsageType.StaticDraw }) {
        this.data = data;
        this.location = location;
        this.size = size;
        this.offset = offset;
        this.usageType = usageType;
    }
}
﻿


class VertexArrayObject extends GLObject {
    #vao;
    #vboList = {};
    #gpu;

    get glObject() {
        return this.#vao;
    }
    
    getUsage(gl, usageType) {
        switch(usageType) {
            case AttributeUsageType.StaticDraw:
                return gl.STATIC_DRAW;
            case AttributeUsageType.DynamicDraw:
                return gl.DYNAMIC_DRAW;
            default:
                throw "invalid usage";
        }
    }

    constructor({gpu, attributes}) {
        super();
        
        this.#gpu = gpu;

        const gl = this.#gpu.gl;
        this.#vao = gl.createVertexArray();

        // bind vertex array to webgl context
        gl.bindVertexArray(this.#vao);

        Object.keys(attributes).forEach(key => {
            const attribute = attributes[key];
            const {data, size, location, usageType} = attribute;
            const vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            const usage = this.getUsage(gl, usageType);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), usage);
            gl.enableVertexAttribArray(location);
            // size ... 頂点ごとに埋める数
            // stride is always 0 because buffer is not interleaved.
            // ref: https://developer.mozilla.org/ja/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
            gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
            
            this.#vboList[key] = { vbo, usage };
        });

        // unbind vertex array to webgl context
        gl.bindVertexArray(null);
    }
    
    updateAttribute(key, data) {
        const gl = this.#gpu.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.#vboList[key].vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), this.#vboList[key].usage);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}
﻿

class IndexBufferObject extends GLObject {
    #ibo;
    
    get glObject() {
        return this.#ibo;
    }
    
    constructor({ gpu, indices }) {
        super();
        
        const gl = gpu.gl;
        
        this.#ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}
﻿





// NOTE: あんまりgpu持たせたくないけど持たせた方がいろいろと楽
// TODO: actorをlifecycleに乗せたのでgpuもたせなくてもいいかも
class Geometry {
    attributes;
    vertexCount;
    vertexArrayObject;
    indexBufferObject;
    indices;
    drawCount;

    #gpu;

    constructor({
        gpu,
        attributes,
        indices,
        drawCount,
        immediateCreate = true,
        calculateTangent = false,
        calculateBinormal = false
    }) {
        this.#gpu = gpu;

        this.attributes = {};
        Object.keys(attributes).forEach((key, i) => {
            const attribute = attributes[key];
            this.attributes[key] = new Attribute({
                data: attribute.data,
                location: attribute.location || i,
                size: attribute.size,
                offset: attribute.offset,
                usage: attribute.usage,
            });
        });
        
        this.drawCount = drawCount;

        if (indices) {
            this.indices = indices;
        }

        if(gpu && immediateCreate) {
            this.#createGeometry({ gpu })
        }
    }
    
    #createGeometry({ gpu }) {
        this.vertexArrayObject = new VertexArrayObject({gpu, attributes: this.attributes})
        if (this.indices) {
            this.indexBufferObject = new IndexBufferObject({gpu, indices: this.indices})
        }
    }
    
    update() {
        if(!this.vertexArrayObject) {
            this.#createGeometry({ gpu: this.#gpu })
        }
    }

    updateAttribute(key, data) {
        this.vertexArrayObject.updateAttribute(key, data);
    }
    
    static createTangentsAndBinormals(normals) {
        const tangents = [];
        const binormals = [];
        for(let i = 0; i < normals.length / 3; i++) {
            const x = normals[i * 3 + 0];
            const y = normals[i * 3 + 1];
            const z = normals[i * 3 + 2];
            const n = new Vector3(x, y, z);
            const t = Vector3.getTangent(n);
            const b = Vector3.getBinormalFromTangent(t, n);
            tangents.push(...t.elements);
            binormals.push(...b.elements);
        }
        return {
            tangents,
            binormals
        };
    }
}





const arrowHelperGeometryData = `
# Blender 3.3.1
# www.blender.org
mtllib untitled.mtl
o Cube
v 2.000000 0.031250 -0.031250
v 2.000000 -0.031250 -0.031250
v -0.125000 -0.125000 0.125000
v -0.125000 0.125000 0.125000
v 2.000000 0.031250 0.031250
v 2.000000 -0.031250 0.031250
v 0.125000 -0.125000 0.125000
v 0.125000 0.125000 0.125000
v -0.125000 0.125000 -0.125000
v 0.125000 -0.125000 -0.125000
v 0.125000 0.125000 -0.125000
v 0.031250 0.031250 2.000000
v 0.031250 -0.031250 2.000000
v -0.031250 0.031250 2.000000
v -0.031250 -0.031250 2.000000
v -0.031250 2.000000 0.031250
v 0.031250 2.000000 0.031250
v -0.031250 2.000000 -0.031250
v 0.031250 2.000000 -0.031250
v 0.125000 -0.125000 0.125000
v 0.125000 0.125000 0.125000
v 0.125000 -0.125000 -0.125000
v 0.125000 0.125000 -0.125000
v -0.125000 0.125000 0.125000
v 0.125000 0.125000 0.125000
v -0.125000 0.125000 -0.125000
v 0.125000 0.125000 -0.125000
v -0.125000 -0.125000 0.125000
v -0.125000 0.125000 0.125000
v 0.125000 -0.125000 0.125000
v 0.125000 0.125000 0.125000
vn 0.0499 -0.0000 -0.9988
vn -0.9988 0.0499 -0.0000
vn 0.0499 -0.9988 -0.0000
vn 0.0499 -0.0000 0.9988
vn 0.0499 0.9988 -0.0000
vn 1.0000 -0.0000 -0.0000
vn 0.9988 -0.0000 0.0499
vn -0.0000 -0.0000 -1.0000
vn -0.0000 0.9988 0.0499
vn -0.0000 -0.9988 0.0499
vn -0.0000 -0.0000 1.0000
vn -0.9988 -0.0000 0.0499
vn -0.0000 -1.0000 -0.0000
vn -0.0000 1.0000 -0.0000
vn -0.0000 0.0499 0.9988
vn 0.9988 0.0499 -0.0000
vn -0.0000 0.0499 -0.9988
vn -1.0000 -0.0000 -0.0000
vt 0.114221 0.031000
vt 0.179909 0.031000
vt 0.081377 0.739333
vt 0.147065 0.031000
vt 0.114221 0.656000
vt 0.081377 0.656000
vt 0.311911 0.000000
vt 0.441550 0.000000
vt 0.409140 0.000000
vt 0.657406 0.000000
vt 0.592467 0.000000
vt 0.376730 0.000000
vt 0.048533 0.656000
vt 0.147065 0.031000
vt 0.048533 0.739333
vt 0.048533 0.656000
vt 0.081377 0.656000
vt 0.409140 0.625000
vt 0.081377 0.031000
vt 0.344321 0.000000
vt 0.048533 0.031000
vt 0.344321 0.000000
vt 0.592467 0.000000
vt 0.147065 0.656000
vt 0.376730 0.625000
vt 0.689875 0.000000
vt 0.559997 0.000000
vt 0.657406 0.000000
vt 0.147065 0.656000
vt 0.114221 0.031000
vt 0.179909 0.656000
vt 0.114221 0.656000
vt 0.624936 0.000000
vt 0.376730 0.000000
vt 0.344321 0.625000
vt 0.344321 0.708333
vt 0.409140 0.000000
vt 0.344321 0.625000
vt 0.376730 0.625000
vt 0.311911 0.708333
vt 0.409140 0.625000
vt 0.311911 0.625000
vt 0.441550 0.625000
vt 0.657406 0.708333
vt 0.592467 0.625000
vt 0.657406 0.625000
vt 0.624936 0.708333
vt 0.689875 0.625000
vt 0.592467 0.625000
vt 0.559997 0.625000
vt 0.657406 0.625000
vt 0.624936 0.625000
vt 0.114221 0.656000
vt 0.114221 0.739333
vt 0.081377 0.656000
vt 0.081377 0.739333
vt 0.657406 0.708333
vt 0.689875 0.708333
vt 0.657406 0.625000
vt 0.689875 0.625000
vt 0.376730 0.625000
vt 0.376730 0.708333
vt 0.344321 0.625000
vt 0.344321 0.708333
s 0
f 11/32/1 2/4/1 10/29/1
f 4/11/2 18/50/2 9/27/2
f 10/30/3 6/17/3 7/19/3
f 7/19/4 5/13/4 8/21/4
f 8/24/5 1/2/5 11/31/5
f 2/6/6 5/15/6 6/16/6
f 8/25/7 13/37/7 7/18/7
f 31/64/8 28/61/8 29/62/8
f 4/12/9 12/35/9 8/22/9
f 7/20/10 15/42/10 3/7/10
f 13/38/11 14/40/11 15/42/11
f 3/8/12 14/41/12 4/9/12
f 26/59/13 25/58/13 24/57/13
f 17/47/14 18/51/14 16/44/14
f 8/26/15 16/46/15 4/10/15
f 11/33/16 17/49/16 8/23/16
f 9/28/17 19/52/17 11/33/17
f 23/56/18 20/53/18 21/54/18
f 11/32/1 1/1/1 2/4/1
f 4/11/2 16/45/2 18/50/2
f 10/30/3 2/5/3 6/17/3
f 7/19/4 6/17/4 5/13/4
f 8/24/5 5/14/5 1/2/5
f 2/6/6 1/3/6 5/15/6
f 8/25/7 12/34/7 13/37/7
f 31/64/8 30/63/8 28/61/8
f 4/12/9 14/39/9 12/35/9
f 7/20/10 13/38/10 15/42/10
f 13/38/11 12/36/11 14/40/11
f 3/8/12 15/43/12 14/41/12
f 26/59/13 27/60/13 25/58/13
f 17/47/14 19/52/14 18/51/14
f 8/26/15 17/48/15 16/46/15
f 11/33/16 19/52/16 17/49/16
f 9/28/17 18/51/17 19/52/17
f 23/56/18 22/55/18 20/53/18
`

class ArrowHelper extends Mesh {
    constructor({ gpu }) {
        const objData = parseObj(arrowHelperGeometryData);
        const geometry = new Geometry({
            gpu,
            attributes: {
                position: {
                    data: objData.positions,
                    size: 3
                },
                uv: {
                    data: objData.uvs,
                    size: 2
                }
            },
            indices: objData.indices,
            drawCount: objData.indices.length
        });
        // const geometry = new ArrowGeometry({ gpu });
        const material = new Material({
            gpu,
            vertexShader: `#version 300 es
            layout (location = 0) in vec3 aPosition;
            layout (location = 1) in vec2 aUv;
            uniform mat4 uWorldMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            out vec2 vUv;
            void main() {
                vUv = aUv;
                gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
            }
            `,
            fragmentShader: `#version 300 es
            precision mediump float;
            in vec2 vUv;
            out vec4 outColor;
            void main() {
                vec3 color = vec3(1., 0., 0.);
                if(vUv.x > .5) {
                    color = vec3(0., 1., 0.);
                } else if(vUv.x > .25) {
                    color = vec3(0., 0., 1.);
                }
                outColor = vec4(color, 1.);
            }
            `
        });
        super({ geometry, material });
    }
    
    // setPosition(p) {
    //     this.transform.setTranslation(p);
    // }

    setDirection(p) {
        this.transform.lookAt(p);
    }

}
﻿




const axesHelperGeometryData = `
# Blender 3.3.1
# www.blender.org
o Cube
v 2.000000 0.031250 -0.031250
v 2.000000 -0.031250 -0.031250
v -0.125000 -0.125000 0.125000
v -0.125000 0.125000 0.125000
v 2.000000 0.031250 0.031250
v 2.000000 -0.031250 0.031250
v 0.125000 -0.125000 0.125000
v 0.125000 0.125000 0.125000
v -0.125000 0.125000 -0.125000
v 0.125000 -0.125000 -0.125000
v 0.125000 0.125000 -0.125000
v 0.031250 0.031250 2.000000
v 0.031250 -0.031250 2.000000
v -0.031250 0.031250 2.000000
v -0.031250 -0.031250 2.000000
v -0.031250 2.000000 0.031250
v 0.031250 2.000000 0.031250
v -0.031250 2.000000 -0.031250
v 0.031250 2.000000 -0.031250
v 0.125000 -0.125000 0.125000
v 0.125000 0.125000 0.125000
v 0.125000 -0.125000 -0.125000
v 0.125000 0.125000 -0.125000
v -0.125000 0.125000 0.125000
v 0.125000 0.125000 0.125000
v -0.125000 0.125000 -0.125000
v 0.125000 0.125000 -0.125000
v -0.125000 -0.125000 0.125000
v -0.125000 0.125000 0.125000
v 0.125000 -0.125000 0.125000
v 0.125000 0.125000 0.125000
vn 0.0499 -0.0000 -0.9988
vn -0.9988 0.0499 -0.0000
vn 0.0499 -0.9988 -0.0000
vn 0.0499 -0.0000 0.9988
vn 0.0499 0.9988 -0.0000
vn 1.0000 -0.0000 -0.0000
vn 0.9988 -0.0000 0.0499
vn -0.0000 -0.0000 -1.0000
vn -0.0000 0.9988 0.0499
vn -0.0000 -0.9988 0.0499
vn -0.0000 -0.0000 1.0000
vn -0.9988 -0.0000 0.0499
vn -0.0000 -1.0000 -0.0000
vn -0.0000 1.0000 -0.0000
vn -0.0000 0.0499 0.9988
vn 0.9988 0.0499 -0.0000
vn -0.0000 0.0499 -0.9988
vn -1.0000 -0.0000 -0.0000
vt 0.114221 0.031000
vt 0.179909 0.031000
vt 0.081377 0.739333
vt 0.147065 0.031000
vt 0.114221 0.656000
vt 0.081377 0.656000
vt 0.311911 0.000000
vt 0.441550 0.000000
vt 0.409140 0.000000
vt 0.657406 0.000000
vt 0.592467 0.000000
vt 0.376730 0.000000
vt 0.048533 0.656000
vt 0.147065 0.031000
vt 0.048533 0.739333
vt 0.048533 0.656000
vt 0.081377 0.656000
vt 0.409140 0.625000
vt 0.081377 0.031000
vt 0.344321 0.000000
vt 0.048533 0.031000
vt 0.344321 0.000000
vt 0.592467 0.000000
vt 0.147065 0.656000
vt 0.376730 0.625000
vt 0.689875 0.000000
vt 0.559997 0.000000
vt 0.657406 0.000000
vt 0.147065 0.656000
vt 0.114221 0.031000
vt 0.179909 0.656000
vt 0.114221 0.656000
vt 0.624936 0.000000
vt 0.376730 0.000000
vt 0.344321 0.625000
vt 0.344321 0.708333
vt 0.409140 0.000000
vt 0.344321 0.625000
vt 0.376730 0.625000
vt 0.311911 0.708333
vt 0.409140 0.625000
vt 0.311911 0.625000
vt 0.441550 0.625000
vt 0.657406 0.708333
vt 0.592467 0.625000
vt 0.657406 0.625000
vt 0.624936 0.708333
vt 0.689875 0.625000
vt 0.592467 0.625000
vt 0.559997 0.625000
vt 0.657406 0.625000
vt 0.624936 0.625000
vt 0.114221 0.656000
vt 0.114221 0.739333
vt 0.081377 0.656000
vt 0.081377 0.739333
vt 0.657406 0.708333
vt 0.689875 0.708333
vt 0.657406 0.625000
vt 0.689875 0.625000
vt 0.376730 0.625000
vt 0.376730 0.708333
vt 0.344321 0.625000
vt 0.344321 0.708333
s 0
f 11/32/1 2/4/1 10/29/1
f 4/11/2 18/50/2 9/27/2
f 10/30/3 6/17/3 7/19/3
f 7/19/4 5/13/4 8/21/4
f 8/24/5 1/2/5 11/31/5
f 2/6/6 5/15/6 6/16/6
f 8/25/7 13/37/7 7/18/7
f 31/64/8 28/61/8 29/62/8
f 4/12/9 12/35/9 8/22/9
f 7/20/10 15/42/10 3/7/10
f 13/38/11 14/40/11 15/42/11
f 3/8/12 14/41/12 4/9/12
f 26/59/13 25/58/13 24/57/13
f 17/47/14 18/51/14 16/44/14
f 8/26/15 16/46/15 4/10/15
f 11/33/16 17/49/16 8/23/16
f 9/28/17 19/52/17 11/33/17
f 23/56/18 20/53/18 21/54/18
f 11/32/1 1/1/1 2/4/1
f 4/11/2 16/45/2 18/50/2
f 10/30/3 2/5/3 6/17/3
f 7/19/4 6/17/4 5/13/4
f 8/24/5 5/14/5 1/2/5
f 2/6/6 1/3/6 5/15/6
f 8/25/7 12/34/7 13/37/7
f 31/64/8 30/63/8 28/61/8
f 4/12/9 14/39/9 12/35/9
f 7/20/10 13/38/10 15/42/10
f 13/38/11 12/36/11 14/40/11
f 3/8/12 15/43/12 14/41/12
f 26/59/13 27/60/13 25/58/13
f 17/47/14 19/52/14 18/51/14
f 8/26/15 17/48/15 16/46/15
f 11/33/16 19/52/16 17/49/16
f 9/28/17 18/51/17 19/52/17
f 23/56/18 22/55/18 20/53/18
`;

class AxesHelper extends Mesh {
    constructor({ gpu }) {
        const objData = parseObj(axesHelperGeometryData);
        const geometry = new Geometry({
            gpu,
            attributes: {
                position: {
                    data: objData.positions,
                    size: 3
                },
                uv: {
                    data: objData.uvs,
                    size: 2
                }
            },
            indices: objData.indices,
            drawCount: objData.indices.length
        });
        const material = new Material({
            gpu,
            vertexShader: `#version 300 es
            layout (location = 0) in vec3 aPosition;
            layout (location = 1) in vec2 aUv;
            uniform mat4 uWorldMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            out vec2 vUv;
            void main() {
                vUv = aUv;
                gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
            }
            `,
            fragmentShader: `#version 300 es
            precision mediump float;
            in vec2 vUv;
            out vec4 outColor;
            void main() {
                vec3 color = vec3(1., 0., 0.);
                if(vUv.x > .5) {
                    color = vec3(0., 1., 0.);
                } else if(vUv.x > .25) {
                    color = vec3(0., 0., 1.);
                }
                outColor = vec4(color, 1.);
            }
            `,
        });
        super({ geometry, material });
    }
}
﻿


class Light extends Actor {
    intensity;
    color;
    castShadow; // bool
    shadowCamera;
    shadowMap; // TODO: shadow camera に持たせたほうが良いような気もする
    
    constructor() {
        super(ActorTypes.Light);
    }

    setShadowSize() {
        throw "should implementation";
    }
}
﻿
class Vector4 {
    #elements;
    
    constructor(x, y, z, w) {
        this.set(x, y, z, w);
    }
    
    get x() {
        return this.#elements[0];
    }
    
    get y() {
        return this.#elements[1];
    }

    get z() {
        return this.#elements[2];
    }

    get w() {
        return this.#elements[3];
    }
    
    set(x, y, z, w) {
        this.#elements = new Float32Array([x, y, z, w]);
    }
}
﻿


// TODO: texStorage2Dを使う場合と出し分ける
class Texture extends GLObject {
    #texture;
    #img;
    #gpu;
    type;

    get glObject() {
        return this.#texture;
    }

    constructor({
        gpu,
        img,
        type = TextureTypes.RGBA,
        width, height,
        mipmap = false,
        minFilter = TextureFilterTypes.Nearest, magFilter = TextureFilterTypes.Nearest,
        wrapS = TextureWrapTypes.ClampToEdge, wrapT = TextureWrapTypes.ClampToEdge,
        flipY = false,
    }) {
        super();
        
        this.type = type;

        this.#gpu = gpu;
        const gl = this.#gpu.gl;

        this.#img = img || null;

        this.#texture = gl.createTexture();

        // bind texture object to gl
        gl.bindTexture(gl.TEXTURE_2D, this.#texture);

        // mipmap settings
        if (mipmap) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
      
        // filter
        switch(this.type) {
            case TextureTypes.RGBA:
                // min filter settings
                switch(minFilter) {
                    case TextureFilterTypes.Nearest:
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                        break;
                    case TextureFilterTypes.Linear:
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                        break;
                    default:
                        throw "invalid min filter type"
                }
                // mag filter settings
                switch(magFilter) {
                    case TextureFilterTypes.Nearest:
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                        break;
                    case TextureFilterTypes.Linear:
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                        break;
                    default:
                        throw "invalid mag filter type"
                }
                break;
               
            // TODO: depthの場合nearest必須？
            case TextureTypes.Depth:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                break;
            default:
                throw "invalid texture type";
        }
        
        // wrap settings
        switch(wrapS) {
            case TextureWrapTypes.ClampToEdge:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                break;
            case TextureWrapTypes.Repeat:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                break;
        }
        switch(wrapT) {
            case TextureWrapTypes.ClampToEdge:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                break;
            case TextureWrapTypes.Repeat:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                break;
        }

        if (!!this.#img || flipY) {
            // uv座標そのものは左下からなのでglもそれに合わせるためにflip
            // html image coord -> gl texture coord
            // (0, 0) - (1, 0)     (0, 1) - (1, 1)
            //   |         |         |         |
            // (0, 1) - (1, 1)     (0, 0) - (1, 0)
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        } else {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        }

        // bind texture data
        switch(this.type) {
            case TextureTypes.RGBA:
                if (width && height) {
                    // for render target
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.#img);
                } else {
                    // set img to texture
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.#img);
                }
                break;
            case TextureTypes.Depth:
                if (width && height) {
                    // for render target
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, this.#img);
                } else {
                    // set img to texture
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, gl.DEPTH_COMPONENT, gl.FLOAT, this.#img);
                }
                break;
            default:
                throw "invalid type";
        }
       
        // TODO: あった方がよい？
        // unbind img
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    
    setSize(width, height) {
        const gl = this.#gpu.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.#texture);

        // bind texture data
        switch(this.type) {
            case TextureTypes.RGBA:
                // for render target
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.#img);
                break;
            case TextureTypes.Depth:
                // for render target
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, this.#img);
                break;
            default:
                throw "invalid type";
        }
        
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.#img);
        
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}
﻿

class Framebuffer extends GLObject {
    #framebuffer;
    
    get glObject() {
        return this.#framebuffer;
    }
    
    constructor({ gpu }) {
        super();
        
        const gl = gpu.gl;
        
        this.#framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
    }
}
﻿


class Renderbuffer extends GLObject {
    #gpu;
    #type;
    #renderbuffer;

    get glObject() {
        return this.#renderbuffer;
    }

    constructor({ gpu, type, width, height }) {
        super();
       
        this.#gpu = gpu;
        this.#type = type;
        
        const gl = this.#gpu.gl;
        
        this.#renderbuffer = gl.createRenderbuffer();
        
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.#renderbuffer);
    
        switch(this.#type) {
            case RenderbufferTypes.Depth:
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
                break;
            default:
                throw "invalid render buffer type.";
        }
        
        // TODO: あったほうがよい？
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }
    
    setSize(width, height) {
        const gl = this.#gpu.gl;

        gl.bindRenderbuffer(gl.RENDERBUFFER, this.#renderbuffer);
        
        switch(this.#type) {
            case RenderbufferTypes.Depth:
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
                break;
        }
        
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }
}

class AbstractRenderTarget {
    isSwappable; // bool
    
    constructor({ isSwappable = false } = {}) {
        this.isSwappable = isSwappable;
    }

    get read() {
        throw "should implementation";
    }
    get write() {
        throw "should implementation";
    }
}
﻿





class RenderTarget extends AbstractRenderTarget {
    // #texture;
    name;
    #framebuffer;
    #depthRenderbuffer;
    width;
    height;
    #texture;

    get texture() {
        return this.#texture;
    }

    get framebuffer() {
        return this.#framebuffer;
    }
    
    get read() {
        return this;
    }
    
    get write() {
        return this;
    }
    
    constructor({
        gpu,
        name,
        type = RenderTargetTypes.RGBA,
        width = 1,
        height = 1,
        useDepthBuffer = false,
    }) {
        super();
        
        this.name = name;
        
        this.width = width;
        this.height = height;

        const gl = gpu.gl;

        this.#framebuffer = new Framebuffer({gpu});

        if (useDepthBuffer) {
            this.#depthRenderbuffer = new Renderbuffer({gpu, type: RenderbufferTypes.Depth, width, height});
        }

        // depth as render buffer
        if (this.#depthRenderbuffer) {
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.#depthRenderbuffer.glObject);
        }

        let textureType;
        switch (type) {
            case RenderTargetTypes.RGBA:
                textureType = TextureTypes.RGBA;
                break;
            case RenderTargetTypes.Depth:
                textureType = TextureTypes.Depth;
                break;
            default:
                throw "invalid texture type";
        }

        this.#texture = new Texture({
            gpu,
            width: this.width,
            height: this.height,
            mipmap: false,
            type: textureType
        });

        // set texture to render buffer
        switch (type) {
            case RenderTargetTypes.RGBA:
                // color as texture
                gl.framebufferTexture2D(
                    gl.FRAMEBUFFER,
                    gl.COLOR_ATTACHMENT0,
                    gl.TEXTURE_2D,
                    this.#texture.glObject,
                    0
                );
                break;
            case RenderTargetTypes.Depth:
                // depth as texture
                gl.framebufferTexture2D(
                    gl.FRAMEBUFFER,
                    gl.DEPTH_ATTACHMENT,
                    gl.TEXTURE_2D,
                    this.#texture.glObject,
                    0
                );
                break;
            default:
                throw "invalid type";
        }

        // unbind
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (this.#depthRenderbuffer) {
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.#texture.setSize(this.width, this.height);
        if (this.#depthRenderbuffer) {
            this.#depthRenderbuffer.setSize(width, height);
        }
    }
}
﻿









class Camera extends Actor {
    viewMatrix = Matrix4.identity();
    projectionMatrix = Matrix4.identity();
    #renderTarget;
    clearColor; // TODO: color class
    #postProcess;
    near;
    far;
    visibleFrustum = false;
    #visibleFrustumMesh;

    get cameraForward() {
        // 見た目のforwardと逆になる値で正しい
        // ex) (0, 0, 5) -> (0, 0, 0) をみている時、カメラ的には (0, 0, -1) が正しいが (0, 0, 1) が返ってくる
        // なぜなら、projection行列でzを反転させるため
        // pattern_1
        return this.transform.worldForward.negate();
        // pattern_2
        // return new Vector3(this.viewMatrix.m20, this.viewMatrix.m21, this.viewMatrix.m22).negate().normalize();
    }

    get postProcess() {
        return this.#postProcess;
    }

    get enabledPostProcess() {
        if (!this.postProcess) {
            return false;
        }
        return this.postProcess.enabled;
    }

    // get postProcessRenderTarget() {
    //     if(!this.postProcess) {
    //         return null;
    //     }
    //     return this.postProcess.renderTarget;
    // }

    get renderTarget() {
        return this.#renderTarget;
    }

    get writeRenderTarget() {
        if (this.#renderTarget) {
            // for double buffer
            return this.#renderTarget.isSwappable ? this.#renderTarget.write() : this.#renderTarget;
        }
        return null;
    }

    constructor({clearColor, postProcess} = {}) {
        super(ActorTypes.Camera);
        this.clearColor = clearColor || new Vector4(0, 0, 0, 1);
        this.#postProcess = postProcess;
    }

    setSize(width, height) {
        if (!this.#postProcess) {
            return;
        }
        if (this.#renderTarget) {
            this.#postProcess.setSize(this.#renderTarget.width, this.#renderTarget.height);
        } else {
            this.#postProcess.setSize(width, height);
        }
    }

    setPostProcess(postProcess) {
        this.#postProcess = postProcess;
    }

    setClearColor(clearColor) {
        this.clearColor = clearColor;
    }
    
    update({ gpu }) {
        
        super.update({ gpu });
        
        if(this.visibleFrustum && !this.#visibleFrustumMesh) {
            this.#visibleFrustumMesh = new Mesh({
                geometry: new Geometry({
                    gpu,
                    attributes: {
                        position: {
                            data: new Array(3 * 8),
                            size: 3,
                            usageType: AttributeUsageType.DynamicDraw
                        }
                    },
                    drawCount: 2 * 12,
                    indices: [
                        // near clip
                        0, 1,
                        1, 3,
                        3, 2,
                        2, 0,
                        // far clip
                        4, 5,
                        5, 7,
                        7, 6,
                        6, 4,
                        // bridge
                        0, 4,
                        1, 5,
                        2, 6,
                        3, 7
                    ]
                }),
                material: new Material({
                    gpu,
                    vertexShader: `#version 300 es
                    
                    layout (location = 0) in vec3 aPosition;
                   
                    uniform mat4 uWorldMatrix;
                    uniform mat4 uViewMatrix;
                    uniform mat4 uProjectionMatrix;
                    
                    void main() {
                        gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
                    }
                    `,
                    fragmentShader: `#version 300 es
                   
                    precision mediump float;
                    
                    out vec4 outColor;
                    
                    void main() {
                        outColor = vec4(0, 1., 0, 1.);
                    }
                    `,
                    primitiveType: PrimitiveTypes.Lines,
                    blendType: BlendTypes.Transparent,
                    depthWrite: false
                })
            });
            this.addChild(this.#visibleFrustumMesh);
        }
        
        if(this.#visibleFrustumMesh) {
            const frustumPositions = this.getFrustumLocalPositions();
            this.#visibleFrustumMesh.geometry.updateAttribute("position", [
                // near clip
                ...frustumPositions.nearLeftTop.elements,
                ...frustumPositions.nearLeftBottom.elements,
                ...frustumPositions.nearRightTop.elements,
                ...frustumPositions.nearRightBottom.elements,
                // far clip
                ...frustumPositions.farLeftTop.elements,
                ...frustumPositions.farLeftBottom.elements,
                ...frustumPositions.farRightTop.elements,
                ...frustumPositions.farRightBottom.elements,
            ]);
        }
    }

    updateTransform() {
        super.updateTransform();
        this.viewMatrix = this.transform.worldMatrix.clone().invert();
    }

    setRenderTarget(renderTarget) {
        this.#renderTarget = renderTarget;
    }

    #updateProjectionMatrix() {
        throw "should implementation";
    }
    
    getFrustumLocalPositions() {
        throw "should implementation";
    }

    getFrustumWorldPositions() {
        throw "should implementation";
    }
}
﻿



class OrthographicCamera extends Camera {
    
    constructor(left, right, bottom, top, near, far) {
        super();
        this.near = near;
        this.far = far;
        this.setSize(1, 1, left, right, bottom, top);
    }
    
    setSize(width, height, left, right, bottom, top) {
        super.setSize(width, height);
        if(left && right && top && bottom) {
            this.left = left;
            this.right = right;
            this.bottom = bottom;
            this.top = top;
        }
        this.updateProjectionMatrix();
    }
    
    updateProjectionMatrix() {
        this.projectionMatrix = Matrix4.getOrthographicMatrix(this.left, this.right, this.bottom, this.top, this.near, this.far);
    }
    
    updateTransform() {
        super.updateTransform();
    }
   
    getFrustumLocalPositions() {
        const localForward = Vector3.back();
        const localRight = Vector3.right();
        const localUp = Vector3.up();

        const halfWidth = (Math.abs(this.left) + Math.abs(this.right)) / 2;
        const halfHeight = (Math.abs(this.top) + Math.abs(this.right)) / 2;

        const nearClipCenter = localForward.clone().scale(this.near);
        const farClipCenter = localForward.clone().scale(this.far);
        
        const clipRightOffset = localRight.clone().scale(halfWidth);
        const clipUpOffset = localUp.clone().scale(halfHeight);
        
        const nearLeftTop = Vector3.addVectors(
            nearClipCenter,
            clipRightOffset.clone().negate(),
            clipUpOffset
        );
        const nearRightTop = Vector3.addVectors(
            nearClipCenter,
            clipRightOffset,
            clipUpOffset
        );
        const nearLeftBottom = Vector3.addVectors(
            nearClipCenter,
            clipRightOffset.clone().negate(),
            clipUpOffset.clone().negate()
        );
        const nearRightBottom = Vector3.addVectors(
            nearClipCenter,
            clipRightOffset,
            clipUpOffset.clone().negate()
        );
        
        const farLeftTop = Vector3.addVectors(
            farClipCenter,
            clipRightOffset.clone().negate(),
            clipUpOffset
        );
        const farRightTop = Vector3.addVectors(
            farClipCenter,
            clipRightOffset,
            clipUpOffset
        );
        const farLeftBottom = Vector3.addVectors(
            farClipCenter,
            clipRightOffset.clone().negate(),
            clipUpOffset.clone().negate()
        );
        const farRightBottom = Vector3.addVectors(
            farClipCenter,
            clipRightOffset,
            clipUpOffset.clone().negate()
        );
        
        return {
            nearLeftTop,
            nearRightTop,
            nearLeftBottom,
            nearRightBottom,
            farLeftTop,
            farRightTop,
            farLeftBottom,
            farRightBottom,
        }
    }
    
    getFrustumWorldPositions() {
        const worldPositions = {};
        const localPositions = this.getFrustumLocalPositions();
        Object.keys(localPositions).forEach(key => {
            const wp = localPositions[key].multiplyMatrix4(this.transform.worldMatrix);
            worldPositions[key] = wp;
        });
        return worldPositions;
    }
}
﻿



class PerspectiveCamera extends Camera {
    fov;
    aspect;
    
    constructor(fov, aspect, near, far) {
        super();
        this.fov = fov;
        this.near = near;
        this.far = far;
        this.setSize(aspect);
    }
    
    setSize(width, height) {
        super.setSize(width, height);
        this.aspect = width / height;
        this.#updateProjectionMatrix();
    }
    
    #updateProjectionMatrix() {
        this.projectionMatrix = Matrix4.getPerspectiveMatrix(this.fov * Math.PI / 180, this.aspect, this.near, this.far);
    }

    // afterUpdatedTransform() {
    //     super.afterUpdatedTransform();
    // }
}





class DoubleBuffer extends AbstractRenderTarget {
    #renderTargets = [];
    
    currentReadIndex = 0;
    
    constructor(renderTargetOptions) {
        super({ isSwappable: true });
        for(let i = 0; i < 2; i++) {
            this.#renderTargets.push(new RenderTarget(
                { ...renderTargetOptions, ...({ name: `double-buffer_${i}` }) }
            ));
        }
    }
    
    setSize(width, height) {
        this.#renderTargets.forEach(renderTarget => renderTarget.setSize(width, height));
    }

    get read() {
        return this.#renderTargets[this.currentReadIndex];
    }
    
    get write() {
        return this.#renderTargets[this.currentReadIndex ^ 1];
    }

    swap() {
        this.currentReadIndex = (this.currentReadIndex + 1) % 2;
    }
}
﻿







class DirectionalLight extends Light {
    constructor() {
        super();

        this.shadowCamera = new OrthographicCamera(-1, 1, -1, 1, 0.1, 1);
        // ライトが向いている方向と逆を向かせたいので(projectionの過程でz軸が逆になるから)
        this.shadowCamera.transform.setRotationY(180);
        this.addChild(this.shadowCamera);
    }
}
// 
// 

const skinningVertexAttributes = (beginIndex) => [
`layout(location = ${beginIndex + 0}) in vec4 aBoneIndices;`,
`layout(location = ${beginIndex + 1}) in vec4 aBoneWeights;`,
];

const calcSkinningMatrixFunc = () => `
mat4 calcSkinningMatrix(mat4 jointMat0, mat4 jointMat1, mat4 jointMat2, mat4 jointMat3, vec4 boneWeights) {
    mat4 skinMatrix =
         jointMat0 * aBoneWeights.x +
         jointMat1 * aBoneWeights.y +
         jointMat2 * aBoneWeights.z +
         jointMat3 * aBoneWeights.w;
    return skinMatrix;
}
`;

// const skinningVertex = () => `
//     mat4 skinMatrix =
//          uJointMatrices[int(aBoneIndices[0])] * aBoneWeights.x +
//          uJointMatrices[int(aBoneIndices[1])] * aBoneWeights.y +
//          uJointMatrices[int(aBoneIndices[2])] * aBoneWeights.z +
//          uJointMatrices[int(aBoneIndices[3])] * aBoneWeights.w;
//     
//     vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;
//     vTangent = mat3(uNormalMatrix) * mat3(skinMatrix) * aTangent;
//     vBinormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aBinormal;
//     
//     vec4 localPosition = skinMatrix * vec4(aPosition, 1.);
// 
//     // gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * localPosition;
// `;

const skinningVertexUniforms = (jointNum) => `
uniform mat4[${jointNum}] uJointMatrices;
`;


const transformVertexUniforms = () => `
uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;
`;



const shadowMapVertexVaryings = () => `
out vec4 vShadowMapProjectionUv;
`;

const shadowMapFragmentVaryings = () => `
in vec4 vShadowMapProjectionUv;
`;

const shadowMapVertex = () => `
    vShadowMapProjectionUv = uShadowMapProjectionMatrix * uWorldMatrix * localPosition;
`;

const shadowMapVertexUniforms = () => `
uniform mat4 uShadowMapProjectionMatrix;
`;

const shadowMapFragmentUniforms = () => `
uniform sampler2D uShadowMap;
uniform float uShadowBias;
`;

const shadowMapFragmentFunc = () => `
vec4 applyShadow(vec4 surfaceColor, sampler2D shadowMap, vec4 shadowMapUv, float shadowBias, vec4 shadowColor, float shadowBlendRate) {
    vec3 projectionUv = shadowMapUv.xyz / shadowMapUv.w;
    vec4 projectionShadowColor = texture(shadowMap, projectionUv.xy);
    float sceneDepth = projectionShadowColor.r;
    float depthFromLight = projectionUv.z;
    float shadowOccluded = clamp(step(0., depthFromLight - sceneDepth - shadowBias), 0., 1.);
    float shadowAreaRect =
        step(0., projectionUv.x) * (1. - step(1., projectionUv.x)) *
        step(0., projectionUv.y) * (1. - step(1., projectionUv.y)) *
        step(0., projectionUv.z) * (1. - step(1., projectionUv.z));
    float shadowRate = shadowOccluded * shadowAreaRect;
    
    vec4 resultColor = vec4(1.);
    resultColor.xyz = mix(
       surfaceColor.xyz,
       mix(surfaceColor.xyz, shadowColor.xyz, shadowBlendRate),
       shadowRate
    );
    resultColor.a = surfaceColor.a;
    
    return resultColor;
} 
`;

const alphaTestFragmentFunc = () => `
void checkAlphaTest(float value, float threshold) {
    if(value < threshold) {
        discard;
    }
}
`;

const alphaTestFragmentUniforms = () => `
uniform float uAlphaTestThreshold;
`;

const normalMapVertexAttributes = (beginIndex) => [
`layout(location = ${beginIndex + 0}) in vec3 aTangent;`,
`layout(location = ${beginIndex + 1}) in vec3 aBinormal;`
];

const normalMapVertexVaryings = () => `
out vec3 vTangent;
out vec3 vBinormal;
`;

const normalMapFragmentVarying = () => `
in vec3 vTangent;
in vec3 vBinormal;
`;

const normalMapFragmentUniforms = () => `
uniform sampler2D uNormalMap;
uniform float uNormalStrength;
`;

const normalMapFragmentFunc = () => `
vec3 calcNormal(vec3 normal, vec3 tangent, vec3 binormal, sampler2D normalMap, vec2 uv) {
    vec3 n = normalize(normal);
    vec3 t = normalize(tangent);
    vec3 b = normalize(binormal);
    mat3 tbn = mat3(t, b, n);
    vec3 nt = texture(normalMap, uv).xyz;
    nt = nt * 2. - 1.;

    // 2: normal from normal map
    vec3 resultNormal = normalize(tbn * nt);
    // blend mesh normal ~ normal map
    // vec3 normal = mix(normal, normalize(tbn * nt));
    // vec3 normal = mix(normal, normalize(tbn * nt), 1.);

    return resultNormal;
}
`

const directionalLightFragmentUniforms = () => `
struct DirectionalLight {
    vec3 direction;
    float intensity;
    vec4 color;
};
uniform DirectionalLight uDirectionalLight;
`;

const phongSurfaceDirectionalLightFunc = () => `
vec4 calcDirectionalLight(Surface surface, DirectionalLight directionalLight, Camera camera) {
    vec3 N = normalize(surface.worldNormal);
    vec3 L = normalize(directionalLight.direction);
    float diffuseRate = clamp(dot(N, L), 0., 1.);
    vec3 diffuseColor = surface.diffuseColor.xyz * diffuseRate * uDirectionalLight.intensity * uDirectionalLight.color.xyz;

    vec3 P = surface.worldPosition;
    vec3 E = camera.worldPosition;
    vec3 PtoL = L; // for directional light
    vec3 PtoE = normalize(E - P);
    vec3 H = normalize(PtoL + PtoE);
    float specularPower = 16.;
    float specularRate = clamp(dot(H, N), 0., 1.);
    specularRate = pow(specularRate, specularPower);
    vec3 specularColor = specularRate * directionalLight.intensity * directionalLight.color.xyz;

    vec3 ambientColor = vec3(.1);

    vec4 resultColor = vec4(
        diffuseColor + specularColor + ambientColor,
        surface.diffuseColor.a
    );
    
    return resultColor;
}
`;

const phongLightingFunc = () => `
vec4 calcPhongLighting() {
    // vec3 N = normalize(vNormal);
    vec3 N = normalize(worldNormal);
    // vec3 N = mix(vNormal, worldNormal * uNormalStrength, uNormalStrength);
    vec3 L = normalize(uDirectionalLight.direction);
    float diffuseRate = clamp(dot(N, L), 0., 1.);
    // vec3 diffuseColor = textureColor.xyz * diffuseRate * uDirectionalLight.intensity * uDirectionalLight.color.xyz;
    vec3 diffuseColor = diffuseMapColor.xyz * diffuseRate * uDirectionalLight.intensity * uDirectionalLight.color.xyz;

    vec3 P = vWorldPosition;
    vec3 E = uViewPosition;
    vec3 PtoL = L; // for directional light
    vec3 PtoE = normalize(E - P);
    vec3 H = normalize(PtoL + PtoE);
    float specularPower = 16.;
    float specularRate = clamp(dot(H, N), 0., 1.);
    specularRate = pow(specularRate, specularPower);
    vec3 specularColor = specularRate * uDirectionalLight.intensity * uDirectionalLight.color.xyz;

    vec3 ambientColor = vec3(.1);

    vec4 surfaceColor = vec4(diffuseColor + specularColor + ambientColor, 1.);
    
    return surfaceColor;
}
`;





// TODO: out varying を centroid できるようにしたい

const generateVertexShader = ({
    isSkinning,
    jointNum,
    receiveShadow,
    useNormalMap,
    localPositionProcess,
    insertUniforms,
} = {}) => {
    
    const attributes = [
        `layout(location = 0) in vec3 aPosition;`,
        `layout(location = 1) in vec2 aUv;`,
        `layout(location = 2) in vec3 aNormal;`,
    ];
    if(isSkinning) {
        attributes.push(...skinningVertexAttributes(attributes.length));
    }
    if(useNormalMap) {
        attributes.push(...normalMapVertexAttributes(attributes.length));
    }

    return `#version 300 es

${attributes.join("\n")}

${isSkinning ? calcSkinningMatrixFunc() : ""}

${transformVertexUniforms()}

out vec2 vUv;
out vec3 vWorldPosition;
out vec3 vNormal;
${useNormalMap ? normalMapVertexVaryings() : ""}
${receiveShadow ? shadowMapVertexVaryings() : "" }

${receiveShadow ? shadowMapVertexUniforms() : ""}
${isSkinning ? skinningVertexUniforms(jointNum) : ""}
${insertUniforms || ""}

void main() {
    ${isSkinning ? `
    mat4 skinMatrix = calcSkinningMatrix(
        uJointMatrices[int(aBoneIndices[0])],
        uJointMatrices[int(aBoneIndices[1])],
        uJointMatrices[int(aBoneIndices[2])],
        uJointMatrices[int(aBoneIndices[3])],
        aBoneWeights
    );
    ` : ""}
    
    vec4 localPosition = vec4(aPosition, 1.);;
    ${localPositionProcess || ""}
    
    ${isSkinning
        ? `
    localPosition = skinMatrix * localPosition;`
        : ""
    }
    
    ${(() => {
        if(isSkinning) {
            return useNormalMap
                ? `
    vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;
    vTangent = mat3(uNormalMatrix) * mat3(skinMatrix) * aTangent;
    vBinormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aBinormal;
`
                : `
    vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;
`;
        } else {
            return useNormalMap
                ? `
    vNormal = mat3(uNormalMatrix) * aNormal;
    vTangent = mat3(uNormalMatrix) * aTangent;
    vBinormal = mat3(uNormalMatrix) * aBinormal;
`
                : `
    vNormal = mat3(uNormalMatrix) * aNormal;
`;
        }
    })()}

    ${receiveShadow ? shadowMapVertex() : ""}
  
    // assign common varyings 
    vUv = aUv; 
    vec4 worldPosition = uWorldMatrix * localPosition;
  
    vWorldPosition = worldPosition.xyz;
   
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * localPosition;
}
`;
}

const generateDepthVertexShader = ({ isSkinning, useNormalMap, jointNum } = {}) => {

    const attributes = [
        `layout(location = 0) in vec3 aPosition;`,
        `layout(location = 1) in vec2 aUv;`,
        `layout(location = 2) in vec3 aNormal;`,
    ];
    if (isSkinning) {
        attributes.push(...skinningVertexAttributes(attributes.length));
    }
    if(useNormalMap) {
        attributes.push(...normalMapVertexAttributes(attributes.length));
    }

    return `#version 300 es

${attributes.join("\n")}

${isSkinning ? calcSkinningMatrixFunc() : ""}

${transformVertexUniforms()}
${isSkinning ? skinningVertexUniforms(jointNum) : ""}

void main() {
    ${isSkinning ? `
    mat4 skinMatrix = calcSkinningMatrix(
        uJointMatrices[int(aBoneIndices[0])],
        uJointMatrices[int(aBoneIndices[1])],
        uJointMatrices[int(aBoneIndices[2])],
        uJointMatrices[int(aBoneIndices[3])],
        aBoneWeights
    );
    ` : ""}

    ${isSkinning
        ? `
    vec4 localPosition = skinMatrix * vec4(aPosition, 1.);`
        : `
    vec4 localPosition = vec4(aPosition, 1.);`
    }
    
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * localPosition;
}
`;
}

﻿








class SkinnedMesh extends Mesh {
    bones;
    boneCount = 0;
   
    // positions = [];
    // boneIndices = [];
    // boneWeights = [];
    
    boneOffsetMatrices;
    
    #boneIndicesForLines = [];
    #boneOrderedIndex = [];
    
    constructor({bones, gpu, ...options}) {
        super({
            ...options,
            actorType: ActorTypes.SkinnedMesh,
            autoGenerateDepthMaterial: false,
        });

        this.bones = bones;

        this.bones.traverse((bone) => {
            this.boneCount++;
            this.#boneOrderedIndex[bone.index] = bone;
        });
        
        // for debug
        // console.log(this.positions, this.boneIndices, this.boneWeights)
    }
    
    start(options) {
        super.start(options);
       
        const { gpu } = options;

        // if(!options.depthMaterial) {
            this.depthMaterial = new Material({
                gpu,
                vertexShader: generateDepthVertexShader({
                    isSkinning: true,
                    jointNum: this.boneCount,
                }),
                fragmentShader: generateDepthFragmentShader({
                    // alphaTest: !!this.material.alphaTest
                    alphaTest: !!this.mainMaterial.alphaTest
                }),
                uniforms: {
                    uJointMatrices: {
                        type: UniformTypes.Matrix4Array,
                        value: null
                    },
                },
                alphaTest: this.mainMaterial.alphaTest
            });
        // }

        this.bones.calcBoneOffsetMatrix();
        // this.bones.calcJointMatrix();

        this.boneOffsetMatrices = this.getBoneOffsetMatrices();
        
        // this.material.uniforms.uBoneOffsetMatrices.value = this.boneOffsetMatrices;
        // this.material.uniforms.uJointMatrices.value = this.getBoneJointMatrices();
        
        const checkChildNum = (bone) => {
            if(bone.hasChild) {
                bone.children.forEach(childBone => {
                    this.#boneIndicesForLines.push(bone.index, childBone.index);
                    checkChildNum(childBone);
                });
            }
        }
        checkChildNum(this.bones);
        
        this.boneLines = new Mesh({
            gpu,
            geometry: new Geometry({
                gpu,
                attributes: {
                    position: {
                        // data: new Array(this.#boneIndicesForLines.length * 3),
                        data: new Array(this.#boneOrderedIndex.length * 3),
                        size: 3,
                        usage: AttributeUsageType.DynamicDraw
                    }
                },
                indices: this.#boneIndicesForLines,
                drawCount: this.#boneIndicesForLines.length
            }),
            material: new Material({
                gpu,
                vertexShader: `#version 300 es
                
                layout (location = 0) in vec3 aPosition;
                
                uniform mat4 uWorldMatrix;
                uniform mat4 uViewMatrix;
                uniform mat4 uProjectionMatrix;
                
                void main() {
                    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
                }
                `,
                fragmentShader: `#version 300 es
                
                precision mediump float;
                
                out vec4 outColor;
                
                void main() {
                    outColor = vec4(0, 1., 0, 1.);
                }
                `,
                primitiveType: PrimitiveTypes.Lines,
                blendType: BlendTypes.Transparent,
                depthWrite: false,
                depthTest: false
            })
        });

        this.bonePoints = new Mesh({
            gpu,
            geometry: new Geometry({
                gpu,
                attributes: {
                    position: {
                        data: new Array(this.#boneOrderedIndex.length * 3),
                        size: 3,
                        usage: AttributeUsageType.DynamicDraw
                    }
                },
                drawCount: this.#boneOrderedIndex.length
            }),
            material: new Material({
                gpu,
                vertexShader: `#version 300 es
               
                layout (location = 0) in vec3 aPosition;
                
                uniform mat4 uWorldMatrix;
                uniform mat4 uViewMatrix;
                uniform mat4 uProjectionMatrix;
                
                void main() {
                    // gl_Point = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
                    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
                    gl_PointSize = 6.;
                }
                `,
                fragmentShader: `#version 300 es
                
                precision mediump float;
                
                out vec4 outColor;
                
                void main() {
                    outColor = vec4(1, 0., 0, 1.);
                }
                `,
                primitiveType: PrimitiveTypes.Points,
                blendType: BlendTypes.Transparent,
                depthWrite: false,
                depthTest: false
            })
        });
        
        this.addChild(this.boneLines);
        this.addChild(this.bonePoints)
    }
    
    update(options) {
        super.update(options);
        
        this.bones.calcJointMatrix();
        
        // NOTE: test update skinning by cpu
        const boneOffsetMatrices = this.boneOffsetMatrices;
        const boneJointMatrices = this.getBoneJointMatrices();

        const boneLinePositions = this.#boneOrderedIndex.map(bone => [...bone.jointMatrix.position.elements]);
       
        this.boneLines.geometry.updateAttribute("position", boneLinePositions.flat())
        this.bonePoints.geometry.updateAttribute("position", boneLinePositions.flat())
       
       // console.log("-------") 
        const jointMatrices = boneOffsetMatrices.map((boneOffsetMatrix, i) => Matrix4.multiplyMatrices(boneJointMatrices[i], boneOffsetMatrix));

        this.materials.forEach(material => {
            material.uniforms.uJointMatrices.value = jointMatrices;
        });
        if(this.depthMaterial) {
            this.depthMaterial.uniforms.uJointMatrices.value = jointMatrices;
        }
    }

    getBoneOffsetMatrices() {
        const matrices = [];
        this.bones.traverse((bone) => {
            const m = bone.boneOffsetMatrix.clone();
            matrices.push(m);
        });
        return matrices;
    }
    
    getBoneJointMatrices() {
        const matrices = [];
        this.bones.traverse((bone) => {
            const m = bone.jointMatrix.clone();
            matrices.push(m);
        });
        return matrices;        
    }
    
}
﻿
async function loadImg(src) {
    // TODO: reject pattern
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            resolve(img);
        };
        img.src = src;
    });
}
﻿


class CubeMap extends GLObject {
    #texture;
    
    get glObject() {
        return this.#texture;
    }

    constructor({gpu, images = {
        [CubeMapAxis.PositiveX]: null,
        [CubeMapAxis.NegativeX]: null,
        [CubeMapAxis.PositiveY]: null,
        [CubeMapAxis.NegativeY]: null,
        [CubeMapAxis.PositiveZ]: null,
        [CubeMapAxis.NegativeZ]: null,
    }}) {
        super();
        
        const gl = gpu.gl;
        
        this.#texture = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.#texture);
       
        // cubemapの場合は html img でも falseで良い。というのがよくわかってない。そういうもの？
        // ただ、たしかに反転すると上下が反転して見た目がおかしくなる
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        Object.keys(images).forEach((key) => {
            let axis = null;
            switch(key) {
                case CubeMapAxis.PositiveX:
                    axis = gl.TEXTURE_CUBE_MAP_POSITIVE_X;
                    break;
                case CubeMapAxis.NegativeX:
                    axis = gl.TEXTURE_CUBE_MAP_NEGATIVE_X;
                    break;
                case CubeMapAxis.PositiveY:
                    axis = gl.TEXTURE_CUBE_MAP_POSITIVE_Y;
                    break;
                case CubeMapAxis.NegativeY:
                    axis = gl.TEXTURE_CUBE_MAP_NEGATIVE_Y;
                    break;
                case CubeMapAxis.PositiveZ:
                    axis = gl.TEXTURE_CUBE_MAP_POSITIVE_Z;
                    break;
                case CubeMapAxis.NegativeZ:
                    axis = gl.TEXTURE_CUBE_MAP_NEGATIVE_Z;
                    break;
                default:
                    throw "invalid axis"
            }
            gl.texImage2D(axis, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[key]);
        });
        
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
 
        // TODO: unbindしない方がよい？
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
}
﻿


class BoxGeometry extends Geometry {
    constructor({ gpu }) {
        const boxPosition_0 = [-0.5, 0.5, 0.5];
        const boxPosition_1 = [-0.5, -0.5, 0.5];
        const boxPosition_2 = [0.5, 0.5, 0.5];
        const boxPosition_3 = [0.5, -0.5, 0.5];
        const boxPosition_4 = [0.5, 0.5, -0.5];
        const boxPosition_5 = [0.5, -0.5, -0.5];
        const boxPosition_6 = [-0.5, 0.5, -0.5];
        const boxPosition_7 = [-0.5, -0.5, -0.5];

        const normals = [
            [0, 0, 1], // front
            [1, 0, 0], // right
            [0, 0, -1], // back
            [-1, 0, 0], // left
            [0, 1, 0], // top
            [0, -1, 0], // bottom
        ];
        
        super({
            gpu,
            attributes: {
                // -----------------------------
                //    
                //   6 ---- 4
                //  /|     /|
                // 0 ---- 2 |
                // | 7 -- | 5
                // |/     |/
                // 1 ---- 3
                // -----------------------------
                position: {
                    data: [
                        // front
                        ...boxPosition_0, ...boxPosition_1, ...boxPosition_2, ...boxPosition_3,
                        // right
                        ...boxPosition_2, ...boxPosition_3, ...boxPosition_4, ...boxPosition_5,
                        // back
                        ...boxPosition_4, ...boxPosition_5, ...boxPosition_6, ...boxPosition_7,
                        // left
                        ...boxPosition_6, ...boxPosition_7, ...boxPosition_0, ...boxPosition_1,
                        // top
                        ...boxPosition_6, ...boxPosition_0, ...boxPosition_4, ...boxPosition_2,
                        // bottom
                        ...boxPosition_1, ...boxPosition_7, ...boxPosition_3, ...boxPosition_5,
                    ],
                    size: 3,
                },
                uv: {
                    data: (new Array(6)).fill(0).map(() => ([
                        0, 1,
                        0, 0,
                        1, 1,
                        1, 0,
                    ])).flat(),
                    size: 2
                },
                normal: {
                    data: normals.map((normal) => (new Array(4).fill(0).map(() => normal))).flat(2),
                    size: 3
                }
            },
            indices: Array.from(Array(6).keys()).map(i => ([
                i * 4 + 0, i * 4 + 1, i * 4 + 2,
                i * 4 + 2, i * 4 + 1, i * 4 + 3,
            ])).flat(),
            drawCount: 6 * 6 // indices count
        });
    }
}

﻿



class PlaneGeometry extends Geometry {
    constructor({
        gpu,
        calculateTangent = false,
        calculateBinormal = false 
    }) {

        const normals = [
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
        ];
        
        const { tangents, binormals } = Geometry.createTangentsAndBinormals(normals);

        super({
            gpu,
            // -----------------------------
            // 0 ---- 2
            // |    / |
            // |   /  |
            // |  /   |
            // | /    |
            // 1 ---- 3
            // -----------------------------
            attributes: {
                position: {
                    data: [
                        -1, 1, 0,
                        -1, -1, 0,
                        1, 1, 0,
                        1, -1, 0,
                    ],
                    size: 3
                },
                uv: {
                    data: [
                        0, 1,
                        0, 0,
                        1, 1,
                        1, 0,
                    ],
                    size: 2
                },
                normal: {
                    data: normals,
                    size: 3
                },
                ...(calculateTangent ?
                    {
                        tangent: {
                            data: tangents,
                            size: 3
                        },
                    } : {}
                ),
                ...(calculateBinormal ?
                    {
                        binormal: {
                            data: binormals,
                            size: 3
                        },
                    } : {}
                ),
            },
            indices: [0, 1, 2, 2, 1, 3],
            drawCount: 6
        });
    }
}













// 法線が内側を向いた単位立方体
const skyboxGeometryObjText = `
# Blender 3.3.1
# www.blender.org
mtllib skybox-cube.mtl
v -1.000000 -1.000000 1.000000
v -1.000000 1.000000 1.000000
v -1.000000 -1.000000 -1.000000
v -1.000000 1.000000 -1.000000
v 1.000000 -1.000000 1.000000
v 1.000000 1.000000 1.000000
v 1.000000 -1.000000 -1.000000
v 1.000000 1.000000 -1.000000
vn 0.5774 0.5774 0.5774
vn 0.5774 -0.5774 -0.5774
vn 0.5774 0.5774 -0.5774
vn -0.5774 0.5774 0.5774
vn 0.5774 -0.5774 0.5774
vn -0.5774 0.5774 -0.5774
vn -0.5774 -0.5774 0.5774
vn -0.5774 -0.5774 -0.5774
vt 0.375000 0.000000
vt 0.375000 1.000000
vt 0.125000 0.750000
vt 0.625000 0.000000
vt 0.625000 1.000000
vt 0.875000 0.750000
vt 0.125000 0.500000
vt 0.375000 0.250000
vt 0.625000 0.250000
vt 0.875000 0.500000
vt 0.375000 0.750000
vt 0.625000 0.750000
vt 0.375000 0.500000
vt 0.625000 0.500000
s 1
f 3/8/1 2/4/2 1/1/3
f 7/13/4 4/9/5 3/8/1
f 5/11/6 8/14/7 7/13/4
f 1/2/3 6/12/8 5/11/6
f 1/3/3 7/13/4 3/7/1
f 6/12/8 4/10/5 8/14/7
f 3/8/1 4/9/5 2/4/2
f 7/13/4 8/14/7 4/9/5
f 5/11/6 6/12/8 8/14/7
f 1/2/3 2/5/2 6/12/8
f 1/3/3 5/11/6 7/13/4
f 6/12/8 2/6/2 4/10/5
`;

const skyboxVertexShader = `#version 300 es

precision mediump float;

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aUv;
layout (location = 2) in vec3 aNormal;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

out vec2 vUv;
out vec3 vNormal;
out vec3 vWorldPosition;

void main() {
    vUv = aUv;
    vNormal = (uNormalMatrix * vec4(aNormal, 1)).xyz;
    vec4 worldPosition = uWorldMatrix * vec4(aPosition, 1);
    vWorldPosition = worldPosition.xyz;
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

const skyboxFragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

uniform samplerCube uCubeTexture;
uniform vec3 uViewPosition;
uniform mat4 uViewDirectionProjectionInverse;

out vec4 outColor;

mat2 rotate(float r) {
    float c = cos(r);
    float s = sin(r);
    return mat2(c, s, -s, c);
}

void main() {
    // pattern_1: inverse normal
    vec3 N = normalize(vNormal);
    vec3 reflectDir = -N;

    // pattern_2: world position dir
    // skyboxの中心 = カメラの中心なので、こちらでもよい
    // vec3 reflectDir = normalize(vWorldPosition - uViewPosition);

    reflectDir.x *= -1.;
    reflectDir.xz *= rotate(3.14);
    vec4 textureColor = texture(uCubeTexture, reflectDir);
    outColor = textureColor;
}
`;

class Skybox extends Mesh {
    constructor({gpu, cubeMap}) {
        const skyboxObjData = parseObj(skyboxGeometryObjText);
        const geometry = new Geometry({
            gpu,
            attributes: {
                position: {
                    data: skyboxObjData.positions,
                    size: 3
                },
                uv: {
                    data: skyboxObjData.uvs,
                    size: 2,
                },
                normal: {
                    data: skyboxObjData.normals,
                    size: 3
                },
            },
            indices: skyboxObjData.indices,
            drawCount: skyboxObjData.indices.length
        });
        // const geometry = new PlaneGeometry({ gpu });
        
        const material = new Material({
            gpu,
            vertexShader: skyboxVertexShader,
            fragmentShader: skyboxFragmentShader,
            primitiveType: PrimitiveTypes.Triangles,
            depthTest: false,
            depthWrite: false,
            uniforms: {
                uCubeTexture: {
                    type: UniformTypes.CubeMap,
                    value: cubeMap
                },
                uViewDirectionProjectionInverse: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity(),
                },
            }
        });
        
        super({ geometry, material, actorType: ActorTypes.Skybox });
    }
   
    // TODO: renderer側で2回走らないようにする
    updateTransform(camera) {
        if(camera) {
            this.transform.setTranslation(camera.transform.position);
            // 1.733 ... 単位立方体の対角線の長さ sqrt(1 + 1 + 1)
            this.transform.setScaling(Vector3.fill(camera.far / 1.733));
        }
        super.updateTransform();
    }
}
﻿
class TimeSkipper {
    targetFPS;
    #callback;
    #lastTime;
 
    constructor(targetFPS, callback) {
        this.targetFPS = targetFPS;
        this.#callback = callback;
    }

    // time [sec]
    start(time) {
        this.#lastTime = time;
    }
   
    // time [sec]
    exec(time) {
        const interval = 1 / this.targetFPS;
        if((time - interval) >= this.#lastTime) {
            const elapsedTime = time - this.#lastTime;
            const n = Math.floor(elapsedTime / interval);
            const deltaTime = interval * n;
            this.#lastTime += deltaTime;
            this.#callback(this.#lastTime, deltaTime);
        }
    }
}

class TimeAccumulator {
    targetFPS;
    #callback;
    #lastTime;
    maxChaseCount;

    constructor(targetFPS, callback, maxChaseCount = 60) {
        this.targetFPS = targetFPS;
        this.#callback = callback;
        this.maxChaseCount = maxChaseCount;
    }

    // time [sec]
    start(time) {
        this.#lastTime = time;
    }

    // time [sec]
    exec(time) {
        const interval = 1 / this.targetFPS;
        
        if((time - interval) >= this.#lastTime) {
            const elapsedTime = time - this.#lastTime;
            const n = Math.floor(elapsedTime / interval);

            if(n > this.maxChaseCount) {
                console.warn("[TimeAccumulator.exec] jump frame");
                this.#lastTime += interval * n;
                this.#callback(this.#lastTime, interval);
                return;
            }

            const loopNum = Math.min(this.maxChaseCount, n);
            for(let i = 0; i < loopNum; i++) {
                // いらないはず
                // if((time - interval) < this.#lastTime) {
                //     break;
                // }
                this.#lastTime += interval;
                this.#callback(this.#lastTime, interval);
            }
        }
    }   
}
﻿



class Engine {
    #renderer;
    #fixedUpdateFrameTimer;
    #updateFrameTimer;
    // #renderFrameTimer;
    #onBeforeFixedUpdate;
    #onBeforeUpdate;
    #scene;
    #gpu;
    
    get renderer() {
        return this.#renderer;
    }
    
    set onBeforeUpdate(value) {
        this.#onBeforeUpdate = value;
    }
    
    constructor({ gpu, renderer, onBeforeFixedUpdate, onBeforeUpdate }) {
        this.#gpu = gpu;
        this.#renderer = renderer;

        // TODO: 外からfps変えられるようにしたい
        this.#fixedUpdateFrameTimer = new TimeAccumulator(60, this.fixedUpdate.bind(this));
        this.#updateFrameTimer = new TimeSkipper(60, this.update.bind(this));
        // this.#renderFrameTimer = new TimeSkipper(60, this.render.bind(this));

        this.#onBeforeFixedUpdate = onBeforeFixedUpdate;
        this.#onBeforeUpdate = onBeforeUpdate;
    }
    
    setScene(scene) {
        this.#scene = scene;
    }
    
    start() {
        const t = performance.now() / 1000;
        this.#fixedUpdateFrameTimer.start(t);
        this.#updateFrameTimer.start(t);
        // this.#renderFrameTimer.start(t);
    }
    
    setSize(width, height) {
        const w = width * this.renderer.pixelRatio;
        const h = height * this.renderer.pixelRatio;
        // this.#scene.traverse((actor) => actor.setSize(width, height));
        // this.#renderer.setSize(width, height);
        this.#scene.traverse((actor) => actor.setSize(w, h));
        this.#renderer.setSize(w, h);
    }

    fixedUpdate(fixedTime, fixedDeltaTime) {
        if(this.#onBeforeFixedUpdate) {
            this.#onBeforeFixedUpdate({ fixedTime, fixedDeltaTime });
        }
        
        this.#scene.traverse((actor) => actor.fixedUpdate({ gpu: this.#gpu, fixedTime, fixedDeltaTime }));

        // update all actors matrix
        // TODO
        // - scene 側でやった方がよい？
        // - skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
        // - やっぱりcomponentシステムにした方が良い気もする
        this.#scene.traverse((actor) => actor.updateTransform());

        // this.#scene.traverse((actor) => actor.afterUpdatedTransform());
    }

    update(time, deltaTime) {
        if(this.#onBeforeUpdate) {
            this.#onBeforeUpdate({ time, deltaTime });
        }

        // 本当はあんまりgpu渡したくないけど、渡しちゃったほうがいろいろと楽
        this.#scene.traverse((actor) => {
            actor.update({gpu: this.#gpu, time, deltaTime});
            switch(actor.type) {
                case ActorTypes.Skybox:
                case ActorTypes.Mesh:
                case ActorTypes.SkinnedMesh:
                    actor.beforeRender({ gpu: this.#gpu });
                    break;
                default:
                    break;
            }
        });
        
        this.render();
    }
    
    render() {
        this.#renderer.render(this.#scene, this.#scene.mainCamera);
    }
   
    // time [sec]
    run(time) {
        this.#fixedUpdateFrameTimer.exec(time / 1000);
        this.#updateFrameTimer.exec(time / 1000);
    }
}
﻿






class ForwardRenderer {
    #gpu;
    canvas;
    pixelRatio;
    #realWidth;
    #realHeight;
    
    // #depthMaterial;
    // #depthMaterialAlphaTestQueue;

    constructor({gpu, canvas, pixelRatio = 1.5}) {
        this.#gpu = gpu;
        this.canvas = canvas;
        this.pixelRatio = pixelRatio;

        // this.#depthMaterial = new Material({
        //     gpu,
        //     vertexShader: `#version 300 es
        //     layout (location = 0) in vec3 aPosition;
        //     uniform mat4 uWorldMatrix;
        //     uniform mat4 uViewMatrix;
        //     uniform mat4 uProjectionMatrix;
        //     void main() {
        //         gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
        //     }
        //     `,
        //     fragmentShader: generateDepthFragmentShader({ alphaTest: false })
        // });
        // this.#depthMaterial.start({ gpu })
        // this.#depthMaterialAlphaTestQueue = new Material({
        //     gpu,
        //     vertexShader: `#version 300 es
        //     layout (location = 0) in vec3 aPosition;
        //     uniform mat4 uWorldMatrix;
        //     uniform mat4 uViewMatrix;
        //     uniform mat4 uProjectionMatrix;
        //     void main() {
        //         gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
        //     }
        //     `,
        //     fragmentShader: generateDepthFragmentShader({ alphaTest: true })
        // });
        // console.log(generateDepthFragmentShader({ alphaTest: true }))
    }

    setSize(width, height) {
        this.#realWidth = Math.floor(width * this.pixelRatio);
        this.#realHeight = Math.floor(height * this.pixelRatio);
        this.canvas.width = this.#realWidth;
        this.canvas.height = this.#realHeight;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.#gpu.setSize(0, 0, this.#realWidth, this.#realHeight);
    }

    setRenderTarget(renderTarget) {
        const gl = this.#gpu.gl;

        if (renderTarget) {
            this.#gpu.setFramebuffer(renderTarget.framebuffer)
            this.#gpu.setSize(0, 0, renderTarget.width, renderTarget.height);
        } else {
            this.#gpu.setFramebuffer(null)
            this.#gpu.setSize(0, 0, this.#realWidth, this.#realHeight);
        }
    }

    flush() {
        this.#gpu.flush();
    }

    clear(r, g, b, a) {
        this.#gpu.clear(r, g, b, a);
    }

    #shadowPass(castShadowLightActors, castShadowRenderMeshInfos) {
        castShadowLightActors.forEach(lightActor => {
            this.setRenderTarget(lightActor.shadowMap.write);
            this.clear(0, 0, 0, 1);

            castShadowRenderMeshInfos.forEach(({ actor }) => {
                // const targetMaterial = meshActor.depthMaterial || this.#depthMaterial;

                // const targetMaterial = actor.depthMaterial;
                const targetMaterial = actor.depthMaterial;
                
                // let targetMaterial = this.#depthMaterial;
                // if(meshActor.depthMaterial) {
                //     targetMaterial = meshActor.depthMaterial;
                // } else {
                //     if(meshActor.material.alphaTest) {
                //         targetMaterial = this.#depthMaterialAlphaTestQueue;
                //     }
                // }

                // TODO: material 側でやった方がよい？
                if (targetMaterial.uniforms.uWorldMatrix) {
                    targetMaterial.uniforms.uWorldMatrix.value = actor.transform.worldMatrix;
                }
                if (targetMaterial.uniforms.uViewMatrix) {
                    targetMaterial.uniforms.uViewMatrix.value = lightActor.shadowCamera.viewMatrix;
                }
                if (targetMaterial.uniforms.uProjectionMatrix) {
                    targetMaterial.uniforms.uProjectionMatrix.value = lightActor.shadowCamera.projectionMatrix;
                }
              
                this.renderMesh(actor.geometry, targetMaterial);
            });
        });
    }
    
   #buildRenderMeshInfo(actor, materialIndex = 0) {
        return {
            actor,
            materialIndex
        }
    }

    #scenePass(sortedRenderMeshInfos, camera, lightActors) {

        // TODO: refactor
        this.clear(
            camera.clearColor.x,
            camera.clearColor.y,
            camera.clearColor.z,
            camera.clearColor.w
        );

        sortedRenderMeshInfos.forEach(({ actor, materialIndex }) => {
            switch (actor.type) {
                case ActorTypes.Skybox:
                    // TODO: skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
                    actor.updateTransform(camera);
                    break;
            }

            const targetMaterial = actor.materials[materialIndex];

            // reset
            // NOTE: 余計なresetとかしない方がいい気がする
            // if(targetMaterial.uniforms.uShadowMap) {
            //     targetMaterial.uniforms.uShadowMap.value = null;
            // }

            // TODO: material 側でやった方がよい？
            if (targetMaterial.uniforms.uWorldMatrix) {
                targetMaterial.uniforms.uWorldMatrix.value = actor.transform.worldMatrix;
            }
            if (targetMaterial.uniforms.uViewMatrix) {
                targetMaterial.uniforms.uViewMatrix.value = camera.viewMatrix;
            }
            if (targetMaterial.uniforms.uProjectionMatrix) {
                targetMaterial.uniforms.uProjectionMatrix.value = camera.projectionMatrix;
            }
            if (targetMaterial.uniforms.uNormalMatrix) {
                targetMaterial.uniforms.uNormalMatrix.value = actor.transform.worldMatrix.clone().invert().transpose();
            }
            if (targetMaterial.uniforms.uViewPosition) {
                targetMaterial.uniforms.uViewPosition.value = camera.transform.worldMatrix.position;
            }

            // TODO:
            // - light actor の中で lightの種類別に処理を分ける
            // - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意 
            lightActors.forEach(light => {
                if (targetMaterial.uniforms.uDirectionalLight) {
                    targetMaterial.uniforms.uDirectionalLight = {
                        type: UniformTypes.Struct,
                        value: {
                            direction: {
                                type: UniformTypes.Vector3,
                                value: light.transform.position,
                            },
                            intensity: {
                                type: UniformTypes.Float,
                                value: light.intensity,
                            },
                            color: {
                                type: UniformTypes.Color,
                                value: light.color
                            }
                        }
                    }
                }

                if (
                    targetMaterial.uniforms.uShadowMapProjectionMatrix &&
                    targetMaterial.receiveShadow &&
                    light.castShadow
                ) {
                    // clip coord (-1 ~ 1) to uv (0 ~ 1)
                    const textureMatrix = new Matrix4(
                        0.5, 0, 0, 0.5,
                        0, 0.5, 0, 0.5,
                        0, 0, 0.5, 0.5,
                        0, 0, 0, 1
                    );
                    const textureProjectionMatrix = Matrix4.multiplyMatrices(
                        textureMatrix,
                        light.shadowCamera.projectionMatrix.clone(),
                        light.shadowCamera.viewMatrix.clone()
                    );

                    // TODO:
                    // - directional light の構造体に持たせた方がいいかもしれない
                    if(targetMaterial.uniforms.uShadowMap) {
                        targetMaterial.uniforms.uShadowMap.value = light.shadowMap.read.texture;
                    }
                    if(targetMaterial.uniforms.uShadowMapProjectionMatrix) {
                        targetMaterial.uniforms.uShadowMapProjectionMatrix.value = textureProjectionMatrix;
                    }
                }
            });

            this.renderMesh(actor.geometry, targetMaterial);
        });
    }
    
    render(scene, camera) {
        const renderMeshInfoEachQueue = {
            skybox: [], // maybe only one
            opaque: [],
            alphaTest: [],
            transparent: [],
        };
        const lightActors = [];
        
       
        // TODO: 複数material対応
        scene.traverse((actor) => {
            switch (actor.type) {
                case ActorTypes.Skybox:
                    // renderMeshInfoEachQueue.skybox.push(actor);
                    renderMeshInfoEachQueue.skybox.push(this.#buildRenderMeshInfo(actor));
                    // TODO: skyboxの中で処理したい
                    // actor.transform.parent = camera.transform;
                    return;
                case ActorTypes.Mesh:
                case ActorTypes.SkinnedMesh:
                    actor.materials.forEach((material, i) => {
                        if(!!material.alphaTest) {
                            // renderMeshInfoEachQueue.alphaTest.push(actor);
                            renderMeshInfoEachQueue.alphaTest.push(this.#buildRenderMeshInfo(actor, i));
                            return;
                        }
                        switch (material.blendType) {
                            case BlendTypes.Opaque:
                                // renderMeshInfoEachQueue.opaque.push(actor);
                                renderMeshInfoEachQueue.opaque.push(this.#buildRenderMeshInfo(actor, i));
                                return;
                            case BlendTypes.Transparent:
                            case BlendTypes.Additive:
                                // renderMeshInfoEachQueue.transparent.push(actor);
                                renderMeshInfoEachQueue.transparent.push(this.#buildRenderMeshInfo(actor, i));
                                return;
                            default:
                                throw "invalid blend type";
                        }
                    });
                    break;

                case ActorTypes.Light:
                    lightActors.push(actor);
                    break;
            }
        });

        // TODO: depth sort 

        // sort by render queue
        // const sortRenderQueueCompareFunc = (a, b) => a.material.renderQueue - b.material.renderQueue;
        const sortRenderQueueCompareFunc = (a, b) => a.actor.materials[a.materialIndex].renderQueue - b.actor.materials[b.materialIndex].renderQueue;
        const sortedRenderMeshInfos = Object.keys(renderMeshInfoEachQueue).map(key => (renderMeshInfoEachQueue[key].sort(sortRenderQueueCompareFunc))).flat();
        
        // ------------------------------------------------------------------------------
        // 1. shadow pass
        // ------------------------------------------------------------------------------
      
        const castShadowLightActors = lightActors.filter(lightActor => lightActor.castShadow);
        
        if(castShadowLightActors.length > 0) {
            const castShadowRenderMeshInfos = sortedRenderMeshInfos.filter(({ actor }) => {
                if(actor.type === ActorTypes.Skybox) {
                    return false;
                }
                return actor.castShadow;
            });
            if(castShadowRenderMeshInfos.length > 0) {
                this.#shadowPass(castShadowLightActors, castShadowRenderMeshInfos);
            }
        }

        // ------------------------------------------------------------------------------
        // 2. scene pass
        // ------------------------------------------------------------------------------
        
        if (camera.enabledPostProcess) {
            this.setRenderTarget(camera.postProcess.renderTarget.write);
        } else {
            this.setRenderTarget(camera.renderTarget ? camera.renderTarget.write : null);
        }
       
        this.#scenePass(sortedRenderMeshInfos, camera, lightActors);

        if (camera.enabledPostProcess) {
            camera.postProcess.render({
                gpu: this.#gpu,
                renderer: this,
                camera
            });
        }

        // NOTE: ない方がよい？
        // this.setRenderTarget(null);
    }

    renderMesh(geometry, material) {
        geometry.update();

        // vertex
        this.#gpu.setVertexArrayObject(geometry.vertexArrayObject);
        this.#gpu.setIndexBufferObject(geometry.indexBufferObject);
        // material
        this.#gpu.setShader(material.shader);
        // uniforms
        this.#gpu.setUniforms(material.uniforms);

        // setup depth write (depth mask)
        let depthWrite;
        if (material.depthWrite !== null) {
            depthWrite = material.depthWrite;
        } else {
            switch (material.blendType) {
                case BlendTypes.Opaque:
                    depthWrite = true;
                    break;
                case BlendTypes.Transparent:
                case BlendTypes.Additive:
                    depthWrite = false;
                    break;
                default:
                    throw "invalid depth write";
            }
        }

        // setup depth test
        const depthTest = material.depthTest;
       
        // draw
        this.#gpu.draw(
            geometry.drawCount,
            material.primitiveType,
            depthTest,
            depthWrite,
            material.blendType,
            material.faceSide,
        );
    }
}
﻿


const createWhite1x1 = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 1;
    canvas.height = 1;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 1, 1);
    return canvas;
};

class GPU {
    gl;
    #shader;
    #vao;
    #ibo;
    #uniforms;
    dummyTexture;

    constructor({gl}) {
        this.gl = gl;
        this.dummyTexture = new Texture({ gpu: this, img: createWhite1x1() });
    }

    setShader(shader) {
        this.#shader = shader;
    }

    setVertexArrayObject(vao) {
        this.#vao = vao;
    }

    setIndexBufferObject(ibo) {
        this.#ibo = ibo;
    }

    setUniforms(uniforms) {
        this.#uniforms = uniforms;
    }

    setSize(x, y, width, height) {
        this.gl.viewport(x, y, width, height);
    }
    
    setFramebuffer(framebuffer) {
        const gl = this.gl;
        !!framebuffer
            ? gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.glObject)
            : gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    flush() {
        this.gl.flush();
    }

    clear(r, g, b, a) {
        const gl = this.gl;
        // TODO: mask設定は外側からやった方がよい気がする
        gl.depthMask(true);
        gl.colorMask(true, true, true, true);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    #getGLPrimitive(primitiveType) {
        const gl = this.gl;
        switch (primitiveType) {
            case PrimitiveTypes.Points:
                return gl.POINTS;
            case PrimitiveTypes.Lines:
                return gl.LINES;
            case PrimitiveTypes.Triangles:
                return gl.TRIANGLES;
            default:
                throw "invalid primitive type";
        }
    }
   
    draw(drawCount, primitiveType, depthTest, depthWrite, blendType, faceSide, startOffset = 0) {
        const glPrimitiveType = this.#getGLPrimitive(primitiveType);
        const gl = this.gl;
       
        // culling
        switch(faceSide) {
            case FaceSide.Front:
                gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.BACK);
                gl.frontFace(gl.CCW);
                break;
            case FaceSide.Back:
                gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.FRONT);
                gl.frontFace(gl.CCW);
                break;
            case FaceSide.Double:
                gl.disable(gl.CULL_FACE);
                gl.frontFace(gl.CCW);
                break;
            default:
                throw "invalid face side";
        }

        // depth write
        gl.depthMask(depthWrite);
        // for debug
        // console.log(gl.getParameter(gl.DEPTH_WRITEMASK));

        // depth test
        if(depthTest) {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL); // TODO: set by arg
        } else {
            gl.disable(gl.DEPTH_TEST);
        }
     
        // TODO: renderer側でやるべき？
        // blend
        // gl.blendFunc(src, dest)
        // - src: current draw
        // - dest: drawn 
        switch(blendType) {
            case BlendTypes.Opaque:
                gl.disable(gl.BLEND);
                // pattern_2: for enabled blend
                // gl.enable(gl.BLEND);
                // gl.blendFunc(gl.ONE, gl.ZERO);
                break;
            case BlendTypes.Transparent:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                break;
            case BlendTypes.Additive:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                break;
            default:
                throw "invalid blend type";
        }

        gl.useProgram(this.#shader.glObject);
        
        let activeTextureIndex = 0;
    
        const setUniformValue = (type, uniformName, value) => {
            const gl = this.gl;
            const location = gl.getUniformLocation(this.#shader.glObject, uniformName);
            // TODO: nullなとき,値がおかしいときはセットしない
            switch(type) {
                case UniformTypes.Float:
                    gl.uniform1f(location, value);
                    break;
                case UniformTypes.Vector2:
                    gl.uniform2fv(location, value.elements);
                    break;
                case UniformTypes.Vector3:
                    gl.uniform3fv(location, value.elements);
                    break;
                case UniformTypes.Matrix4:
                    // arg[1] ... use transpose.
                    gl.uniformMatrix4fv(location, false, value.elements);
                    break;
                case UniformTypes.Matrix4Array:
                    if(value) {
                        // arg[1] ... use transpose.
                        gl.uniformMatrix4fv(location, false, value.map(v => [...v.elements]).flat());
                    }
                    break;
                case UniformTypes.Color:
                    gl.uniform4fv(location, value.elements);
                    break;
                case UniformTypes.Texture:
                    if(value) {
                        gl.activeTexture(gl.TEXTURE0 + activeTextureIndex);
                        gl.bindTexture(
                            gl.TEXTURE_2D,
                            value ? value.glObject : this.dummyTexture.glObject
                        );
                        gl.uniform1i(location, activeTextureIndex);
                        activeTextureIndex++;
                    }
                    break;
                case UniformTypes.CubeMap:
                    if(value) {
                        gl.activeTexture(gl.TEXTURE0 + activeTextureIndex);
                        gl.bindTexture(
                            gl.TEXTURE_CUBE_MAP,
                            // TODO: needs dummy texture for cubemap ?
                            value ? value.glObject : this.dummyTexture.glObject
                        );
                        gl.uniform1i(location, activeTextureIndex);
                        activeTextureIndex++;
                    }
                    break;
                default:
                    throw `invalid uniform - name: ${uniformName}, type: ${type}`;
            }
        };
 
        // uniforms
        Object.keys(this.#uniforms).forEach(uniformName => {
            const uniform = this.#uniforms[uniformName];
            if(uniform.type === UniformTypes.Struct) {
                Object.keys(uniform.value).forEach(key => {
                    setUniformValue(uniform.value[key].type, `${uniformName}.${key}`, uniform.value[key].value)
                });
            } else {
                setUniformValue(uniform.type, uniformName, uniform.value);
            }
        });
        
        // set vertex
        gl.bindVertexArray(this.#vao.glObject);

        if (this.#ibo) {
            // draw by indices
            // drawCount ... use indices count
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#ibo.glObject);
            gl.drawElements(glPrimitiveType, drawCount, gl.UNSIGNED_SHORT, startOffset);
        } else {
            // draw by array
            // draw count ... use vertex num
            gl.drawArrays(glPrimitiveType, startOffset, drawCount);
        }
       
        // unbind when end render
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
}
﻿
class Scene {
    children = []; // transform hierarchy
    mainCamera;
    
    add(actor) {
        this.children.push(actor.transform);
    }
    
    traverse(execFunc) {
        for(let i = 0; i < this.children.length; i++) {
            this.recursiveTraverseActor(this.children[i].actor, execFunc);
        }
    }
    
    recursiveTraverseActor(actor, execFunc) {
        execFunc(actor);
        if(actor.transform.hasChild) {
            for(let i = 0; i < actor.transform.children.length; i++) {
                this.recursiveTraverseActor(actor.transform.children[i], execFunc)
            }
        }
    }
}
﻿


// example
// images: {
//     [CubeMapAxis.PositiveX]: "xxx.png",
//     [CubeMapAxis.NegativeX]: "xxx.png",
//     [CubeMapAxis.PositiveY]: "xxx.png",
//     [CubeMapAxis.NegativeY]: "xxx.png",
//     [CubeMapAxis.PositiveZ]: "xxx.png",
//     [CubeMapAxis.NegativeZ]: "xxx.png",
// };
 
async function loadCubeMap({ gpu, images }) {
    return await Promise.all(Object.keys(images).map(async(key) => {
            const img = await loadImg(images[key]);
            return { key, img };
        }))
        .then(result => {
            const data = {};
            result.forEach(({ key, img }) => data[key] = img);
            return new CubeMap({ gpu, images: data });
        });
}
﻿




class NodeBase {
    name;
    parent = null;
    children = [];
    
    constructor({ name }) {
        this.name = name;
    }

    get childCount() {
        return this.children.length;
    }

    get hasChild() {
        return this.childCount > 0;
    }

    addChild(child) {
        this.children.push(child);
        child.parent = this;
    }

    // TODO: 引数でworldMatrixとdirty_flagを渡すべきな気がする
    updateMatrix() {
        throw "should implementation"
    }
}
﻿




class Bone extends NodeBase {
    offsetMatrix = Matrix4.identity(); // 初期姿勢のボーンローカル座標
    #poseMatrix = Matrix4.identity(); // 初期姿勢行列
    #boneOffsetMatrix = Matrix4.identity(); // 初期姿勢行列の逆行列
    #jointMatrix = Matrix4.identity();
    index;
    
    position = Vector3.zero();
    rotation = Rotator.zero();
    scale = Vector3.one();
    
    get boneOffsetMatrix() {
        return this.#boneOffsetMatrix;
    }
    
    get poseMatrix() {
        return this.#poseMatrix;
    }
    
    get jointMatrix() {
        return this.#jointMatrix;
    }

    constructor({ index, ...options }) {
        super(options);
        this.index = index;
    }

    calcBoneOffsetMatrix(parentBone) {
        // console.log("[Bone.calcBoneOffsetMatrix]", this.name)
        this.#poseMatrix = !!parentBone
            ? Matrix4.multiplyMatrices(parentBone.poseMatrix, this.offsetMatrix)
            // ? Matrix4.multiplyMatrices(this.offsetMatrix, parentBone.poseMatrix)
            : this.offsetMatrix;
        // this.offsetMatrix.log()
        
            // : Matrix4.identity()
        // this.#poseMatrix.log();
        this.#boneOffsetMatrix = this.#poseMatrix.clone().invert();
        // this.#boneOffsetMatrix.log()
        // Matrix4.multiplyMatrices(this.#boneOffsetMatrix.clone(), this.#poseMatrix.clone()).log()
        this.children.forEach(childBone => childBone.calcBoneOffsetMatrix(this));
    }
    
    // calcJointMatrix(childBone) {
    //     console.log(this, childBone)
    //     this.#jointMatrix = !!childBone
    //         ? Matrix4.multiplyMatrices(this.offsetMatrix, childBone.jointMatrix)
    //         : this.offsetMatrix;
    //     this.#jointMatrix.log()
    //     if (this.parent) {
    //         this.parent.calcJointMatrix(this);
    //     }
    // }

    calcJointMatrix(parentBone) {
        // 1: update offset matrix
        this.offsetMatrix = Matrix4.fromTRS(this.position, this.rotation, this.scale);
        // console.log(this.name, this.position, this.rotation, this.scale)
        // console.log(this.name, this.offsetMatrix);
        
        // 2: update joint matrix
        // console.log("[Bone.calcJointMatrix]", this.name)
        this.#jointMatrix = !!parentBone
            ? Matrix4.multiplyMatrices(parentBone.jointMatrix, this.offsetMatrix)
            // ? Matrix4.multiplyMatrices(this.offsetMatrix, parentBone.jointMatrix)
            : this.offsetMatrix;
        
        // this.#jointMatrix.log()
       
        // NOTE: 無理やりpose状態にする時はこれを使う
        // this.#jointMatrix = this.#boneOffsetMatrix.clone().invert();
        
        this.children.forEach(childBone => childBone.calcJointMatrix(this));
    }
    
    traverse(callback) {
        callback(this);
        this.children.forEach(child => {
            child.traverse(callback);
        })
    }
}
﻿


class AnimationClip {
    name;
    target;
    key;
    interpolation;
    type; // animation clip type
    #data;
    start;
    end;
    frames;
    frameCount;
    // elementSize; // TODO: typeを元に振り分けても良い気がする
    
    #currentTime;
    currentFrame;
    
    loop;
    isPlaying;

    speed = 1;
    
    // TODO: fpsをgltfから引っ張ってこれるかどうか
    fps = 30; // default
    
    onUpdateProxy;
    
    #keyframes = [];
    
    get keyframes() {
        return this.#keyframes;
    }
    
    get data() {
        return this.#data;
    }

    constructor({ name, start, end, frames, frameCount, keyframes }) {
        this.name = name;
        this.start = start;
        this.end = end;
        this.frames = frames;
        this.frameCount = frameCount;
        this.#keyframes = keyframes;
        // this.elementSize = elementSize;
       
        // TODO: add keyframes した時も計算するようにした方が便利そう 
        this.frameCount = Math.max(...(keyframes.map(({ frameCount }) => frameCount)));
    }
    
    // addAnimationKeyframes(animationKeyframe) {
    //     this.#keyframes.push(animationKeyframe);
    // }
   
    // start at 0 frame
    play() {
        this.#currentTime = 0;
        this.isPlaying = true;
    }

    update(deltaTime) {
        if(!this.isPlaying) {
            return;
        }
        
        // spf ... [s / frame]
        const spf = 1 / this.fps;

        this.#currentTime += deltaTime * this.speed;
       
        // TODO: durationはendと常にイコールならendを参照する形でもよい
        const duration = spf * this.frameCount;
        
        if(this.#currentTime > duration) {
            if(!this.loop) {
                this.currentFrame = this.frameCount;
                this.#currentTime = duration; 
                return;
            }
            this.#currentTime %= duration;
        }

        this.currentFrame = Math.floor(this.#currentTime / spf);
        
        // // build frame value each animation clip type
        // // TODO:
        // // - 関数に切り出してもいいかも
        // // - 必ず生の値を渡すでもいいかもしれない
        // let frameValue;
        // switch(this.type) {
        //     case AnimationClipTypes.Vector3:
        //         frameValue = new Vector3(rawFrameValue[0], rawFrameValue[1], rawFrameValue[2]);
        //         break;
        //     case AnimationClipTypes.Rotator:
        //         // TODO: raw frame value は quaternion ?
        //         frameValue = Rotator.fromRadian(rawFrameValue[0], rawFrameValue[1], rawFrameValue[2]);
        //         break;
        //     // TODO: typeごとの処理
        //     default:
        //         throw "invalid animation clip type";
        // }
       
        // 代理でupdateしたい場合 
        if(this.onUpdateProxy) {
            const keyframes = this.#keyframes.map(animationKeyframes => {
                // console.log(this.currentFrame, animationKeyframes.getFrameValue(this.currentFrame))
                return {
                    target: animationKeyframes.target,
                    key: animationKeyframes.key,
                    frameValue: animationKeyframes.getFrameValue(this.currentFrame)
                }
            });
            this.onUpdateProxy(keyframes);
        } else {
            this.#keyframes.forEach(animationKeyframes => {
                const frameValue = animationKeyframes.getFrameValue(this.currentFrame)
                switch (animationKeyframes.key) {
                    case "translation":
                        animationKeyframes.target.position = frameValue;
                        break;
                    case "rotation":
                        // TODO: rotationはquaternionなのでquaternionであるべき
                        const q = frameValue;
                        const euler = q.toEulerDegree();
                        // console.log(euler)
                        animationKeyframes.target.rotation = Rotator.fromRadian(
                            euler.x * Math.PI / 180,
                            euler.y * Math.PI / 180,
                            euler.z * Math.PI / 180,
                        );
                        break;
                    case "scale":
                        animationKeyframes.scale = frameValue;
                        break;
                    default:
                        throw "invalid animation keyframes key";
                }
            });
        }
    }
}


class Quaternion {
    elements;
    
    get x () {
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

    constructor(x, y, z, w) {
        this.set(x, y, z, w);
    }
    
    set(x, y, z, w) {
        this.elements = new Float32Array([x, y, z, w]);
        return this;
    }

    // ref:
    // - https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles#Quaternion_to_Euler_angles_conversion
    // - https://github.com/infusion/Quaternion.js/blob/master/quaternion.js
    toEulerRadian() {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = this.w;
        const t = 2 * (w * y - z * x);

        return {
            // X-axis rotation
            x: (Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y))),
            // Y-axis rotation
            y: (t >= 1 ? Math.PI / 2 : (t <= -1 ? -Math.PI / 2 : Math.asin(t))),
            // Z-axis rotation
            z: (Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)))
        };
    }
    
    // degree
    toEulerDegree() {
        const rad = this.toEulerRadian();
        return {
            x: rad.x * 180 / Math.PI,
            y: rad.y * 180 / Math.PI,
            z: rad.z * 180 / Math.PI,
        };
    }
    
    static identity() {
        return new Quaternion(0, 0, 0, 1);
    }
}
﻿



class AnimationKeyframes {
    target;
    key;
    interpolation;
    #data;
    #elementSize;
    frameCount
    
    

    get data() {
        return this.#data;
    }

    constructor({ target, type, key, interpolation, data, start, end, frameCount }) {
        this.target = target;
        this.key = key;
        this.interpolation = interpolation;
        this.type = type;
        this.#data = data;
        this.start = start;
        this.end = end;
        this.frameCount = frameCount;

        switch(this.type) {
            case AnimationKeyframeTypes.Vector3:
                this.#elementSize = 3;
                break;
            case AnimationKeyframeTypes.Quaternion:
                this.#elementSize = 4;
                break;
            default:
                throw "[AnimationKeyframes.getFrameValue] invalid type";
        }       
    }

    getFrameValue(frame) {
        const arr = (new Array(this.#elementSize)).fill(0).map((e, i) => this.#data[frame * this.#elementSize + i]);

        switch(this.type) {
            case AnimationKeyframeTypes.Vector3:
                return new Vector3(...arr);
            case AnimationKeyframeTypes.Quaternion:
                return new Quaternion(...arr);
            default:
                throw "[AnimationKeyframes.getFrameValue] invalid type";
        }
    }
}













async function loadGLTF({
    gpu,
    path,
}) {
    const response = await fetch(path);
    const gltf = await response.json();

    const rootActor = new Actor();

    // for debug
    console.log("[loadGLTF]", gltf);
 
    const cacheNodes = [];

    // gltf.scene ... default scene index
    // const targetScene = gltf.scenes[gltf.scene];

    // accessor の component type は gl の format と値が同じ
    // console.log('gl.BYTE', gl.BYTE); // 5120
    // console.log('gl.UNSIGNED_BYTE', gl.UNSIGNED_BYTE); // 5121
    // console.log('gl.SHORT', gl.SHORT); // 5122
    // console.log('gl.UNSIGNED_SHORT', gl.UNSIGNED_SHORT); // 5123
    // console.log('gl.INT', gl.INT); // 5124
    // console.log('gl.UNSIGNED_INT', gl.UNSIGNED_INT); // 5125
    // console.log('gl.FLOAT', gl.FLOAT); // 5126    

    const binBufferDataList = await Promise.all(gltf.buffers.map(async (buffer) => {
        // NOTE: buffer = { byteLength, uri }
        const binResponse = await fetch(buffer.uri);
        const binBufferData = await binResponse.arrayBuffer();
        return {byteLength: buffer.byteLength, binBufferData};
    }));

    const getBufferData = (accessor) => {
        const bufferView = gltf.bufferViews[accessor.bufferView];
        const {binBufferData} = binBufferDataList[bufferView.buffer];
        const slicedBuffer = binBufferData.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
        return slicedBuffer;
    }
    
    const createBone = (nodeIndex, parentBone) => {
        const node = gltf.nodes[nodeIndex];
        // NOTE:
        // - nodeのindexを入れちゃう。なので数字が0始まりじゃないかつ飛ぶ場合がある
        // - indexをふり直しても良い
        const bone = new Bone({name: node.name, index: nodeIndex});
        cacheNodes[nodeIndex] = bone;
      
        // TODO: fix initial pose matrix
        const offsetMatrix = Matrix4.multiplyMatrices(
            node.translation ? Matrix4.translationMatrix(new Vector3(...node.translation)) : Matrix4.identity(),
            node.rotation ? Matrix4.fromQuaternion(new Quaternion(...node.rotation)) : Matrix4.identity(),
            node.scale ? Matrix4.scalingMatrix(new Vector3(...node.scale)) : Matrix4.identity()
        );
        bone.offsetMatrix = offsetMatrix;
        
        if (parentBone) {
            parentBone.addChild(bone);
        }
        if (node.children) {
            node.children.forEach(childNodeIndex => createBone(childNodeIndex, bone));
        }

        return bone;
    };

    const createMesh = ({nodeIndex, meshIndex, skinIndex = null}) => {
        let positions = null;
        let normals = null;
        let uvs = null;
        let indices = null;
        let joints = null;
        let weights = null;
        let rootBone = null;

        console.log(`[loadGLTF.createMesh] mesh index: ${meshIndex}, skin index: ${skinIndex}`);

        const mesh = gltf.meshes[meshIndex];

        mesh.primitives.forEach(primitive => {
            const meshAccessors = {
                attributes: [],
                indices: null
            }
            Object.keys(primitive.attributes).forEach(attributeName => {
                const accessorIndex = primitive.attributes[attributeName];
                meshAccessors.attributes.push({attributeName, accessor: gltf.accessors[accessorIndex]});
            });
            if (primitive.indices) {
                meshAccessors.indices = {accessor: gltf.accessors[primitive.indices]};
            }
            meshAccessors.attributes.forEach(attributeAccessor => {
                const {attributeName, accessor} = attributeAccessor;
                // NOTE: accessor = {buffer, byteLength, byteOffset, target }
                // const bufferView = gltf.bufferViews[accessor.bufferView];
                // const {binBufferData} = binBufferDataList[bufferView.buffer];
                // const slicedBuffer = binBufferData.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
                // const data = new Float32Array(slicedBuffer);
                const bufferData = getBufferData(accessor);
                switch (attributeName) {
                    case "POSITION":
                        positions = new Float32Array(bufferData);
                        break;
                    case "NORMAL":
                        normals = new Float32Array(bufferData);
                        break;
                    case "TEXCOORD_0":
                        uvs = new Float32Array(bufferData);
                        break;
                    case "JOINTS_0":
                        joints = new Uint8Array(bufferData);
                        // joints = new Float32Array(bufferData);
                        break;
                    case "WEIGHTS_0":
                        weights = new Float32Array(bufferData);
                        break;
                    default:
                        throw "[loadGLTF] invalid attribute name";
                }
            });
            if (meshAccessors.indices) {
                const {attributeName, accessor} = meshAccessors.indices;
                // NOTE: accessor = {buffer, byteLength, byteOffset, target }
                // const bufferView = gltf.bufferViews[accessor.bufferView];
                // const {binBufferData} = binBufferDataList[bufferView.buffer];
                // const slicedBuffer = binBufferData.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
                // indices = new Uint16Array(slicedBuffer);
                const bufferData = getBufferData(accessor);
                indices = new Uint16Array(bufferData);
            }
        });

        if (skinIndex !== null) {
            console.log("[loadGLTF.createMesh] mesh has skin");
            // gltf.skins
            const skin = gltf.skins[skinIndex];

            // NOTE: joints の 0番目が常に root bone のはず？
            rootBone = createBone(skin.joints[0]);

            // TODO: skinning mesh 側でやるべき？
            // rootBone.calcBoneOffsetMatrix();
            // rootBone.calcJointMatrix();
        }
       
        // GLTF2.0は、UV座標の原点が左上にある。しかし左下を原点とした方が分かりやすい気がしているのでYを反転
        // - uvは2次元前提で処理している
        // ref: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#images
        const uvFlippedY = uvs.map((elem, i) => i % 2 === 0 ? elem : 1. - elem);
        
        const { tangents, binormals } = Geometry.createTangentsAndBinormals(normals);

        // for debug
        // console.log("======================================")
        // console.log("root bone", rootBone)
        // console.log(positions, uvFlippedY, normals, joints, weights)
        // console.log(tangents, binormals)
        // console.log("======================================")

        const geometry = new Geometry({
            gpu,
            attributes: {
                position: {
                    data: positions,
                    size: 3,
                },
                uv: {
                    data: uvFlippedY,
                    size: 2
                },
                normal: {
                    data: normals,
                    size: 3
                },
                // bone があるならjointとweightもあるはず
                ...(rootBone ? {
                    boneIndices: {
                        data: joints,
                        size: 4
                    },
                    boneWeights: {
                        data: weights,
                        size: 4
                    },
                } : {}),               
                tangent: {
                    data: tangents,
                    size: 3
                },
                binormal: {
                    data: binormals,
                    size: 3
                },
            },
            indices,
            drawCount: indices.length
        });
        
        return rootBone
            ? new SkinnedMesh({ geometry, bones: rootBone })
            : new Mesh({ geometry })
    }

    const findNode = (nodeIndex, parentActor) => {
        const targetNode = gltf.nodes[nodeIndex];
        
        // for debug
        // console.log("[loadGLTF.findNode] target node", targetNode);
        
        const hasChildren = targetNode.hasOwnProperty("children");
        const hasMesh = targetNode.hasOwnProperty("mesh");
        
        // mesh actor
        if (hasMesh) {
            // TODO: fix multi mesh
            const meshActor = createMesh({
                nodeIndex,
                meshIndex: targetNode.mesh,
                skinIndex: targetNode.hasOwnProperty("skin") ? targetNode.skin : null
            });
            cacheNodes[nodeIndex] = meshActor;
            
            parentActor.addChild(meshActor);
            
            if (hasChildren) {
                targetNode.children.forEach(child => findNode(child, meshActor));
            }
            
            return;
        }
       
        // TODO: meshがない時、boneなのかnull_actorなのかの判別がついてない
        if (hasChildren) {
            if(!!cacheNodes[nodeIndex]) {
                targetNode.children.forEach(child => findNode(child, parentActor));
            } else {
                const anchorActor = new Actor();
                parentActor.addChild(anchorActor);
                cacheNodes[nodeIndex] = anchorActor;
                targetNode.children.forEach(child => findNode(child, anchorActor));
            }
        }
    }

    gltf.scenes.forEach(scene => {
        scene.nodes.forEach(node => {
            findNode(node, rootActor)
        });
    });
    
    const createAnimationClips = () => {
        return gltf.animations.map(animation => {
            const keyframes = animation.channels.map(channel => {
                const sampler = animation.samplers[channel.sampler];
                const inputAccessor = gltf.accessors[sampler.input];
                const inputBufferData = getBufferData(inputAccessor);
                const inputData = new Float32Array(inputBufferData);
                const outputAccessor = gltf.accessors[sampler.output];
                const outputBufferData = getBufferData(outputAccessor);
                const outputData = new Float32Array(outputBufferData);
                let elementSize;
                switch(channel.target.path) {
                    case "translation":
                    case "scale":
                        elementSize = 3;
                        break;
                    case "rotation":
                        elementSize = 4;
                        break;
                    default:
                        throw "invalid key type";
                }
                
                let animationKeyframeType;
                switch(channel.target.path) {
                    case "rotation":
                        animationKeyframeType = AnimationKeyframeTypes.Quaternion;
                        break;
                    case "translation":
                    case "scale":
                        animationKeyframeType = AnimationKeyframeTypes.Vector3;
                        break;
                    default:
                        throw "invalid channel taget path";
                }
                
                const animationKeyframes = new AnimationKeyframes({
                    target: cacheNodes[channel.target.node],
                    key: channel.target.path,
                    interpolation: sampler.interpolation,
                    // type: outputAccessor.type,
                    data: outputData,
                    start: inputAccessor.min,
                    end: inputAccessor.max,
                    frames: inputData,
                    frameCount: inputAccessor.count,
                    // elementSize,
                    type: animationKeyframeType
                });
                return animationKeyframes;
                // animationClip.addAnimationKeyframes(animationKeyframes);
            });
            const animationClip = new AnimationClip({ 
                name: animation.name,
                keyframes
            });
            return animationClip;
        });
    }

    console.log("------------")
    console.log("cache nodes", cacheNodes)

    if(gltf.animations && gltf.animations.length > 0) {
        const animationClips = createAnimationClips();
        console.log("animation clips", animationClips);
        rootActor.animator.setAnimationClips(animationClips);
        // rootActor.animationClips = ;
    }

    console.log("root actor", rootActor);
    console.log("------------")

    // console.log(rootActor)

    return rootActor;

    // const data = {
    //     positions: mesh.positions,
    //     normals: mesh.normals,
    //     uvs: mesh.uvs,
    //     indices: mesh.indices
    // }

    // // for debug
    // // console.log(data)
    // 
    // return data;
}


﻿
async function loadTexture(src) {
}
﻿class Vector2 {
    elements;
    
    get x() {
        return this.elements[0];
    }

    get y() {
        return this.elements[1];
    }

    set x(value) {
        this.elements[0] = value;
    }

    set y(value) {
        this.elements[1] = value;
    }

    constructor(x, y) {
        this.set(x, y);
    }
    
    set(x, y) {
        this.elements = new Float32Array([x, y]);
        return this;
    }
    
    static identity() {
        return new Vector2(0, 0);
    }

    static one() {
        return new Vector2(1, 1);
    }

    log() {
        console.log(`--------------------
${this.x}, ${this.y}
--------------------`);       
    }
}








class PhongMaterial extends Material {
    constructor({
        diffuseMap,
        diffuseMapUvScale, // vec2
        diffuseMapUvOffset, // vec2
        normalMap,
        normalMapUvScale, // vec2
        normalMapUvOffset, // vec2,
        uniforms = {},
        // jointMatrices,
        ...options
    }) {
        const baseUniforms = {
            uDiffuseMap: {
                type: UniformTypes.Texture,
                value: diffuseMap,
            },
            uDiffuseMapUvScale: {
                type: UniformTypes.Vector2,
                value: Vector2.one()
            },
            uDiffuseMapUvOffset: {
                type: UniformTypes.Vector2,
                value: Vector2.one()
            },
            uNormalMap: {
                type: UniformTypes.Texture,
                value: normalMap,
            },
            uNormalMapUvScale: {
                type: UniformTypes.Vector2,
                value: Vector2.one()
            },
            uNormalMapUvOffset: {
                type: UniformTypes.Vector2,
                value: Vector2.one()
            },
            // ...(jointMatrices ? {
            //     uJointMatrices: {
            //         type: UniformTypes.Matrix4Array,
            //         value: jointMatrices
            //     }
            // } : {}),
            uDirectionalLight: {}
        };
        
        const isSkinning = !!uniforms.uJointMatrices;
        
        const useNormalMap = !!normalMap;
        const vertexShader = generateVertexShader({
            isSkinning,
            // jointNum: isSkinning ? baseUniforms.uJointMatrices.value.length : null,
            jointNum: isSkinning ? uniforms.uJointMatrices.value.length : null,
            receiveShadow: options.receiveShadow,
            useNormalMap
        });
        const fragmentShader = PhongMaterial.generateFragmentShader({
            receiveShadow: options.receiveShadow,
            useNormalMap,
            alphaTest: options.alphaTest
        });
        
        const mergedUniforms = {
            ...baseUniforms,
            ...(uniforms ?  uniforms : {})
        };
        
        const depthFragmentShader = PhongMaterial.generateDepthFragmentShader({ alphaTest: options.alphaTest });
        const depthUniforms = {
            uDiffuseMap: {
                type: UniformTypes.Texture,
                value: diffuseMap,
            },
            uDiffuseMapUvScale: {
                type: UniformTypes.Vector2,
                value: Vector2.one()
            },
            uDiffuseMapUvOffset: {
                type: UniformTypes.Vector2,
                value: Vector2.one()
            },
            // ...(jointMatrices ? {
            //     uJointMatrices: {
            //         type: UniformTypes.Matrix4Array,
            //         value: jointMatrices
            //     }
            // } : {}),
        }

        super({
            ...options,
            vertexShader,
            fragmentShader,
            uniforms: mergedUniforms,
            depthFragmentShader,
            depthUniforms
        });
    }
    
    static generateFragmentShader({ receiveShadow, useNormalMap, alphaTest }) {
        return `#version 300 es

precision mediump float;

uniform sampler2D uDiffuseMap; 
uniform vec2 uDiffuseMapUvScale;
${useNormalMap ? normalMapFragmentUniforms() : ""}
${receiveShadow ? shadowMapFragmentUniforms() : ""}
uniform vec3 uViewPosition;
${alphaTest ? alphaTestFragmentUniforms() : ""}

${directionalLightFragmentUniforms()}

struct Surface {
    vec3 worldNormal;
    vec3 worldPosition;
    vec4 diffuseColor;
};

struct Camera {
    vec3 worldPosition;
};

in vec2 vUv;
in vec3 vNormal;
${receiveShadow ? shadowMapFragmentVaryings() : ""}
${normalMapFragmentVarying()}
in vec3 vWorldPosition;

out vec4 outColor;

${phongSurfaceDirectionalLightFunc()}
${useNormalMap ? normalMapFragmentFunc() : ""}
${receiveShadow ? shadowMapFragmentFunc() : ""}
${alphaTest ? alphaTestFragmentFunc() : ""}    

void main() {
    vec2 uv = vUv * uDiffuseMapUvScale;
   
    vec4 diffuseMapColor = texture(uDiffuseMap, uv);
    
    ${useNormalMap
        ? "vec3 worldNormal = calcNormal(vNormal, vTangent, vBinormal, uNormalMap, uv);"
        : "vec3 worldNormal = normalize(vNormal);"
    }

    Surface surface;
    surface.worldPosition = vWorldPosition;
    surface.worldNormal = worldNormal;
    surface.diffuseColor = diffuseMapColor; // TODO: base color をかける
    
    Camera camera;
    camera.worldPosition = uViewPosition;
    
    vec4 resultColor = vec4(0, 0, 0, 1);
    
    // directional light
    resultColor = calcDirectionalLight(surface, uDirectionalLight, camera);
    
    ${receiveShadow
        ? `resultColor = applyShadow(resultColor, uShadowMap, vShadowMapProjectionUv, uShadowBias, vec4(0., 0., 0., 1.), 0.7);`
        : ""
    }
    ${alphaTest
        ? `checkAlphaTest(resultColor.a, uAlphaTestThreshold);`
        : ""
    }

    outColor = resultColor;
}
`;
    }

    static generateDepthFragmentShader({ alphaTest }) {
        return `#version 300 es

precision mediump float;

uniform sampler2D uDiffuseMap; 
uniform vec2 uDiffuseMapUvScale;
${alphaTest ? alphaTestFragmentUniforms() : ""}

in vec2 vUv;

out vec4 outColor;

${alphaTest ? alphaTestFragmentFunc() : ""}    

void main() {
    vec2 uv = vUv * uDiffuseMapUvScale;
   
    vec4 diffuseMapColor = texture(uDiffuseMap, uv);
    
    vec4 diffuseColor = diffuseMapColor;
    
    float alpha = diffuseColor.a; // TODO: base color を渡して alpha をかける
    
    ${alphaTest
        ? `checkAlphaTest(alpha, uAlphaTestThreshold);`
        : ""
    }

    outColor = vec4(1., 1., 1., 1.);
}
`;
    }
    
}
﻿class Color {
    elements; // each 0~1
    
    get r() {
        return this.elements[0];
    }
    
    get g() {
        return this.elements[1];
    }
    
    get b() {
        return this.elements[2];
    }
    
    get a() {
        return this.elements[3];
    }
    
    get r255() {
        return this.elements[0] * 255;
    }

    get g255() {
        return this.elements[1] * 255;
    }

    get b255() {
        return this.elements[2] * 255;
    }

    get a255() {
        return this.elements[3] * 255;
    }
    
    set a(value) {
        this.elements[3] = value;
    }
    
    constructor(r, g, b, a) {
        this.set(r, g, b, a);
    }
    
    set(r, g, b, a) {
        this.elements = new Float32Array([r, g, b, a]);
    }
    
    getRGB() {
        return {
            r: this.r255,
            g: this.g255,
            b: this.a255,
        }
    }
    
    getHexCoord(withHash = true) {
        const rgb = this.getRGB();
        const r = rgb.r.toString(16);
        const g = rgb.g.toString(16);
        const b = rgb.b.toString(16);
        const str = withHash ? `#${r}${g}${b}` : `${r}${g}${b}`;
        // for debug
        // console.log(rgb, str, this.r, this.g, this.b)
        return str;
    }
    
    static white() {
        return new Color(1, 1, 1, 1);
    }
    
    static black() {
        return new Color(0, 0, 0, 1);
    }
    
    static fromRGB(r, g, b, a) {
        return new Color(r / 255, g / 255, b / 255, 1);
    }
    
    // hex ... #rrggbb or rrggbb
    static fromHex(hex) {
        const coord = hex.slice(0, 1) === "#" ? hex.slice(1) : hex;
        const r = coord.slice(0, 2);
        const g = coord.slice(2, 4);
        const b = coord.slice(4, 6);
        return new Color(
            Number.parseInt(r, 16) / 255,
            Number.parseInt(g, 16) / 255,
            Number.parseInt(b, 16) / 255,
            1
        );
    }
}
﻿






class PostProcessPass {
    #geometry;
    #material;
    renderTarget;
    mesh;
    
    constructor({ gpu, vertexShader, fragmentShader, uniforms }) {
        const baseVertexShader = `#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aUv;

out vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 1);
}
`;
        vertexShader = vertexShader || baseVertexShader;

        // NOTE: geometryは親から渡して使いまわしてもよい
        this.#geometry = new PlaneGeometry({ gpu });
        this.#material = new Material({
            gpu,
            vertexShader,
            fragmentShader,
            uniforms: {
                ...uniforms, 
                uSceneTexture: {
                    type: UniformTypes.Texture,
                    value: null
                }
            },
            primitiveType: PrimitiveTypes.Triangles
        });
        this.mesh = new Mesh({
            geometry: this.#geometry,
            material: this.#material
        }); 
        
        this.renderTarget = new RenderTarget({ gpu, width: 1, height: 1 });
    }
  
    setSize(width, height) {
        this.renderTarget.setSize(width, height);
    }
}
﻿


class CopyPass extends PostProcessPass {
    constructor({ gpu }) {
        const fragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSceneTexture;

void main() {
    vec4 textureColor = texture(uSceneTexture, vUv);
    outColor = textureColor;
}
`;

        super({ gpu, fragmentShader });
    }
}
﻿

class FragmentPass extends PostProcessPass {
    constructor({ gpu, fragmentShader }) {
        super({ gpu, fragmentShader });
    }
}
﻿



// TODO: actorを継承してもいいかもしれない
class PostProcess {
    passes = [];
    renderTarget;
    #camera;
    enabled = true;
    
    constructor({ gpu }) {
        this.renderTarget = new RenderTarget({ gpu, width: 1, height: 1, useDepthBuffer: true });
        this.#camera = new OrthographicCamera(-1, 1, -1, 1, 0, 2);
        this.#camera.transform.setTranslation(new Vector3(0, 0, 1));
    }
 
    setSize(width, height) {
        this.#camera.setSize(width, height);
        this.renderTarget.setSize(width, height);
        this.passes.forEach(pass => pass.setSize(width, height));
    }
   
    addPass(pass) {
        this.passes.push(pass);
    }

    render({ gpu, renderer, camera }) {
        this.#camera.updateTransform();
        let prevRenderTarget = this.renderTarget;
        // TODO
        // - filterでenabledなpassのみ抽出
        this.passes.forEach((pass, i) => {
            const isLastPass = i === this.passes.length - 1;
            if(isLastPass) {
                renderer.setRenderTarget(camera.renderTarget);
            } else {
                renderer.setRenderTarget(pass.renderTarget);
            }
            renderer.clear(
                this.#camera.clearColor.x,
                this.#camera.clearColor.y,
                this.#camera.clearColor.z,
                this.#camera.clearColor.w
            );
            
            // このあたりの処理をpassに逃してもいいかもしれない
            pass.mesh.updateTransform();
            pass.mesh.material.uniforms.uSceneTexture.value = prevRenderTarget.texture;
            if(!pass.mesh.material.isCompiledShader) {
                pass.mesh.material.compileShader({ gpu })
            }

            renderer.renderMesh(pass.mesh.geometry, pass.mesh.material);
            prevRenderTarget = pass.renderTarget;
        });
    }
}
﻿


class FXAAPass extends PostProcessPass {
    constructor({ gpu }) {
        const fragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSceneTexture;
uniform float uTargetWidth;
uniform float uTargetHeight;
        
float rgbToLuma(vec3 rgb) {
    // return dot(rgb, vec3(.2126729, .7151522, .0721750));
    return dot(rgb, vec3(.299, .587, .114));
}

void main() {
    vec2 texelSize = vec2(1. / uTargetWidth, 1. / uTargetHeight);
    
    // ------------------------------------------------------------------
    // local contrast check
    // ------------------------------------------------------------------
    
    vec3 rgbTop = texture(uSceneTexture, vUv + vec2(0., texelSize.y)).xyz;
    vec3 rgbLeft = texture(uSceneTexture, vUv + vec2(-texelSize.x, 0.)).xyz;
    vec3 rgbCenter = texture(uSceneTexture, vUv + vec2(0., 0.)).xyz;
    vec3 rgbRight = texture(uSceneTexture, vUv + vec2(texelSize.x, 0.)).xyz;
    vec3 rgbBottom = texture(uSceneTexture, vUv + vec2(0., -texelSize.y)).xyz;
    
    float lumaTop = rgbToLuma(rgbTop);
    float lumaLeft = rgbToLuma(rgbLeft);
    float lumaCenter = rgbToLuma(rgbCenter);
    float lumaRight = rgbToLuma(rgbRight);
    float lumaBottom = rgbToLuma(rgbBottom);
    
    float lumaLowest = min(lumaCenter, min(min(lumaTop, lumaLeft), min(lumaBottom, lumaRight)));
    float lumaHighest = max(lumaCenter, max(max(lumaTop, lumaLeft), max(lumaBottom, lumaRight)));
    float lumaContrast = lumaHighest - lumaLowest;
    
    float FXAA_EDGE_THRESHOLD_MIN = .0312;
    float FXAA_EDGE_THRESHOLD_MAX = .125;
    
    outColor = vec4(vec3(lumaContrast), 1.);
    return;
        
    if(lumaContrast < max(FXAA_EDGE_THRESHOLD_MIN, lumaHighest * FXAA_EDGE_THRESHOLD_MAX)) {
        outColor = vec4(rgbCenter, 1.);
        return;
    }
    
    // ------------------------------------------------------------------
    // sub pixel aliasing test
    // ------------------------------------------------------------------
   
    // float lumaL = (lumaTop + lumaLeft + lumaEast + lumaBottom) * .25;
    // float rangeL = abs(lumaL - lumaCenter);
    // float blendL = max(0., (rangeL / range) - FXAA_SUBPIX_TRIM) * FXAA_SUBPIX_TRIM_SCALE;
    // blendL = min(FXAA_SUBPIX_CAP, blendL);
    // 
    // float rgbL = rgbTop + rgbLeft + rgbCenter + rgbEast + rgbBottom;
    
    vec3 rgbTopLeft = texture(uSceneTexture, vUv + vec2(-texelSize.x, texelSize.y)).xyz;
    vec3 rgbTopRight = texture(uSceneTexture, vUv + vec2(texelSize.x, texelSize.y)).xyz;
    vec3 rgbBottomLeft = texture(uSceneTexture, vUv + vec2(-texelSize.x, -texelSize.y)).xyz;
    vec3 rgbBottomRight = texture(uSceneTexture, vUv + vec2(texelSize.x, texelSize.y)).xyz;

    // rgbL += (rgbTopLeft + rgbTopRight + rgbBottomLeft + rgbBottomRight);
    // rgbL *= (1. / 9.);
    
    // ------------------------------------------------------------------
    // result
    // ------------------------------------------------------------------
 
    // vec4 textureColor = texture(uSceneTexture, vUv);
    // outColor = vec4(vec3(lumaM), 1.);
}
`;

        super({
            gpu,
            fragmentShader,
            uniforms: {
                uTargetWidth: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uTargetHeight: {
                    type: UniformTypes.Float,
                    value: 1,
                }
            }
        });
    }
    
    setSize(width, height) {
        super.setSize(width, height);
        this.mesh.material.uniforms.uTargetWidth.value = width;
        this.mesh.material.uniforms.uTargetHeight.value = height;
    }
    
}
﻿
// actors
export {Actor};
export {ArrowHelper};
export {AxesHelper};
export {DirectionalLight};
export {Light};
export {Mesh};
export {OrthographicCamera};
export {PerspectiveCamera};
export {SkinnedMesh};
export {Skybox};

// core
export {CubeMap};
export {DoubleBuffer};
export {Engine};
export {ForwardRenderer};
export {GPU};
export {RenderTarget};
export {Scene};
export {Texture};

// geometries
export {BoxGeometry};
export {Geometry};
export {PlaneGeometry};

// loaders
export {loadCubeMap};
export {loadGLTF};
export {loadImg};
export {loadObj};
export {loadTexture};

// materials
export {Material};
export {PhongMaterial};

// math
export {Color};
export {Matrix4};
export {Quaternion};
export {Rotator};
export {Vector2};
export {Vector3};
export {Vector4};

// postprocess
export {CopyPass};
export {FragmentPass};
export {PostProcess};
export {PostProcessPass};
export {FXAAPass};

// shaders
export {generateVertexShader};

// utilities

// others
export {
    PrimitiveTypes,
    AttributeTypes,
    UniformTypes,
    TextureTypes,
    TextureWrapTypes,
    TextureFilterTypes,
    BlendTypes,
    RenderQueues,
    RenderbufferTypes,
    ActorTypes,
    CubeMapAxis,
    FaceSide,
    AttributeUsageType,
    RenderTargetTypes,
    AnimationKeyframeTypes
};