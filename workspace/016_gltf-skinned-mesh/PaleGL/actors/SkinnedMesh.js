import {Mesh} from "./Mesh.js";
import {ActorTypes} from "../constants.js";

export class SkinnedMesh extends Mesh {
    bones;

    constructor({bones, ...options}) {
        super({ ...options, actorType: ActorTypes.SkinnedMesh });
        this.bones = bones;
    }
    
    start() {
        this.material.uniforms.uBoneOffsetMatrices.value = this.getBoneOffsetMatrices();
    }

    getBoneOffsetMatrices() {
        const matrices = [];
        this.bones.traverse((bone) => {
            const m = bone.boneOffsetMatrix.clone();
            matrices.push(m);
        });
        return matrices;
    }
}