import { NodeBase } from '@/PaleGL/core/NodeBase';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { Rotator } from '@/PaleGL/math/Rotator';
import { Vector3 } from '@/PaleGL/math/Vector3';

export class Bone extends NodeBase {
    offsetMatrix: Matrix4 = Matrix4.identity; // 初期姿勢のボーンローカル座標
    #poseMatrix: Matrix4 = Matrix4.identity; // 初期姿勢行列
    #boneOffsetMatrix: Matrix4 = Matrix4.identity; // 初期姿勢行列の逆行列
    #jointMatrix: Matrix4 = Matrix4.identity;
    index: number;

    position: Vector3 = Vector3.zero;
    rotation: Rotator = Rotator.zero;
    scale: Vector3 = Vector3.one;

    get boneOffsetMatrix() {
        return this.#boneOffsetMatrix;
    }

    get poseMatrix() {
        return this.#poseMatrix;
    }

    get jointMatrix() {
        return this.#jointMatrix;
    }

    constructor({ index, ...options }: { name: string; index: number }) {
        super(options);
        this.index = index;
    }

    calcBoneOffsetMatrix(parentBone?: Bone) {
        this.#poseMatrix = parentBone
            ? Matrix4.multiplyMatrices(parentBone.poseMatrix, this.offsetMatrix)
            : this.offsetMatrix;

        this.#boneOffsetMatrix = this.#poseMatrix.clone().invert();
        this.children.forEach((childBone) => (childBone as Bone).calcBoneOffsetMatrix(this));
    }

    calcJointMatrix(parentBone?: Bone) {
        // console.log(this.index, this.position.elements, this.rotation.elements, this.scale.elements)
        // console.log("[Bone.calcJointMatrix]", this.index, this.rotation.elements)
        
        // 1: update offset matrix
        // TODO: quaternion-bug: 本当はこっちを使いたい
        // this.offsetMatrix = Matrix4.fromTRS(this.position, this.rotation, this.scale);
        this.offsetMatrix = Matrix4.multiplyMatrices(
            Matrix4.translationMatrix(this.position),
            this.rotation.rawMatrix!,
            Matrix4.scalingMatrix(this.scale)
        );

        // 2: update joint matrix
        this.#jointMatrix = parentBone
            ? Matrix4.multiplyMatrices(parentBone.jointMatrix, this.offsetMatrix)
            : this.offsetMatrix;

        // NOTE: 無理やりpose状態にする時はこれを使う
        // this.#jointMatrix = this.#boneOffsetMatrix.clone().invert();

        this.children.forEach((childBone) => (childBone as Bone).calcJointMatrix(this));
    }

    traverse(callback: (bone: Bone) => void) {
        callback(this);
        this.children.forEach((child: unknown) => {
            const c = child as Bone;
            c.traverse(callback);
        });
    }
}
