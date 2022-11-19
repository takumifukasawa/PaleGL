import {NodeBase} from "./NodeBase.js";
import {Matrix4} from "../math/Matrix4.js";
import {Rotator} from "../math/Rotator.js";
import {Vector3} from "../math/Vector3.js";

export class Bone extends NodeBase {
    offsetMatrix = Matrix4.identity(); // 初期姿勢のボーンローカル座標
    #poseMatrix = Matrix4.identity(); // 初期姿勢行列
    #boneOffsetMatrix = Matrix4.identity(); // 初期姿勢行列の逆行列
    #jointMatrix = Matrix4.identity();
    index;
    
    position = Vector3.zero();
    rotation = Rotator.zero();
    scale = Vector3.one();
    
    get boneOffsetMatrix() {
        return this.#boneOffsetMatrix;
    }
    
    get poseMatrix() {
        return this.#poseMatrix;
    }
    
    get jointMatrix() {
        return this.#jointMatrix;
    }

    constructor({ index, ...options }) {
        super(options);
        this.index = index;
    }

    calcBoneOffsetMatrix(parentBone) {
        // console.log("[Bone.calcBoneOffsetMatrix]", this.name)
        this.#poseMatrix = !!parentBone
            ? Matrix4.multiplyMatrices(parentBone.poseMatrix, this.offsetMatrix)
            // ? Matrix4.multiplyMatrices(this.offsetMatrix, parentBone.poseMatrix)
            : this.offsetMatrix;
        // this.offsetMatrix.log()
        
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
        // 1: update offset matrix
        this.offsetMatrix = Matrix4.fromTRS(this.position, this.rotation, this.scale);
        // console.log(this.name, this.position, this.rotation, this.scale)
        // console.log(this.name, this.offsetMatrix);
        
        // 2: update joint matrix
        // console.log("[Bone.calcJointMatrix]", this.name)
        this.#jointMatrix = !!parentBone
            ? Matrix4.multiplyMatrices(parentBone.jointMatrix, this.offsetMatrix)
            // ? Matrix4.multiplyMatrices(this.offsetMatrix, parentBone.jointMatrix)
            : this.offsetMatrix;
        // this.#jointMatrix.log()
       
        // NOTE: 無理やりpose状態にする時はこれを使う
        this.#jointMatrix = this.#boneOffsetMatrix.clone().invert();
        
        
        this.children.forEach(childBone => childBone.calcJointMatrix(this));
    }
    
    traverse(callback) {
        callback(this);
        this.children.forEach(child => {
            child.traverse(callback);
        })
    }
}