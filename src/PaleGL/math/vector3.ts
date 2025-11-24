import {
    mat4m00,
    mat4m01,
    mat4m02,
    mat4m03,
    mat4m10,
    mat4m11,
    mat4m12,
    mat4m13,
    mat4m20,
    mat4m21,
    mat4m22,
    mat4m23,
    Matrix4,
} from '@/PaleGL/math/matrix4.ts';

// [x, y, z]
export type RawVector3 = [number, number, number];

// Array indices for RawVector3
export const RAW_VECTOR3_X_INDEX = 0;
export const RAW_VECTOR3_Y_INDEX = 1;
export const RAW_VECTOR3_Z_INDEX = 2;

export const createVector3FromRaw = (raw: RawVector3) => {
    return createVector3(raw[RAW_VECTOR3_X_INDEX], raw[RAW_VECTOR3_Y_INDEX], raw[RAW_VECTOR3_Z_INDEX]);
};

// export const createVector3Zero = () => new Vector3(0, 0, 0);

export type Vector3 = Float32Array;

export const createVector3 = (x: number, y: number, z: number): Vector3 => {
    return new Float32Array([x, y, z]);
};

export const v3x = (v: Vector3) => v[0];
export const v3y = (v: Vector3) => v[1];
export const v3z = (v: Vector3) => v[2];
export const setV3x = (v: Vector3, value: number) => (v[0] = value);
export const setV3y = (v: Vector3, value: number) => (v[1] = value);
export const setV3z = (v: Vector3, value: number) => (v[2] = value);
export const setV3 = (v: Vector3, x: number, y: number, z: number) => {
    setV3x(v, x);
    setV3y(v, y);
    setV3z(v, z);
};

export const v3forward = createVector3(0, 0, 1);

export const v3right = createVector3(1, 0, 0);

export const v3up = createVector3(0, 1, 0);

export const v3back = createVector3(0, 0, -1);

export const createForwardV3 = () => createVector3(0, 0, 1);

export const createRightV3 = () => createVector3(1, 0, 0);

export const createUpV3 = () => createVector3(0, 1, 0);

export const getVector3Magnitude = (v: Vector3) => {
    const eps = 0.0001;
    return Math.max(eps, Math.sqrt(v3x(v) * v3x(v) + v3y(v) * v3y(v) + v3z(v) * v3z(v)));
};

export const getVector3Distance = (v1: Vector3, v2: Vector3) => {
    const diffV = subVectorsV3(v2, v1);
    const mag = getVector3Magnitude(diffV);
    return mag;
};

export const copyVector3 = (toV: Vector3, fromV: Vector3) => {
    setV3(toV, v3x(fromV), v3y(fromV), v3z(fromV));
    return toV;
};

export const normalizeVector3 = (v: Vector3) => {
    // const eps = 0.0001;
    // const length = Math.max(eps, Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z));
    const mag = getVector3Magnitude(v);
    setV3(v, v3x(v) / mag, v3y(v) / mag, v3z(v) / mag);
    return v;
};

export const addVector3Scalar = (v: Vector3, s: number) => {
    setV3(v, v3x(v) + s, v3y(v) + s, v3z(v) + s);
    return v;
};

export const addVector3AndVector3 = (sv: Vector3, tv: Vector3) => {
    setV3(sv, v3x(sv) + v3x(tv), v3y(sv) + v3y(tv), v3z(sv) + v3z(tv));
    return sv;
};

export const subVector3AndScalar = (v: Vector3, s: number) => {
    setV3(v, v3x(v) - s, v3y(v) - s, v3z(v) - s);
    return v;
};

export const subVector3AndVector3 = (sv: Vector3, tv: Vector3) => {
    setV3(sv, v3x(sv) - v3x(tv), v3y(sv) - v3y(tv), v3z(sv) - v3z(tv));
    return sv;
};

export const subVectorsV3 = (v1: Vector3, v2: Vector3) => {
    return createVector3(v3x(v1) - v3x(v2), v3y(v1) - v3y(v2), v3z(v1) - v3z(v2));
};

export const subVectorsV3Ref = (refV: Vector3, v1: Vector3, v2: Vector3) => {
    const x = v3x(v1) - v3x(v2);
    const y = v3y(v1) - v3y(v2);
    const z = v3z(v1) - v3z(v2);
    setV3x(refV, x);
    setV3y(refV, y);
    setV3z(refV, z);
    return refV;
};

export const negateVector3 = (v: Vector3) => {
    setV3(v, -v3x(v), -v3y(v), -v3z(v));
    return v;
};

export const scaleVector3ByScalar = (v: Vector3, s: number) => {
    setV3(v, v3x(v) * s, v3y(v) * s, v3z(v) * s);
    return v;
};

export const scaleVector3ByVector3 = (sv: Vector3, tv: Vector3) => {
    setV3(sv, v3x(sv) * v3x(tv), v3y(sv) * v3y(tv), v3z(sv) * v3z(tv));
    return sv;
};

export const cloneVector3 = (v: Vector3) => {
    return createVector3(v3x(v), v3y(v), v3z(v));
};

export const multiplyVector3AndMatrix4 = (v: Vector3, m: Matrix4) => {
    const tmpX = v3x(v);
    const tmpY = v3y(v);
    const tmpZ = v3z(v);
    const tmpW = 1;
    const x = mat4m00(m) * tmpX + mat4m01(m) * tmpY + mat4m02(m) * tmpZ + mat4m03(m) * tmpW;
    const y = mat4m10(m) * tmpX + mat4m11(m) * tmpY + mat4m12(m) * tmpZ + mat4m13(m) * tmpW;
    const z = mat4m20(m) * tmpX + mat4m21(m) * tmpY + mat4m22(m) * tmpZ + mat4m23(m) * tmpW;
    // const w = m.m30 * tmpX + m.m31 * tmpY + m.m32 * tmpZ + m.m33 * tmpW;
    setV3(v, x, y, z);
    return v;
};

export const multiplyVector3AndVector3 = (v1: Vector3, v2: Vector3) => {
    return createVector3(v3x(v1) * v3x(v2), v3y(v1) * v3y(v2), v3z(v1) * v3z(v2));
};

export const equalsVector3 = (sv: Vector3, tv: Vector3) => {
    const eps = 0.0000001;
    // const flag = Math.abs(this.x - v.x) < eps && Math.abs(this.y - v.y) < eps && Math.abs(this.z - v.z) < eps;
    const flag =
        Math.abs(v3x(sv) - v3x(tv)) < eps && Math.abs(v3y(sv) - v3y(tv)) < eps && Math.abs(v3z(sv) - v3z(tv)) < eps;
    return flag;
};

export const dotVector3 = (sv: Vector3, tv: Vector3) => {
    // return this.x * v.x + this.y * v.y + this.z * v.z;
    return v3x(sv) * v3x(tv) + v3y(sv) * v3y(tv) + v3z(sv) * v3z(tv);
};

export const createVector3Zero = () => {
    return createVector3(0, 0, 0);
};

export const createVector3One = () => {
    return createVector3(1, 1, 1);
};

export const createVector3Up = () => {
    return createVector3(0, 1, 0);
};

export const createVector3Down = () => {
    return createVector3(0, -1, 0);
};

export const createVector3Back = () => {
    return createVector3(0, 0, -1);
};

export const createVector3Forward = () => {
    return createVector3(0, 0, 1);
};

export const createVector3Right = () => {
    return createVector3(1, 0, 0);
};

export const createVector3Left = () => {
    return createVector3(-1, 0, 0);
};

export const createVector3FromArray = (arr: number[]) => {
    return createVector3(arr[0], arr[1], arr[2]);
};

export const addVector3Array = (...vectors: Vector3[]) => {
    const v = createVector3Zero();
    vectors.forEach((e) => {
        setV3(v, v3x(v) + v3x(e), v3y(v) + v3y(e), v3z(v) + v3z(e));
    });
    return v;
};

// v2 -> v1
export const vector3SubVector3 = (v1: Vector3, v2: Vector3) => {
    return createVector3(v3x(v1) - v3x(v2), v3y(v1) - v3y(v2), v3z(v1) - v3z(v2));
};
export const vector3SubVector3Ref = (rv: Vector3, v1: Vector3, v2: Vector3) => {
    setV3x(rv, v3x(v1) - v3x(v2));
    setV3y(rv, v3y(v1) - v3y(v2));
    setV3z(rv, v3z(v1) - v3z(v2));
    return rv;
};

// v1 x v2
export const crossVectorsV3 = (v1: Vector3, v2: Vector3) => {
    // return new Vector3(
    //   v1.y * v2.z - v1.z * v2.y,
    //   v1.z * v2.x - v1.x * v2.z,
    //   v1.x * v2.y - v1.y * v2.x
    // );
    return createVector3(
        v3y(v1) * v3z(v2) - v3z(v1) * v3y(v2),
        v3z(v1) * v3x(v2) - v3x(v1) * v3z(v2),
        v3x(v1) * v3y(v2) - v3y(v1) * v3x(v2)
    );
};

export const createRotateVector3DegreeX = (v: Vector3, degree: number) => {
    const x = v3x(v);
    const y = v3y(v);
    const z = v3z(v);
    const rad = (degree / 180) * Math.PI;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const rx = x;
    const ry = y * c + z * -s;
    const rz = y * s + z * c;
    return createVector3(rx, ry, rz);
};

export const createRotateVector3DegreeY = (v: Vector3, degree: number) => {
    const x = v3x(v);
    const y = v3y(v);
    const z = v3z(v);
    const rad = (degree / 180) * Math.PI;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const rx = x * c + z * s;
    const ry = y;
    const rz = x * -s + z * c;
    return createVector3(rx, ry, rz);
};

export const createRotateVector3DegreeZ = (v: Vector3, degree: number) => {
    const x = v3x(v);
    const y = v3y(v);
    const z = v3z(v);
    const rad = (degree / 180) * Math.PI;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const rx = x * c + y * -s;
    const ry = x * s + y * s;
    const rz = z;
    return createVector3(rx, ry, rz);
};

// TODO: かなり簡易的なtangentで正確ではないのでちゃんと生成する
export const getVector3Tangent = (n: Vector3) => {
    if (equalsVector3(n, createVector3Up())) {
        return createVector3Right();
    }
    if (equalsVector3(n, createVector3Down())) {
        return createVector3Right();
    }
    return crossVectorsV3(n, createVector3Down());
};

export const getBinormalFromTangent = (t: Vector3, n: Vector3) => {
    return crossVectorsV3(t, negateVector3(cloneVector3(n)));
};

export const createVector3Fill = (value: number) => {
    return createVector3(value, value, value);
};

export const createVector3Inverse = (v: Vector3) => {
    return createVector3(1 / v3x(v), 1 / v3y(v), 1 / v3z(v));
};

export const lerpVector3 = (v1: Vector3, v2: Vector3, r: number) => {
    // return new Vector3(
    //   v1.x + (v2.x - v1.x) * r,
    //   v1.y + (v2.y - v1.y) * r,
    //   v1.z + (v2.z - v1.z) * r
    // );
    return createVector3(
        v3x(v1) + (v3x(v2) - v3x(v1)) * r,
        v3y(v1) + (v3y(v2) - v3y(v1)) * r,
        v3z(v1) + (v3z(v2) - v3z(v1)) * r
    );
};

export const averageVector3 = (...vectors: Vector3[]) => {
    if (vectors.length === 0) {
        return createVector3Zero();
    }
    const sum = vectors.reduce((acc, v) => addVector3AndVector3(acc, v), createVector3Zero());
    return scaleVector3ByScalar(sum, 1 / vectors.length);
};

export const eulerToRadianVector3 = (v: Vector3) => {
    return createVector3((v3x(v) / 180) * Math.PI, (v3y(v) / 180) * Math.PI, (v3z(v) / 180) * Math.PI);
};

export const eulerToRawRadianVector3 = (v: Vector3) => {
    return createVector3(v3x(v) / 180, v3y(v) / 180, v3z(v) / 180);
};

export const logVector3 = (v: Vector3) => {
    console.log(`--------------------
${v3x(v)}, ${v3y(v)}, ${v3z(v)}
--------------------`);
};
