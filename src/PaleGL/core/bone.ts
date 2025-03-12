import { NodeBase, createNodeBase } from '@/PaleGL/core/nodeBase.ts';
import {
    cloneMat4, createMat4Identity,
    createScalingMatrix,
    createTranslationMatrix,
    invertMat4,
    Matrix4,
    multiplyMat4Array,
} from '@/PaleGL/math/matrix4.ts';
import { createRotatorZero, Rotator } from '@/PaleGL/math/rotator.ts';
import { createVector3One, createVector3Zero, Vector3 } from '@/PaleGL/math/vector3.ts';

// export class Bone extends NodeBase {
//     offsetMatrix: Matrix4 = Matrix4.identity; // 初期姿勢のボーンローカル座標
//     #poseMatrix: Matrix4 = Matrix4.identity; // 初期姿勢行列
//     #boneOffsetMatrix: Matrix4 = Matrix4.identity; // 初期姿勢行列の逆行列
//     #jointMatrix: Matrix4 = Matrix4.identity;
//     index: number;
//
//     position: Vector3 = Vector3.zero;
//     rotation: Rotator = Rotator.zero;
//     scale: Vector3 = Vector3.one;
//
//     get boneOffsetMatrix() {
//         return _boneOffsetMatrix;
//     }
//
//     get poseMatrix() {
//         return _poseMatrix;
//     }
//
//     get jointMatrix() {
//         return _jointMatrix;
//     }
//
//     constructor({ index, ...options }: { name: string; index: number }) {
//         super(options);
//         this.index = index;
//     }
//
//     calcBoneOffsetMatrix(parentBone?: Bone) {
//         _poseMatrix = parentBone
//             ? Matrix4.multiplyMatrices(parentBone.poseMatrix, _offsetMatrix)
//             : _offsetMatrix;
//
//         _boneOffsetMatrix = _poseMatrix.clone().invert();
//         nodeBase.getChildren().forEach((childBone) => (childBone as Bone).calcBoneOffsetMatrix(this));
//     }
//
//     calcJointMatrix(parentBone?: Bone) {
//         // console.log(this.index, _position.elements, _rotation.elements, this.scale.elements)
//         // console.log("[Bone.calcJointMatrix]", this.index, _rotation.elements)
//
//         // 1: update offset matrix
//         // TODO: quaternion-bug: 本当はこっちを使いたい
//         // _offsetMatrix = Matrix4.fromTRS(_position, _rotation, this.scale);
//         _offsetMatrix = Matrix4.multiplyMatrices(
//             Matrix4.translationMatrix(_position),
//             _rotation.rawMatrix!,
//             Matrix4.scalingMatrix(this.scale)
//         );
//
//         // 2: update joint matrix
//         _jointMatrix = parentBone
//             ? Matrix4.multiplyMatrices(parentBone.jointMatrix, _offsetMatrix)
//             : _offsetMatrix;
//
//         // NOTE: 無理やりpose状態にする時はこれを使う
//         // _jointMatrix = _boneOffsetMatrix.clone().invert();
//
//         nodeBase.getChildren().forEach((childBone) => (childBone as Bone).calcJointMatrix(this));
//     }
//
//     traverse(callback: (bone: Bone) => void) {
//         callback(this);
//         nodeBase.getChildren().forEach((child: unknown) => {
//             const c = child as Bone;
//             c.traverse(callback);
//         });
//     }
// }

export type Bone = NodeBase & {
    index: number;
    position: Vector3;
    rotation: Rotator;
    scale: Vector3;
    offsetMatrix: Matrix4;
    poseMatrix: Matrix4;
    boneOffsetMatrix: Matrix4;
    jointMatrix: Matrix4;
    // children: Bone[];
};

export const calcBoneOffsetMatrix = (childBone: Bone, parentBone?: Bone) => {
    childBone.poseMatrix = 
        parentBone
            ? multiplyMat4Array(parentBone.poseMatrix, childBone.offsetMatrix)
            : childBone.offsetMatrix

    childBone.boneOffsetMatrix = invertMat4(cloneMat4(childBone.poseMatrix));
    childBone.children.forEach((c) => calcBoneOffsetMatrix(c as Bone, childBone));
};

export const calcJointMatrix = (childBone: Bone, parentBone?: Bone) => {
    // console.log(this.index, _position.elements, _rotation.elements, this.scale.elements)
    // console.log("[Bone.calcJointMatrix]", this.index, _rotation.elements)

    // 1: update offset matrix
    // TODO: quaternion-bug: 本当はこっちを使いたい
    // _offsetMatrix = Matrix4.fromTRS(_position, _rotation, this.scale);
    childBone.offsetMatrix =
        multiplyMat4Array(
            createTranslationMatrix(childBone.position),
            childBone.rotation.rawMatrix!,
            createScalingMatrix(childBone.scale)
        );

    // 2: update joint matrix
    childBone.jointMatrix =
        parentBone
            ? multiplyMat4Array(parentBone.jointMatrix, childBone.offsetMatrix)
            : childBone.offsetMatrix;

    // NOTE: 無理やりpose状態にする時はこれを使う
    // _jointMatrix = _boneOffsetMatrix.clone().invert();

    childBone.children.forEach((c) => calcJointMatrix(c as Bone, childBone));
};

export const traverseBone = (selfBone: Bone, callback: (bone: Bone) => void) => {
    callback(selfBone);
    selfBone.children.forEach((child: unknown) => {
        const c = child as Bone;
        traverseBone(c, callback);
    });
};

export function createBone({ index, name }: { name: string; index: number }): Bone {
    const nodeBase = createNodeBase({ name });

    const offsetMatrix: Matrix4 = createMat4Identity(); // 初期姿勢のボーンローカル座標
    const poseMatrix: Matrix4 = createMat4Identity(); // 初期姿勢行列
    const boneOffsetMatrix: Matrix4 = createMat4Identity(); // 初期姿勢行列の逆行列
    const jointMatrix: Matrix4 = createMat4Identity();

    const position: Vector3 = createVector3Zero();
    const rotation: Rotator = createRotatorZero();
    const scale: Vector3 = createVector3One();

    return {
        ...nodeBase,
        index,
        position,
        rotation,
        scale,
        offsetMatrix,
        poseMatrix,
        boneOffsetMatrix,
        jointMatrix,
        // children: [],
    };
}
