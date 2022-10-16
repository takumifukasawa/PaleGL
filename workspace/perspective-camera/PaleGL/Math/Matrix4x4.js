// row order
export class Matrix4x4 {
    elements;

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
        return new Matrix4x4(
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
        );
    }

    // https://developer.mozilla.org/ja/docs/Web/API/WebGL_API/WebGL_model_view_projection
    // fov ... rad
    // aspect ... w / h
    static getPerspectiveMatrix(fov, aspect, near, far) {
        const f = 1 / Math.tan(fov / 2);
        const nf = 1 / (near - far);

        const pjm = new Matrix4x4();

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
        pjm.elements[11] = -1;
        pjm.elements[12] = 0;
        pjm.elements[13] = 0;
        pjm.elements[14] = 2 * far * near * nf;
        pjm.elements[15] = 0;

        return pjm;
    }
}