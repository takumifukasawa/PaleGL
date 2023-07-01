﻿import {NodeBase} from "./NodeBase.ts";
import {Matrix4} from "../math/Matrix4.ts";
import {Rotator} from "../math/Rotator.ts";
import {Vector3} from "../math/Vector3.ts";

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

    constructor({index, ...options}: { name: string, index: number }) {
        super(options);
        this.index = index;
    }

    calcBoneOffsetMatrix(parentBone: Bone) {
        this.#poseMatrix = !!parentBone
            ? Matrix4.multiplyMatrices(parentBone.poseMatrix, this.offsetMatrix)
            : this.offsetMatrix;

        this.#boneOffsetMatrix = this.#poseMatrix.clone().invert();
        this.children.forEach(childBone => (childBone as Bone).calcBoneOffsetMatrix(this));
    }

    calcJointMatrix(parentBone: Bone) {
        // 1: update offset matrix
        this.offsetMatrix = Matrix4.fromTRS(this.position, this.rotation, this.scale);

        // 2: update joint matrix
        this.#jointMatrix = !!parentBone
            ? Matrix4.multiplyMatrices(parentBone.jointMatrix, this.offsetMatrix)
            : this.offsetMatrix;

        // NOTE: 無理やりpose状態にする時はこれを使う
        // this.#jointMatrix = this.#boneOffsetMatrix.clone().invert();

        this.children.forEach(childBone => (childBone as Bone).calcJointMatrix(this));
    }

    traverse(callback: (bone: Bone) => void) {
        callback(this);
        this.children.forEach((child: unknown) => {
            const c = child as Bone;
            c.traverse(callback);
        })
    }
}