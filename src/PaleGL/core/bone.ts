import { NodeBase, createNodeBase } from '@/PaleGL/core/nodeBase.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
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
    getIndex: () => number;
    getPosition: () => Vector3;
    setPosition: (position: Vector3) => void;
    getRotation: () => Rotator;
    setRotation: (rotation: Rotator) => void;
    getScale: () => Vector3;
    setScale: (scale: Vector3) => void;
    getOffsetMatrix: () => Matrix4;
    setOffsetMatrix: (matrix: Matrix4) => void;
    getBoneOffsetMatrix: () => Matrix4;
    setBoneOffsetMatrix: (matrix: Matrix4) => void;
    getPoseMatrix: () => Matrix4;
    setPoseMatrix: (matrix: Matrix4) => void;
    getJointMatrix: () => Matrix4;
    setJointMatrix: (matrix: Matrix4) => void;
    // calcJointMatrix: (parentBone?: Bone) => void;
    // calcBoneOffsetMatrix: (parentBone?: Bone) => void;
    // traverse: (callback: (bone: Bone) => void) => void;
};

export const calcBoneOffsetMatrix = (childBone: Bone, parentBone?: Bone) => {
    childBone.setPoseMatrix(
        parentBone
            ? Matrix4.multiplyMatrices(parentBone.getPoseMatrix(), childBone.getOffsetMatrix())
            : childBone.getOffsetMatrix()
    );

    childBone.setBoneOffsetMatrix(childBone.getPoseMatrix().clone().invert());
    childBone.getChildren().forEach((c) => calcBoneOffsetMatrix(c as Bone, childBone));
};

export const calcJointMatrix = (childBone: Bone, parentBone?: Bone) => {
    // console.log(this.index, _position.elements, _rotation.elements, this.scale.elements)
    // console.log("[Bone.calcJointMatrix]", this.index, _rotation.elements)

    // 1: update offset matrix
    // TODO: quaternion-bug: 本当はこっちを使いたい
    // _offsetMatrix = Matrix4.fromTRS(_position, _rotation, this.scale);
    childBone.setOffsetMatrix(
        Matrix4.multiplyMatrices(
            Matrix4.translationMatrix(childBone.getPosition()),
            childBone.getRotation().rawMatrix!,
            Matrix4.scalingMatrix(childBone.getScale())
        )
    );

    // 2: update joint matrix
    childBone.setJointMatrix(
        parentBone
            ? Matrix4.multiplyMatrices(parentBone.getJointMatrix(), childBone.getOffsetMatrix())
            : childBone.getOffsetMatrix()
    );

    // NOTE: 無理やりpose状態にする時はこれを使う
    // _jointMatrix = _boneOffsetMatrix.clone().invert();

    childBone.getChildren().forEach((c) => calcJointMatrix(c as Bone, childBone));
};

export const traverseBone = (selfBone: Bone, callback: (bone: Bone) => void) => {
    callback(selfBone);
    selfBone.getChildren().forEach((child: unknown) => {
        const c = child as Bone;
        traverseBone(c, callback);
    });
};

export function createBone({ index, name }: { name: string; index: number }): Bone {
    const nodeBase = createNodeBase({ name });

    let _offsetMatrix: Matrix4 = Matrix4.identity; // 初期姿勢のボーンローカル座標
    let _poseMatrix: Matrix4 = Matrix4.identity; // 初期姿勢行列
    let _boneOffsetMatrix: Matrix4 = Matrix4.identity; // 初期姿勢行列の逆行列
    let _jointMatrix: Matrix4 = Matrix4.identity;
    const _index: number = index;

    let _position: Vector3 = createVector3Zero();
    let _rotation: Rotator = createRotatorZero();
    let _scale: Vector3 = createVector3One();

    // const calcBoneOffsetMatrix = (parentBone?: Bone) => {
    //     _poseMatrix = parentBone ? Matrix4.multiplyMatrices(parentBone.getPoseMatrix(), _offsetMatrix) : _offsetMatrix;

    //     _boneOffsetMatrix = _poseMatrix.clone().invert();
    //     nodeBase.getChildren().forEach((childBone) => (childBone as Bone).calcBoneOffsetMatrix(this));
    // };

    // const calcJointMatrix = (parentBone?: Bone) => {
    //     // console.log(this.index, _position.elements, _rotation.elements, this.scale.elements)
    //     // console.log("[Bone.calcJointMatrix]", this.index, _rotation.elements)

    //     // 1: update offset matrix
    //     // TODO: quaternion-bug: 本当はこっちを使いたい
    //     // _offsetMatrix = Matrix4.fromTRS(_position, _rotation, this.scale);
    //     _offsetMatrix = Matrix4.multiplyMatrices(
    //         Matrix4.translationMatrix(_position),
    //         _rotation.rawMatrix!,
    //         Matrix4.scalingMatrix(_scale)
    //     );

    //     // 2: update joint matrix
    //     _jointMatrix = parentBone
    //         ? Matrix4.multiplyMatrices(parentBone.getJointMatrix(), _offsetMatrix)
    //         : _offsetMatrix;

    //     // NOTE: 無理やりpose状態にする時はこれを使う
    //     // _jointMatrix = _boneOffsetMatrix.clone().invert();

    //     nodeBase.getChildren().forEach((childBone) => (childBone as Bone).calcJointMatrix(this));
    // };

    // const traverse = (callback: (bone: Bone) => void) => {
    //     callback(this);
    //     nodeBase.getChildren().forEach((child: unknown) => {
    //         const c = child as Bone;
    //         c.traverse(callback);
    //     });
    // };

    return {
        ...nodeBase,
        //
        getIndex: () => _index,
        getPosition: () => _position,
        setPosition: (position: Vector3) => (_position = position),
        getRotation: () => _rotation,
        setRotation: (rotation: Rotator) => (_rotation = rotation),
        getScale: () => _scale,
        setScale: (scale: Vector3) => (_scale = scale),
        getOffsetMatrix: () => _offsetMatrix,
        setOffsetMatrix: (matrix: Matrix4) => (_offsetMatrix = matrix),
        getBoneOffsetMatrix: () => _boneOffsetMatrix,
        setBoneOffsetMatrix: (matrix: Matrix4) => (_boneOffsetMatrix = matrix),
        getPoseMatrix: () => _poseMatrix,
        setPoseMatrix: (matrix: Matrix4) => (_poseMatrix = matrix),
        getJointMatrix: () => _jointMatrix,
        setJointMatrix: (matrix: Matrix4) => (_jointMatrix = matrix),
        //
        // calcJointMatrix,
        // calcBoneOffsetMatrix,
        // traverse,
    };
}
