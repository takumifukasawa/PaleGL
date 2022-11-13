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
        // console.log("[Bone.calcBoneOffsetMatrix]", this.name)
        this.#poseMatrix = !!parentBone
            ? Matrix4.multiplyMatrices(parentBone.poseMatrix, this.offsetMatrix)
            // ? Matrix4.multiplyMatrices(this.offsetMatrix, parentBone.poseMatrix)
            : this.offsetMatrix;
            // : Matrix4.identity()
        // this.#poseMatrix.log();
        this.#boneOffsetMatrix = this.#poseMatrix.clone().invert();
        // this.#boneOffsetMatrix.log()
        // Matrix4.multiplyMatrices(this.#boneOffsetMatrix.clone(), this.#poseMatrix.clone()).log()
        this.children.forEach(childBone => childBone.calcBoneOffsetMatrix(this));
    }
    
    // calcJointMatrix(childBone) {
    //     console.log(this, childBone)
    //     this.#jointMatrix = !!childBone
    //         ? Matrix4.multiplyMatrices(this.offsetMatrix, childBone.jointMatrix)
    //         : this.offsetMatrix;
    //     this.#jointMatrix.log()
    //     if (this.parent) {
    //         this.parent.calcJointMatrix(this);
    //     }
    // }

    calcJointMatrix(parentBone) {
        // console.log("[Bone.calcJointMatrix]", this.name)
        this.#jointMatrix = !!parentBone
            ? Matrix4.multiplyMatrices(parentBone.jointMatrix, this.offsetMatrix)
            // ? Matrix4.multiplyMatrices(this.offsetMatrix, parentBone.jointMatrix)
            : this.offsetMatrix;
        // this.#jointMatrix.log()
        this.children.forEach(childBone => childBone.calcJointMatrix(this));
    }
    
    traverse(callback) {
        callback(this);
        this.children.forEach(child => {
            child.traverse(callback);
        })
    }
}