﻿import {
    createForwardV3,
    createRightV3,
    createUpV3,
    createVector3,
    createVector3One,
    createVector3Up,
    createVector3Zero,
    multiplyVector3AndMatrix4,
    normalizeVector3,
    setV3x,
    setV3y,
    setV3z,
    Vector3,
} from '@/PaleGL/math/vector3.ts';
import {
    assignMat4Identity,
    cloneMat4,
    createLookAtMatrix,
    createMat4Identity,
    createScalingMatrix,
    createTranslationMatrix,
    invertMat4,
    mat4m00,
    mat4m01,
    mat4m02,
    mat4m10,
    mat4m11,
    mat4m12,
    mat4m20,
    mat4m21,
    mat4m22,
    Matrix4,
    multiplyMat4Array,
    multiplyMat4ArrayRef, multiplyScalingMatrix, multiplyTranslationMatrix,
    transposeMat4,
} from '@/PaleGL/math/matrix4.ts';
import { ActorTypes } from '@/PaleGL/constants.js';
import {
    createRotatorZero,
    Rotator,
    setRotatorRotationDegreeX,
    setRotatorRotationDegreeY,
    setRotatorRotationDegreeZ,
} from '@/PaleGL/math/rotator.ts';
import {createRotationMatrixFromQuaternion, multiplyRotationMatrixFromQuaternion} from '@/PaleGL/math/quaternion.ts';
import { Actor } from '@/PaleGL/actors/actor.ts';
// import { Camera } from '@/PaleGL/actors/cameras.ts';

// TODO:
// - 外側から各種propertyを取得するときはmatrix更新した方がいい？
// - NodeBaseを継承
// - dirtyNeedsUpdate flag
// export class Transform {
//     _actor: Actor;
//     _inverseWorldMatrix: Matrix4 = Matrix4.identity;
//     _worldMatrix: Matrix4 = Matrix4.identity;
//     _localMatrix: Matrix4 = Matrix4.identity;
//     _position: Vector3 = Vector3.zero;
//     _rotation: Rotator = Rotator.zero; // degree vector
//     _scale: Vector3 = Vector3.one;
//
//     // どっちかだけセットされるようにする
//     _lookAtTarget: Vector3 | null = null; // world v
//     _lookAtTargetActor: Actor | null = null;
//
//     _normalMatrix: Matrix4 = Matrix4.identity;
//
//     // get childCount() {
//     //     return this.children.length;
//     // }
//
//     // get hasChild() {
//     //     return this.childCount > 0;
//     // }
//
//     get position() {
//         return this._position;
//     }
//
//     set position(v: Vector3) {
//         this._position = v;
//     }
//
//     get rotation() {
//         return this._rotation;
//     }
//
//     set rotation(v: Rotator) {
//         this._rotation = v;
//     }
//
//     get scale() {
//         return this._scale;
//     }
//
//     set scale(v: Vector3) {
//         this._scale = v;
//     }
//
//     get inverseWorldMatrix() {
//         return this._inverseWorldMatrix;
//     }
//
//     get worldMatrix() {
//         return this._worldMatrix;
//     }
//
//     get normalMatrix() {
//         return this._normalMatrix;
//     }
//
//     get localMatrix() {
//         return this._localMatrix;
//     }
//
//     get worldPosition() {
//         return this._worldMatrix.position;
//     }
//
//     getWorldScale() {
//         return this._worldMatrix.getScale();
//     }
//
//     get worldRight() {
//         return new Vector3(this._worldMatrix.m00, this._worldMatrix.m10, this._worldMatrix.m20).normalize();
//     }
//
//     get worldUp() {
//         return new Vector3(this._worldMatrix.m01, this._worldMatrix.m11, this._worldMatrix.m21).normalize();
//     }
//
//     get worldForward() {
//         return new Vector3(this._worldMatrix.m02, this._worldMatrix.m12, this._worldMatrix.m22).normalize();
//     }
//
//     constructor(actor: Actor) {
//         this._actor = actor;
//     }
//
//     // addChild(child: Transform) {
//     //     this.children.push(child);
//     // }
//     // addChild(child: Actor) {
//     //     this.children.push(child);
//     // }
//
//     // TODO: 引数でworldMatrixとdirty_flagを渡すべきな気がする
//     $updateMatrix() {
//         if (this._lookAtTarget || this._lookAtTargetActor) {
//             // どっちかはあるのでキャストしちゃう
//             const lookAtTarget = (
//                 this._lookAtTargetActor ? this._lookAtTargetActor.transform.position : this._lookAtTarget
//             ) as Vector3;
//             // TODO:
//             // - up vector 渡せるようにする
//             // - parentがあるとlookatの方向が正しくなくなるので親の回転を打ち消す必要がある
//             const lookAtMatrix =
//                 this._actor.type === ActorTypes.Camera
//                     ? Matrix4.getLookAtMatrix(this.position, lookAtTarget, Vector3.up, true)
//                     : Matrix4.getLookAtMatrix(this.position, lookAtTarget);
//             const scalingMatrix = Matrix4.scalingMatrix(this.scale);
//             this._localMatrix = Matrix4.multiplyMatrices(lookAtMatrix, scalingMatrix);
//         } else {
//             const translationMatrix = Matrix4.translationMatrix(this.position);
//             // eulerから回転行列を作る場合
//             // // roll(Z), pitch(X), yaw(Y)
//             // const rotationAxes = this.rotation.getAxesDegrees();
//             // const rotationXMatrix = Matrix4.rotationXMatrix((rotationAxes.x / 180) * Math.PI);
//             // const rotationYMatrix = Matrix4.rotationYMatrix((rotationAxes.y / 180) * Math.PI);
//             // const rotationZMatrix = Matrix4.rotationZMatrix((rotationAxes.z / 180) * Math.PI);
//             // const rotationMatrix = Matrix4.multiplyMatrices(rotationYMatrix, rotationXMatrix, rotationZMatrix);
//             // quaternionから回転を作るケース
//             const rotationMatrix = this.rotation.quaternion.toRotationMatrix();
//             const scalingMatrix = Matrix4.scalingMatrix(this.scale);
//             this._localMatrix = Matrix4.multiplyMatrices(translationMatrix, rotationMatrix, scalingMatrix);
//         }
//         this._worldMatrix = this._actor.parent
//             ? Matrix4.multiplyMatrices(this._actor.parent.transform.worldMatrix, this._localMatrix)
//             : this._localMatrix;
//         this._inverseWorldMatrix = this._worldMatrix.clone().invert();
//
//         this._normalMatrix = this._worldMatrix.clone().invert().transpose();
//     }
//
//     setScaling(s: Vector3) {
//         this._scale = s;
//     }
//
//     setRotationX(degree: number) {
//         this.rotation.setRotationX(degree);
//     }
//
//     setRotationY(degree: number) {
//         this.rotation.setRotationY(degree);
//     }
//
//     setRotationZ(degree: number) {
//         this.rotation.setRotationZ(degree);
//     }
//
//     setTranslation(v: Vector3) {
//         this._position = v;
//     }
//
//     lookAt(lookAtTarget: Vector3 | null) {
//         this._lookAtTarget = lookAtTarget;
//         this._lookAtTargetActor = null;
//     }
//
//     lookAtActor(actor: Actor | null) {
//         this._lookAtTargetActor = actor;
//         this._lookAtTarget = null;
//     }
//
//     // TODO: Cameraに持たせた方がいい気がする
//     // getPositionInScreen(cameras: Camera) {
//     //     const matInProjection = Matrix4.multiplyMatrices(cameras.projectionMatrix, cameras.viewMatrix, this._worldMatrix);
//     //     const clipPosition = matInProjection.position;
//     //     const w = matInProjection.m33 === 0 ? 0.0001 : matInProjection.m33; // TODO: cheap NaN fallback
//     //     return new Vector3(clipPosition.x / w, clipPosition.y / w, clipPosition.z / w);
//     //     // console.log("--------")
//     //     // this._worldMatrix.position.log();
//     //     // cameras.viewMatrix.position.log();
//     //     // v.log();
//     // }
//
//     localPointToWorld(p: Vector3) {
//         return p.multiplyMatrix4(this.worldMatrix);
//     }
//
//     worldToLocalPoint(p: Vector3) {
//         return p.multiplyMatrix4(this.inverseWorldMatrix);
//     }
// }

export type Transform = {
    inverseWorldMatrix: Matrix4;
    worldMatrix: Matrix4;
    localMatrix: Matrix4;
    position: Vector3;
    rotation: Rotator;
    scale: Vector3;
    lookAtTarget: Vector3 | null;
    lookAtTargetActor: Actor | null;
    normalMatrix: Matrix4;
    // TODO: engineでちゃんと更新されるようにする
    forward: Vector3;
    up: Vector3;
    right: Vector3;
};

export function createTransform() {
    // let _actor: Actor | null = actor;

    const inverseWorldMatrix = createMat4Identity();
    const worldMatrix: Matrix4 = createMat4Identity();
    const localMatrix: Matrix4 = createMat4Identity();
    const position: Vector3 = createVector3Zero();
    const rotation: Rotator = createRotatorZero(); // degree vector
    const scale: Vector3 = createVector3One();
    // どっちかだけセットされるようにする
    const lookAtTarget: Vector3 | null = null; // world v
    const lookAtTargetActor: Actor | null = null;

    const normalMatrix: Matrix4 = createMat4Identity();

    // get childCount() {
    //     return this.children.length;
    // }

    // get hasChild() {
    //     return this.childCount > 0;
    //

    // const setActor = (actor: Actor) => {
    //     _actor = actor;
    // }

    // const updateMatrix = (actor: Actor) => {
    //     if (_lookAtTarget || _lookAtTargetActor) {
    //         // どっちかはあるのでキャストしちゃう
    //         const lookAtTarget = (
    //             _lookAtTargetActor ? _lookAtTargetActor.transform.getPosition() : _lookAtTarget
    //         ) as Vector3;
    //         // TODO:
    //         // - up vector 渡せるようにする
    //         // - parentがあるとlookatの方向が正しくなくなるので親の回転を打ち消す必要がある
    //         const lookAtMatrix =
    //             actor?.type === ActorTypes.Camera
    //                 ? Matrix4.getLookAtMatrix(_position, lookAtTarget, Vector3.up, true)
    //                 : Matrix4.getLookAtMatrix(_position, lookAtTarget);
    //         const scalingMatrix = Matrix4.scalingMatrix(_scale);
    //         _localMatrix = Matrix4.multiplyMatrices(lookAtMatrix, scalingMatrix);
    //     } else {
    //         const translationMatrix = Matrix4.translationMatrix(_position);
    //         // eulerから回転行列を作る場合
    //         // // roll(Z), pitch(X), yaw(Y)
    //         // const rotationAxes = this.rotation.getAxesDegrees();
    //         // const rotationXMatrix = Matrix4.rotationXMatrix((rotationAxes.x / 180) * Math.PI);
    //         // const rotationYMatrix = Matrix4.rotationYMatrix((rotationAxes.y / 180) * Math.PI);
    //         // const rotationZMatrix = Matrix4.rotationZMatrix((rotationAxes.z / 180) * Math.PI);
    //         // const rotationMatrix = Matrix4.multiplyMatrices(rotationYMatrix, rotationXMatrix, rotationZMatrix);
    //         // quaternionから回転を作るケース
    //         const rotationMatrix = _rotation.quaternion.toRotationMatrix();
    //         const scalingMatrix = Matrix4.scalingMatrix(_scale);
    //         _localMatrix = Matrix4.multiplyMatrices(translationMatrix, rotationMatrix, scalingMatrix);
    //     }
    //
    //     // TODO: parentがちゃんととれてないかも
    //
    //     _worldMatrix = actor?.parent
    //         ? Matrix4.multiplyMatrices(actor?.parent.transform.getWorldMatrix(), _localMatrix)
    //         : _localMatrix;
    //     _inverseWorldMatrix = _worldMatrix.clone().invert();
    //
    //     // // if (_actor?.parent) {
    //     // // }
    //     // console.log(`hogehoge - update matrix - name: ${actor?.name}, is started: ${actor?.isStarted}`);
    //     // console.log(`hogehoge - update matrix - name: ${actor?.name}`, actor, actor?.parent, _worldMatrix.e, _localMatrix.e);
    //     // console.log(`hogehoge - update matrix - name: ${actor?.name}`, actor?.transform.getWorldMatrix().e,  actor?.transform.getLocalMatrix().e);
    //     // // console.log(`hogehoge - update matrix - name: ${_actor?.name}, is started: ${_actor?.isStarted}, actor: ${_actor}, parent: ${_actor?.parent}, ${_worldMatrix.e}, ${_localMatrix.e}`);

    //     _normalMatrix = _worldMatrix.clone().invert().transpose();
    // };

    return {
        inverseWorldMatrix,
        worldMatrix,
        localMatrix,
        position,
        rotation,
        scale,
        lookAtTarget,
        lookAtTargetActor,
        normalMatrix,
        forward: createForwardV3(),
        up: createUpV3(),
        right: createRightV3(),
        // getPosition: () => _position,
        // setPosition: (p: Vector3) => (_position = p),
        // getRotation: () => _rotation,
        // setRotation: (r: Rotator) => (_rotation = r),
        // getScale: () => _scale,
        // setScale: (s: Vector3) => (_scale = s),
        // getInverseWorldMatrix: () => _inverseWorldMatrix,
        // getWorldMatrix: () => _worldMatrix,
        // getNormalMatrix: () => _normalMatrix,
        // getLocalMatrix: () => _localMatrix,
        // getWorldPosition: () => _worldMatrix.position,
        // getWorldScale: () => _worldMatrix.getScale(),
        // getWorldRight: () => new Vector3(_worldMatrix.m00, _worldMatrix.m10, _worldMatrix.m20).normalize(),
        // getWorldUp: () => new Vector3(_worldMatrix.m01, _worldMatrix.m11, _worldMatrix.m21).normalize(),
        // getWorldForward: () => new Vector3(_worldMatrix.m02, _worldMatrix.m12, _worldMatrix.m22).normalize(),

        // setScaling: (s: Vector3) => (_scale = s),
        // setRotationX: (degree: number) => _rotation.setRotationX(degree),
        // setRotationY: (degree: number) => _rotation.setRotationY(degree),
        // setRotationZ: (degree: number) => _rotation.setRotationZ(degree),
        // setTranslation: (v: Vector3) => (_position = v),
        // lookAt: (lookAtTarget: Vector3 | null) => {
        //     _lookAtTarget = lookAtTarget;
        //     _lookAtTargetActor = null;
        // },
        // lookAtActor: (actor: Actor | null) => {
        //     _lookAtTargetActor = actor;
        //     _lookAtTarget = null;
        // },
        // localPointToWorld: (p: Vector3) => p.multiplyMatrix4(_worldMatrix),
        // worldToLocalPoint: (p: Vector3) => p.multiplyMatrix4(_inverseWorldMatrix),

        // // getActor: () => _actor,
        // // setActor,
        // updateMatrix,
    };
}

export const getWorldRight = (transform: Transform) =>
    normalizeVector3(
        createVector3(mat4m00(transform.worldMatrix), mat4m10(transform.worldMatrix), mat4m20(transform.worldMatrix))
    );

export const getWorldUp = (transform: Transform) =>
    normalizeVector3(
        createVector3(mat4m01(transform.worldMatrix), mat4m11(transform.worldMatrix), mat4m21(transform.worldMatrix))
    );

// export const getWorldForward = (transform: Transform) =>
//     normalizeVector3(createVector3(mat4m02(transform.worldMatrix), mat4m12(transform.worldMatrix), mat4m22(transform.worldMatrix)));
export const getWorldForward = (transform: Transform) => {
    setV3x(transform.forward, mat4m02(transform.worldMatrix));
    setV3y(transform.forward, mat4m12(transform.worldMatrix));
    setV3z(transform.forward, mat4m22(transform.worldMatrix));
    return normalizeVector3(transform.forward);
};

export const setScaling = (transform: Transform, s: Vector3) => (transform.scale = s);

export const setRotationX = (transform: Transform, degree: number) =>
    setRotatorRotationDegreeX(transform.rotation, degree);
export const setRotationY = (transform: Transform, degree: number) =>
    setRotatorRotationDegreeY(transform.rotation, degree);
export const setRotationZ = (transform: Transform, degree: number) =>
    setRotatorRotationDegreeZ(transform.rotation, degree);
export const setTranslation = (transform: Transform, v: Vector3) => (transform.position = v);
export const setRotation = (transform: Transform, r: Rotator) => (transform.rotation = r);
export const setLookAtPosition = (transform: Transform, lookAtTarget: Vector3 | null) => {
    transform.lookAtTarget = lookAtTarget;
    transform.lookAtTargetActor = null;
};
export const setLookAtActor = (transform: Transform, actor: Actor | null) => {
    transform.lookAtTargetActor = actor;
    transform.lookAtTarget = null;
};
export const localPointToWorld = (transform: Transform, p: Vector3) =>
    multiplyVector3AndMatrix4(p, transform.worldMatrix);
export const worldToLocalPoint = (transform: Transform, p: Vector3) =>
    multiplyVector3AndMatrix4(p, transform.inverseWorldMatrix);

// getActor: () => _actor,
// setActor,
// updateMatrix,

export const updateActorTransformMatrix = (actor: Actor) => {
    if (actor.transform.lookAtTarget || actor.transform.lookAtTargetActor) {
        // どっちかはあるのでキャストしちゃう
        const lookAtTarget = (
            actor.transform.lookAtTargetActor
                ? actor.transform.lookAtTargetActor.transform.position
                : actor.transform.lookAtTarget
        ) as Vector3;
        // TODO:
        // - up vector 渡せるようにする
        // - parentがあるとlookatの方向が正しくなくなるので親の回転を打ち消す必要がある
        const lookAtMatrix =
            actor?.type === ActorTypes.Camera
                ? createLookAtMatrix(actor.transform.position, lookAtTarget, createVector3Up(), true)
                : createLookAtMatrix(actor.transform.position, lookAtTarget);
        const scalingMatrix = createScalingMatrix(actor.transform.scale);
        actor.transform.localMatrix = multiplyMat4ArrayRef(actor.transform.localMatrix, lookAtMatrix, scalingMatrix);
        // actor.transform.localMatrix = multiplyMat4Array(lookAtMatrix, scalingMatrix);
    } else {
        // tmp
        // const translationMatrix = createTranslationMatrix(actor.transform.position);
        // // eulerから回転行列を作る場合
        // // // roll(Z), pitch(X), yaw(Y)
        // // const rotationAxes = this.rotation.getAxesDegrees();
        // // const rotationXMatrix = Matrix4.rotationXMatrix((rotationAxes.x / 180) * Math.PI);
        // // const rotationYMatrix = Matrix4.rotationYMatrix((rotationAxes.y / 180) * Math.PI);
        // // const rotationZMatrix = Matrix4.rotationZMatrix((rotationAxes.z / 180) * Math.PI);
        // // const rotationMatrix = Matrix4.multiplyMatrices(rotationYMatrix, rotationXMatrix, rotationZMatrix);
        // // quaternionから回転を作るケース
        // const rotationMatrix = createRotationMatrixFromQuaternion(
        //     // actor.transform.localMatrix,
        //     actor.transform.rotation.quaternion
        // );
        // const scalingMatrix = createScalingMatrix(actor.transform.scale);
        // actor.transform.localMatrix = multiplyMat4ArrayRef(
        //     actor.transform.localMatrix,
        //     translationMatrix,
        //     rotationMatrix,
        //     scalingMatrix
        // );
        // // actor.transform.localMatrix = multiplyMat4ArrayRef(
        // //     actor.transform.localMatrix,
        // //     translationMatrix,
        // //     rotationMatrix,
        // //     scalingMatrix
        // // );

        assignMat4Identity(actor.transform.localMatrix);
        // 後ろからかける
        multiplyTranslationMatrix(actor.transform.localMatrix, actor.transform.position);
        multiplyRotationMatrixFromQuaternion(actor.transform.localMatrix, actor.transform.rotation.quaternion);
        multiplyScalingMatrix(actor.transform.localMatrix, actor.transform.scale);
    }

    // TODO: parentがちゃんととれてないかも

    actor.transform.worldMatrix = actor?.parent
        ? multiplyMat4Array(actor?.parent.transform.worldMatrix, actor.transform.localMatrix)
        : actor.transform.localMatrix;
    actor.transform.inverseWorldMatrix = invertMat4(cloneMat4(actor.transform.worldMatrix));

    // // if (_actor?.parent) {
    // // }
    // console.log(`hogehoge - update matrix - name: ${actor?.name}, is started: ${actor?.isStarted}`);
    // console.log(`hogehoge - update matrix - name: ${actor?.name}`, actor, actor?.parent, _worldMatrix.e, _localMatrix.e);
    // console.log(`hogehoge - update matrix - name: ${actor?.name}`, actor?.transform.getWorldMatrix().e,  actor?.transform.getLocalMatrix().e);
    // // console.log(`hogehoge - update matrix - name: ${_actor?.name}, is started: ${_actor?.isStarted}, actor: ${_actor}, parent: ${_actor?.parent}, ${_worldMatrix.e}, ${_localMatrix.e}`);

    actor.transform.normalMatrix = transposeMat4(invertMat4(cloneMat4(actor.transform.worldMatrix)));
};
