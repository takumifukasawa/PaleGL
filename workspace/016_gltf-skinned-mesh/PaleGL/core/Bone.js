import {NodeBase} from "./NodeBase.js";
import {Matrix4} from "../math/Matrix4.js";

export class Bone extends NodeBase {
    offsetMatrix; // 初期姿勢のボーンローカル座標
    #poseMatrix; // 初期姿勢行列
    #boneOffsetMatrix; // 初期姿勢行列の逆行列
    #jointMatrix = Matrix4.identity();
    
    get boneOffsetMatrix() {
        return this.#boneOffsetMatrix;
    }
    
    get poseMatrix() {
        return this.#poseMatrix;
    }
    
    get jointMatrix() {
        return this.#jointMatrix;
    }

    constructor(options) {
        super(options);
    }

    calcBoneOffsetMatrix(parentBone) {
        this.#poseMatrix = !!parentBone
            ? Matrix4.multiplyMatrices(parentBone.poseMatrix, this.offsetMatrix)
            // : this.offsetMatrix;
            : Matrix4.identity()
        this.#boneOffsetMatrix = this.#poseMatrix.clone().invert();
        this.children.forEach(childBone => childBone.calcBoneOffsetMatrix(this));
    }
    
    calcJointMatrix(parentBone) {
        this.#jointMatrix = !!parentBone
            ? Matrix4.multiplyMatrices(this.offsetMatrix, parentBone.jointMatrix)
            : this.offsetMatrix;
        this.children.forEach(childBone => childBone.calcJointMatrix(this));
    }
    
    traverse(callback) {
        callback(this);
        this.children.forEach(child => {
            child.traverse(callback);
        })
    }
}