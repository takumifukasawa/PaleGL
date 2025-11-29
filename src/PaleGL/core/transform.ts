import { Actor } from '@/PaleGL/actors/actor.ts';
import { ACTOR_TYPE_CAMERA } from '@/PaleGL/constants.js';
import {
    assignMat4Identity,
    createLookAtMatrixRef,
    createMat4Identity,
    invertMat4Ref,
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
    multiplyScalingMatrix,
    multiplyTranslationMatrix,
    transposeMat4,
} from '@/PaleGL/math/matrix4.ts';
import { multiplyRotationMatrixFromQuaternion } from '@/PaleGL/math/quaternion.ts';
import {
    createRotatorZero,
    Rotator,
    setRotatorRotationDegreeX,
    setRotatorRotationDegreeY,
    setRotatorRotationDegreeZ,
} from '@/PaleGL/math/rotator.ts';
import {
    cloneVector3,
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

export type Transform = {
    inverseWorldMatrix: Matrix4;
    worldMatrix: Matrix4;
    localMatrix: Matrix4;
    position: Vector3;
    rotation: Rotator;
    scale: Vector3;
    lookAtTarget: Vector3 | null;
    lookAtTargetOffset: Vector3;
    lookAtTargetActor: Actor | null;
    upVector: Vector3;
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
    const lookAtTargetOffset: Vector3 = createVector3Zero(); // world v
    const lookAtTargetActor: Actor | null = null;

    const normalMatrix: Matrix4 = createMat4Identity();

    return {
        inverseWorldMatrix,
        worldMatrix,
        localMatrix,
        position,
        rotation,
        scale,
        lookAtTarget,
        lookAtTargetOffset,
        lookAtTargetActor,
        upVector: createVector3Up(),
        normalMatrix,
        forward: createForwardV3(),
        up: createUpV3(),
        right: createRightV3(),
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
export const worldToLocalDir = (transform: Transform, dir: Vector3) =>
    multiplyVector3AndMatrix4(dir, transform.normalMatrix);

export const getWorldPosition = (transform: Transform) =>
    multiplyVector3AndMatrix4(cloneVector3(transform.position), transform.worldMatrix);

export const updateActorTransformMatrix = (actor: Actor) => {
    if (actor.transform.lookAtTarget || actor.transform.lookAtTargetActor) {
        // tmp
        // // どっちかはあるのでキャストしちゃう
        // const lookAtTarget = (
        //     actor.transform.lookAtTargetActor
        //         ? actor.transform.lookAtTargetActor.transform.position
        //         : actor.transform.lookAtTarget
        // ) as Vector3;
        // // TODO:
        // // - up vector 渡せるようにする
        // // - parentがあるとlookatの方向が正しくなくなるので親の回転を打ち消す必要がある
        // const lookAtMatrix =
        //     actor?.type === ActorTypes.Camera
        //         ? createLookAtMatrix(actor.transform.position, lookAtTarget, createVector3Up(), true)
        //         : createLookAtMatrix(actor.transform.position, lookAtTarget);
        // const scalingMatrix = createScalingMatrix(actor.transform.scale);
        // actor.transform.localMatrix = multiplyMat4ArrayRef(actor.transform.localMatrix, lookAtMatrix, scalingMatrix);
        // // actor.transform.localMatrix = multiplyMat4Array(lookAtMatrix, scalingMatrix);

        // どっちかはあるのでキャストしちゃう
        // const lookAtTarget = addVector3AndVector3(cloneVector3((
        //     actor.transform.lookAtTargetActor
        //         ? actor.transform.lookAtTargetActor.transform.position
        //         : actor.transform.lookAtTarget
        // ) as Vector3), actor.transform.lookAtTargetOffset);
        const lookAtTarget = (
            actor.transform.lookAtTargetActor
                ? actor.transform.lookAtTargetActor.transform.position
                : actor.transform.lookAtTarget
        ) as Vector3;
        // TODO:
        // - parentがあるとlookatの方向が正しくなくなるので親の回転を打ち消す必要がある
        assignMat4Identity(actor.transform.localMatrix);
        const lookAtMatrix =
            actor?.type === ACTOR_TYPE_CAMERA
                ? createLookAtMatrixRef(
                      actor.transform.localMatrix,
                      actor.transform.position,
                      lookAtTarget,
                      actor.transform.upVector,
                      true
                  )
                : createLookAtMatrixRef(
                      actor.transform.localMatrix,
                      actor.transform.position,
                      lookAtTarget,
                      actor.transform.upVector
                  );
        actor.transform.localMatrix = multiplyScalingMatrix(lookAtMatrix, actor.transform.scale);
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
    // actor.transform.inverseWorldMatrix = invertMat4(cloneMat4(actor.transform.worldMatrix));
    actor.transform.inverseWorldMatrix = invertMat4Ref(actor.transform.inverseWorldMatrix, actor.transform.worldMatrix);

    // // if (_actor?.parent) {
    // // }
    // console.log(`hogehoge - update matrix - name: ${actor?.name}, is started: ${actor?.isStarted}`);
    // console.log(`hogehoge - update matrix - name: ${actor?.name}`, actor, actor?.parent, _worldMatrix.e, _localMatrix.e);
    // console.log(`hogehoge - update matrix - name: ${actor?.name}`, actor?.transform.getWorldMatrix().e,  actor?.transform.getLocalMatrix().e);
    // // console.log(`hogehoge - update matrix - name: ${_actor?.name}, is started: ${_actor?.isStarted}, actor: ${_actor}, parent: ${_actor?.parent}, ${_worldMatrix.e}, ${_localMatrix.e}`);

    // actor.transform.normalMatrix = transposeMat4(invertMat4(cloneMat4(actor.transform.worldMatrix)));
    actor.transform.normalMatrix = transposeMat4(
        invertMat4Ref(actor.transform.normalMatrix, actor.transform.worldMatrix)
    );
};
