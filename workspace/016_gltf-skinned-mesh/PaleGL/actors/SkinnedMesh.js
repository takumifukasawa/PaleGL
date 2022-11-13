import {Mesh} from "./Mesh.js";
import {ActorTypes} from "../constants.js";
import {Vector3} from "../math/Vector3.js";
import {Matrix4} from "../math/Matrix4.js";

export class SkinnedMesh extends Mesh {
    bones;
   
    positions = [];
    boneIndices = [];
    boneWeights = [];
    
    constructor({bones, ...options}) {
        super({ ...options, actorType: ActorTypes.SkinnedMesh });
        this.bones = bones;
        
        const positions = [...this.geometry.attributes.position.data];
        const boneIndices = [...this.geometry.attributes.boneIndices.data];
        const boneWeights = [...this.geometry.attributes.boneWeights.data];
        
        for(let i = 0; i < positions.length / 3; i++) {
            this.positions.push([
                positions[i * 3 + 0],
                positions[i * 3 + 1],
                positions[i * 3 + 2]
            ]);
        } 
        for(let i = 0; i < boneIndices.length / 4; i++) {
            this.boneIndices.push([
                boneIndices[i * 4 + 0],
                boneIndices[i * 4 + 1],
                boneIndices[i * 4 + 2],
                boneIndices[i * 4 + 3]
            ]);
        }
        for(let i = 0; i < boneWeights.length / 4; i++) {
            this.boneWeights.push([
                boneWeights[i * 4 + 0],
                boneWeights[i * 4 + 1],
                boneWeights[i * 4 + 2],
                boneWeights[i * 4 + 3]
            ]);
        }
       
        // for debug
        // console.log(this.positions, this.boneIndices, this.boneWeights)
    }
    
    start() {
        this.material.uniforms.uBoneOffsetMatrices.value = this.getBoneOffsetMatrices();
        this.material.uniforms.uJointMatrices.value = this.getBoneJointMatrices();
    // }
    // 
    // update({ gpu }) {
        // NOTE: test update skinning by cpu
        const boneOffsetMatrices = this.getBoneOffsetMatrices();
        const boneJointMatrices = this.getBoneJointMatrices();
        const newPositions = [];
        for(let i = 0; i < this.positions.length; i++) {
            const x = this.positions[i][0];
            const y = this.positions[i][1];
            const z = this.positions[i][2];
            const p = new Vector3(x, y, z);
            const boneWeights = this.boneWeights[i];
            const boneIndices = this.boneIndices[i];
            const np = Vector3.addVectors(
                p.clone()
                    .multiplyMatrix4(boneOffsetMatrices[boneIndices[0]])
                    .scale(boneWeights[0]),
                p.clone()
                    .multiplyMatrix4(boneOffsetMatrices[boneIndices[1]])
                    .scale(boneWeights[1]),
                p.clone()
                    .multiplyMatrix4(boneOffsetMatrices[boneIndices[2]])
                    .scale(boneWeights[2]),
                p.clone()
                    .multiplyMatrix4(boneOffsetMatrices[boneIndices[3]])
                    .scale(boneWeights[3]),
            );
            newPositions.push(np);
        }
        const newData = newPositions.map(p => [...p.elements]).flat();
        this.geometry.updateAttribute("position", newData);
    }

    getBoneOffsetMatrices() {
        const matrices = [];
        this.bones.traverse((bone) => {
            const m = bone.boneOffsetMatrix.clone();
            matrices.push(m);
        });
        return matrices;
    }
    
    getBoneJointMatrices() {
        const matrices = [];
        this.bones.traverse((bone) => {
            const m = bone.jointMatrix.clone();
            // const m = bone.boneOffsetMatrix.clone();
            matrices.push(m);
        });
        return matrices;        
    }
}