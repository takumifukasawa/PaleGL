
import {
    copyQuaternion,
    createQuaternionFromEulerDegrees,
    createQuaternionIdentity,
    Quaternion,
    toEulerDegreeFromQuaternion,
    toEulerRadianFromQuaternion,
} from '@/PaleGL/math/quaternion.ts';
import { Matrix4 } from '@/PaleGL/math/matrix4.ts';
import { v3x, v3y, v3z, Vector3 } from '@/PaleGL/math/vector3.ts';

export type Rotator = {
    rawMatrix: Matrix4 | null;
    quaternion: Quaternion;
};

// TODO: quaternion対応
export const createRotator = (q: Quaternion) => {
    // x, y, z axes
    // そのままdegreeが入る
    // elements: Float32Array = new Float32Array(3);
    const rawMatrix: Matrix4 | null = null;
    const quaternion: Quaternion = q;

    return {
        rawMatrix,
        quaternion
    }
}

export const getRotatorRawMatrix = (rotator: Rotator) => {
    return rotator.rawMatrix;
}

export const setRotatorRawMatrix = (rotator: Rotator, m: Matrix4 | null) => {
    rotator.rawMatrix = m;
}

export const getRotatorQuaternion = (rotator: Rotator) => {
    return rotator.quaternion;
}

// degree
export const getRotatorDegreeX = (rotator: Rotator) => {
    // return this.elements[0];
    return toEulerDegreeFromQuaternion(rotator.quaternion).x;
}

// degree
export const getRotatorDegreeY = (rotator: Rotator) => {
    // return this.elements[1];
    return toEulerDegreeFromQuaternion(rotator.quaternion).y;
}

// degree
export const getRotatorDegreeZ = (rotator: Rotator) => {
    // return this.elements[2];
    return toEulerDegreeFromQuaternion(rotator.quaternion).z;
}

// degree
export const setRotatorDegreeX = (rotator: Rotator, v: number) => {
    // this.elements[0] = v;
    const euler = toEulerDegreeFromQuaternion(rotator.quaternion);
    euler.x = v;
    const q = createQuaternionFromEulerDegrees(euler.x, euler.y, euler.z);
    rotator.quaternion = q;
}

// degree
export const setRotatorDegreeY = (rotator: Rotator, v: number) => {
    // this.elements[1] = v;
    const euler = toEulerDegreeFromQuaternion(rotator.quaternion);
    euler.y = v;
    const q = createQuaternionFromEulerDegrees(euler.x, euler.y, euler.z);
    rotator.quaternion = q;
}

// degree
export const setRotatorDegreeZ = (rotator: Rotator, v: number) => {
    // this.elements[2] = v;
    const euler = toEulerDegreeFromQuaternion(rotator.quaternion);
    euler.z = v;
    const q = createQuaternionFromEulerDegrees(euler.x, euler.y, euler.z);
    rotator.quaternion = q;
}

// degree
export const getRotatorDegreeRoll = (rotator: Rotator) => {
    // return this.elements[2];
    const euler = toEulerDegreeFromQuaternion(rotator.quaternion);
    return euler.z;
}

// degree
export const getRotatorDegreePitch = (rotator: Rotator) => {
    // return this.elements[0];
    const euler = toEulerDegreeFromQuaternion(rotator.quaternion);
    return euler.x;
}

// degree
export const getRotatorDegreeYaw = (rotator: Rotator) => {
    // return this.elements[1];
    const euler = toEulerDegreeFromQuaternion(rotator.quaternion);
    return euler.y;
}

// degree
// getAxesDegrees() {
//     return {
//         x: this.elements[0],
//         y: this.elements[1],
//         z: this.elements[2],
//     };
// }

export const getRotatorAxesRadians = (rotator: Rotator) => {
    // return {
    //     x: (this.elements[0] * Math.PI) / 180,
    //     y: (this.elements[1] * Math.PI) / 180,
    //     z: (this.elements[2] * Math.PI) / 180,
    // };
    const radian = toEulerRadianFromQuaternion(rotator.quaternion);
    return {
        x: radian.x,
        y: radian.y,
        z: radian.z,
    };
}

// degrees
// constructor(x: number, y: number, z: number) {
//     this.set(x, y, z);
//     this._updateQuaternionFromEulerDegrees();
// }

export const setRotatorEulerDegree = (rotator: Rotator, x: number, y: number, z: number) => {
    // const q = Quaternion.fromEulerDegrees(x, y, z);
    // this.elements = new Float32Array([x, y, z]);
    // this._updateQuaternionFromEulerDegrees();
    // return this;

    const q = createQuaternionFromEulerDegrees(x, y, z);
    rotator.quaternion = q;
    // this._updateQuaternionFromEulerDegrees();
    return rotator;
}

export const setRotatorEulerDegreesV = (rotator: Rotator, v: Vector3) => {
    // this.elements = new Float32Array([v.x, v.y, v.z]);
    // this._updateQuaternionFromEulerDegrees();
    // return this;

    // this.elements = new Float32Array([v.x, v.y, v.z]);
    const q = createQuaternionFromEulerDegrees(v3x(v), v3y(v), v3z(v));
    rotator.quaternion = q;
    return rotator;
}

export const copyRotator = (sr: Rotator, tr: Rotator) => {
    // this.set(r.x, r.y, r.z);
    // this._updateQuaternionFromEulerDegrees();
    // return this;

    copyQuaternion(sr.quaternion, tr.quaternion);
    return sr;
}

// setRadian(x: number, y: number, z: number) {
//     const r = Rotator.fromRadian(x, y, z);
//     this._updateQuaternionFromEulerDegrees();
//     return this.copy(r);
// }

export const createRotatorZero = () => {
    // return new Rotator(0, 0, 0);

    const q = createQuaternionFromEulerDegrees(0, 0, 0);
    return createRotator(q);
}

export const setRotatorRotationDegreeX = (rotator: Rotator, degree: number) => {
    //this.elements[0] = degree;
    //this._updateQuaternionFromEulerDegrees();

    const euler = toEulerDegreeFromQuaternion(rotator.quaternion);
    euler.x = degree;
    const q = createQuaternionFromEulerDegrees(euler.x, euler.y, euler.z);
    rotator.quaternion = q;
}

export const setRotatorRotationDegreeY = (rotator: Rotator, degree: number) => {
    // this.elements[1] = degree;
    // this._updateQuaternionFromEulerDegrees();

    const euler = toEulerDegreeFromQuaternion(rotator.quaternion);
    euler.y = degree;
    const q = createQuaternionFromEulerDegrees(euler.x, euler.y, euler.z);
    rotator.quaternion = q;
}

export const setRotatorRotationDegreeZ = (rotator:Rotator, degree: number) => {
    // this.elements[2] = degree;
    // this._updateQuaternionFromEulerDegrees();

    const euler = toEulerDegreeFromQuaternion(rotator.quaternion);
    euler.z = degree;
    const q = createQuaternionFromEulerDegrees(euler.x, euler.y, euler.z);
    rotator.quaternion = q;
}

export const invertRotator = (sr: Rotator) => {
    // const x = (this.x + 180) % 360;
    // const y = (this.y + 180) % 360;
    // const z = (this.z + 180) % 360;
    // const rotator = Rotator.zero.set(x, y, z);
    // return rotator;

    const x = (getRotatorDegreeX(sr) + 180) % 360;
    const y = (getRotatorDegreeY(sr) + 180) % 360;
    const z = (getRotatorDegreeZ(sr) + 180) % 360;
    const q = createQuaternionFromEulerDegrees(x, y, z);
    const rotator = createRotator(q);
    return rotator;
}

// static fromRadian(x: number, y: number, z: number) {
//     const rotator = Rotator.zero.set((x * 180) / Math.PI, (y * 180) / Math.PI, (z * 180) / Math.PI);
//     return rotator;
// }

// static fromDegree(x: number, y: number,z: number) {
//     return new Rotator(x, y, z);
// }

export const createRotatorFromQuaternion = (q: Quaternion) => {
    // const euler = q.toEulerDegree();
    // return new Rotator(euler.x, euler.y, euler.z);

    return createRotator(q);
}

// TODO: quaternion-bug: gltfのquaternionからdegreeを複合するところのバグの回避のため使ってる関数なので本当はよくない
export const createRotatorFromMatrix4 = (m: Matrix4) => {
    // const r = new Rotator(0, 0, 0);
    // r.rawMatrix = m;
    // return r;

    const q = createQuaternionIdentity();
    const r = createRotator(q);
    setRotatorRawMatrix(r, m);
    return r;
}

export const cloneRotator = (rotator: Rotator) => {
    // return new Rotator(this.x, this.y, this.z);
    return createRotator(rotator.quaternion);
}
