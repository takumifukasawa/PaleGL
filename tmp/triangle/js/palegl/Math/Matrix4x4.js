import { Vector3 } from "./Vector3.js";

export class Matrix4 {
  // prettier-ignore
  constructor(
    m00, m01, m02, m03,
    m10, m11, m12, m13,
    m20, m21, m22, m23,
    m30, m31, m32, m33
  ) {
    this.m00 = m00;
    this.m01 = m01;
    this.m02 = m02;
    this.m03 = m03;
    this.m10 = m10;
    this.m11 = m11;
    this.m12 = m12;
    this.m13 = m13;
    this.m20 = m20;
    this.m21 = m21;
    this.m22 = m22;
    this.m23 = m23;
    this.m30 = m30;
    this.m31 = m31;
    this.m32 = m32;
    this.m33 = m33;
    return this;
  }

  static zero() {
    // prettier-ignore
    return new Matrix4(
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0
    );
  }

  static identity() {
    // prettier-ignore
    return new Matrix4(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
  }

  static createTranslationMatrix(v) {
    // prettier-ignore
    return new Matrix4(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      v.x, v.y, v.z, 1
    );
  }

  translate(v) {
    this.m30 += v.x;
    this.m31 += v.y;
    this.m32 += v.z;
    return this;
  }

  getTranslationVector() {
    return new Vector3(this.m30, this.m31, this.m32);
  }

  static createRotationXMatrix(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    // prettier-ignore
    return new Matrix4(
      1, 0, 0, 0,
      0, c, -s, 0,
      0, s, c, 0,
      0, 0, 0, 1
    );
  }
  static createRotationYMatrix(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    // prettier-ignore
    return new Matrix4(
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1
    );
  }

  static createRotationZMatrix(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    // prettier-ignore
    return new Matrix4(
      c, -s, 0, 0,
      s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
  }

  rotateX(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    this.m11 += c;
    this.m12 += -s;
    this.m21 += s;
    this.m22 += c;
    return this;
  }

  rotateY(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    this.m00 += c;
    this.m02 += -s;
    this.m20 += s;
    this.m22 += c;
    return this;
  }

  rotateZ(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    this.m00 += c;
    this.m01 += -s;
    this.m10 += s;
    this.m11 += c;
    return this;
  }

  static createScalingMatrix(s) {
    // prettier-ignore
    return new Matrix4(
      s.x, 0, 0, 0,
      0, s.y, 0, 0,
      0, 0, s.z, 0,
      0, 0, 0, 1
    );
  }

  scale(s) {
    this.m00 *= s.x;
    this.m11 *= s.y;
    this.m22 *= s.z;
    return this;
  }

  // 右手座標系での方向ベクトル
  // inverseされることでviewMatrixとして使う
  static createLookAtCameraMatrix(eye, center, up) {
    // f: 実際のforwardとは逆なことに注意. inverseされるため
    const f = Vector3.subVectors(eye, center).normalize();
    const r = Vector3.crossVectors(up.normalize(), f).normalize();
    const u = Vector3.crossVectors(f, r);
    // prettier-ignore
    return new Matrix4(
      r.x, r.y, r.z, 0,
      u.x, u.y, u.z, 0,
      f.x, f.y, f.z, 0,
      eye.x, eye.y, eye.z, 1
    );
  }

  getArray() {
    // prettier-ignore
    return [
      this.m00, this.m01, this.m02, this.m03,
      this.m10, this.m11, this.m12, this.m13,
      this.m20, this.m21, this.m22, this.m23,
      this.m30, this.m31, this.m32, this.m33
    ];
  }

  static cloneMatrix(m) {
    // prettier-ignore
    return new Matrix4(
      m.m00, m.m01, m.m02, m.m03,
      m.m10, m.m11, m.m12, m.m13,
      m.m20, m.m21, m.m22, m.m23,
      m.m30, m.m31, m.m32, m.m33
    );
  }

  clone() {
    return Matrix4.cloneMatrix(this);
  }

  copyFromMatrix(m) {
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

  copyToMatrix(m) {
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

  // AxB
  // れつオーダーなので B->Aでかける
  multiplyMatrix(targetMatrix) {
    const a = this.clone();
    const b = targetMatrix.clone();

    this.m00 = a.m00 * b.m00 + a.m01 * b.m10 + a.m02 * b.m20 + a.m03 * b.m30;
    this.m01 = a.m00 * b.m01 + a.m01 * b.m11 + a.m02 * b.m21 + a.m03 * b.m31;
    this.m02 = a.m00 * b.m02 + a.m01 * b.m12 + a.m02 * b.m22 + a.m03 * b.m32;
    this.m03 = a.m00 * b.m03 + a.m01 * b.m13 + a.m02 * b.m23 + a.m03 * b.m33;

    this.m10 = a.m10 * b.m00 + a.m11 * b.m10 + a.m12 * b.m20 + a.m13 * b.m30;
    this.m11 = a.m10 * b.m01 + a.m11 * b.m11 + a.m12 * b.m21 + a.m13 * b.m31;
    this.m12 = a.m10 * b.m02 + a.m11 * b.m12 + a.m12 * b.m22 + a.m13 * b.m32;
    this.m13 = a.m10 * b.m03 + a.m11 * b.m13 + a.m12 * b.m23 + a.m13 * b.m33;

    this.m21 = a.m20 * b.m01 + a.m21 * b.m11 + a.m22 * b.m21 + a.m23 * b.m31;
    this.m20 = a.m20 * b.m00 + a.m21 * b.m10 + a.m22 * b.m20 + a.m23 * b.m30;
    this.m22 = a.m20 * b.m02 + a.m21 * b.m12 + a.m22 * b.m22 + a.m23 * b.m32;
    this.m23 = a.m20 * b.m03 + a.m21 * b.m13 + a.m22 * b.m23 + a.m23 * b.m33;

    this.m30 = a.m30 * b.m00 + a.m31 * b.m10 + a.m32 * b.m20 + a.m33 * b.m30;
    this.m31 = a.m30 * b.m01 + a.m31 * b.m11 + a.m32 * b.m21 + a.m33 * b.m31;
    this.m32 = a.m30 * b.m02 + a.m31 * b.m12 + a.m32 * b.m22 + a.m33 * b.m32;
    this.m33 = a.m30 * b.m03 + a.m31 * b.m13 + a.m32 * b.m23 + a.m33 * b.m33;
    return this;
  }

  static multiplyMatrices(...matrices) {
    const m = Matrix4.identity();

    for (let i = matrices.length - 1; i >= 0; i--) {
      m.multiplyMatrix(matrices[i]);
    }

    return m;
  }

  transpose() {
    const tmpM = this.clone();
    this.m00 = tmpM.m00;
    this.m01 = tmpM.m10;
    this.m02 = tmpM.m20;
    this.m03 = tmpM.m30;
    this.m10 = tmpM.m01;
    this.m11 = tmpM.m11;
    this.m12 = tmpM.m21;
    this.m13 = tmpM.m31;
    this.m20 = tmpM.m02;
    this.m21 = tmpM.m12;
    this.m22 = tmpM.m22;
    this.m23 = tmpM.m32;
    this.m30 = tmpM.m03;
    this.m31 = tmpM.m13;
    this.m32 = tmpM.m23;
    this.m33 = tmpM.m33;
    return this;
  }

  // ref: https://github.com/gregtatum/mdn-model-view-projection/blob/master/shared/matrices.js
  inverse() {
    // Adapted from: https://github.com/mrdoob/three.js/blob/master/src/math/Matrix4.js

    // Performance note: Try not to allocate memory during a loop. This is done here
    // for the ease of understanding the code samples.
    const result = [];

    const n11 = this.m00,
      n12 = this.m10,
      n13 = this.m20,
      n14 = this.m30;
    const n21 = this.m01,
      n22 = this.m11,
      n23 = this.m21,
      n24 = this.m31;
    const n31 = this.m02,
      n32 = this.m12,
      n33 = this.m22,
      n34 = this.m32;
    const n41 = this.m03,
      n42 = this.m13,
      n43 = this.m23,
      n44 = this.m33;

    result[0] =
      n23 * n34 * n42 -
      n24 * n33 * n42 +
      n24 * n32 * n43 -
      n22 * n34 * n43 -
      n23 * n32 * n44 +
      n22 * n33 * n44;
    result[4] =
      n14 * n33 * n42 -
      n13 * n34 * n42 -
      n14 * n32 * n43 +
      n12 * n34 * n43 +
      n13 * n32 * n44 -
      n12 * n33 * n44;
    result[8] =
      n13 * n24 * n42 -
      n14 * n23 * n42 +
      n14 * n22 * n43 -
      n12 * n24 * n43 -
      n13 * n22 * n44 +
      n12 * n23 * n44;
    result[12] =
      n14 * n23 * n32 -
      n13 * n24 * n32 -
      n14 * n22 * n33 +
      n12 * n24 * n33 +
      n13 * n22 * n34 -
      n12 * n23 * n34;
    result[1] =
      n24 * n33 * n41 -
      n23 * n34 * n41 -
      n24 * n31 * n43 +
      n21 * n34 * n43 +
      n23 * n31 * n44 -
      n21 * n33 * n44;
    result[5] =
      n13 * n34 * n41 -
      n14 * n33 * n41 +
      n14 * n31 * n43 -
      n11 * n34 * n43 -
      n13 * n31 * n44 +
      n11 * n33 * n44;
    result[9] =
      n14 * n23 * n41 -
      n13 * n24 * n41 -
      n14 * n21 * n43 +
      n11 * n24 * n43 +
      n13 * n21 * n44 -
      n11 * n23 * n44;
    result[13] =
      n13 * n24 * n31 -
      n14 * n23 * n31 +
      n14 * n21 * n33 -
      n11 * n24 * n33 -
      n13 * n21 * n34 +
      n11 * n23 * n34;
    result[2] =
      n22 * n34 * n41 -
      n24 * n32 * n41 +
      n24 * n31 * n42 -
      n21 * n34 * n42 -
      n22 * n31 * n44 +
      n21 * n32 * n44;
    result[6] =
      n14 * n32 * n41 -
      n12 * n34 * n41 -
      n14 * n31 * n42 +
      n11 * n34 * n42 +
      n12 * n31 * n44 -
      n11 * n32 * n44;
    result[10] =
      n12 * n24 * n41 -
      n14 * n22 * n41 +
      n14 * n21 * n42 -
      n11 * n24 * n42 -
      n12 * n21 * n44 +
      n11 * n22 * n44;
    result[14] =
      n14 * n22 * n31 -
      n12 * n24 * n31 -
      n14 * n21 * n32 +
      n11 * n24 * n32 +
      n12 * n21 * n34 -
      n11 * n22 * n34;
    result[3] =
      n23 * n32 * n41 -
      n22 * n33 * n41 -
      n23 * n31 * n42 +
      n21 * n33 * n42 +
      n22 * n31 * n43 -
      n21 * n32 * n43;
    result[7] =
      n12 * n33 * n41 -
      n13 * n32 * n41 +
      n13 * n31 * n42 -
      n11 * n33 * n42 -
      n12 * n31 * n43 +
      n11 * n32 * n43;
    result[11] =
      n13 * n22 * n41 -
      n12 * n23 * n41 -
      n13 * n21 * n42 +
      n11 * n23 * n42 +
      n12 * n21 * n43 -
      n11 * n22 * n43;
    result[15] =
      n12 * n23 * n31 -
      n13 * n22 * n31 +
      n13 * n21 * n32 -
      n11 * n23 * n32 -
      n12 * n21 * n33 +
      n11 * n22 * n33;

    const determinant =
      n11 * result[0] + n21 * result[4] + n31 * result[8] + n41 * result[12];

    if (determinant === 0) {
      throw new Error("Can't invert matrix, determinant is 0");
    }

    for (let i = 0; i < result.length; i++) {
      result[i] /= determinant;
    }

    this.m00 = result[0];
    this.m01 = result[1];
    this.m02 = result[2];
    this.m03 = result[3];
    this.m10 = result[4];
    this.m11 = result[5];
    this.m12 = result[6];
    this.m13 = result[7];
    this.m20 = result[8];
    this.m21 = result[9];
    this.m22 = result[10];
    this.m23 = result[11];
    this.m30 = result[12];
    this.m31 = result[13];
    this.m32 = result[14];
    this.m33 = result[15];

    return this;
  }

  // ref: https://marina.sys.wakayama-u.ac.jp/~tokoi/?date=20090829
  static getOrthographicMatrix(left, right, bottom, top, near, far) {
    const m00 = 2 / (right - left);
    const m11 = 2 / (top - bottom);
    const m22 = -2 / (far - near);
    const m30 = -(right + left) / (right - left);
    const m31 = -(top + bottom) / (top - bottom);
    const m32 = -(far + near) / (far - near);
    // prettier-ignore
    return new Matrix4(
      m00, 0, 0, 0,
      0, m11 , 0, 0,
      0, 0, m22, 0,
      m30, m31, m32, 1,
    );
  }

  // fov ... rad
  // aspect ... w / h
  static getPerspectiveMatrix(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);

    const pjm = Matrix4.identity();

    pjm.m00 = f / aspect; // aspect ... w / h
    pjm.m01 = 0;
    pjm.m02 = 0;
    pjm.m03 = 0;
    pjm.m10 = 0;
    pjm.m11 = f;
    pjm.m12 = 0;
    pjm.m13 = 0;
    pjm.m20 = 0;
    pjm.m21 = 0;
    pjm.m22 = (far + near) * nf;
    pjm.m23 = -1;
    pjm.m30 = 0;
    pjm.m31 = 0;
    pjm.m32 = 2 * far * near * nf;
    pjm.m33 = 0;

    return pjm;
  }
}
