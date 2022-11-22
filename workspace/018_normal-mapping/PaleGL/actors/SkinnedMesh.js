import {Mesh} from "./Mesh.js";
import {ActorTypes, AttributeUsageType, BlendTypes, PrimitiveTypes, UniformTypes} from "../constants.js";
import {Vector3} from "../math/Vector3.js";
import {Matrix4} from "../math/Matrix4.js";
import {Geometry} from "../geometries/Geometry.js";
import {Material} from "../materials/Material.js";
import {generateDepthVertexShader} from "../shaders/generateVertexShader.js";

export class SkinnedMesh extends Mesh {
    bones;
    boneCount = 0;
   
    // positions = [];
    // boneIndices = [];
    // boneWeights = [];
    
    boneOffsetMatrices;
    
    constructor({bones, gpu, ...options}) {
        super({
            ...options,
            actorType: ActorTypes.SkinnedMesh
        });

        this.bones = bones;

        this.bones.traverse(() => {
            this.boneCount++;
        });

        // for debug
        // console.log(this.positions, this.boneIndices, this.boneWeights)
    }
    
    start(options) {
        super.start(options);
       
        const { gpu } = options;

        if(!options.depthMaterial) {
            const depthMaterial = new Material({
                gpu,
                vertexShader: generateDepthVertexShader({
                    isSkinning: true,
                    jointNum: this.boneCount,
                }),
                fragmentShader: `#version 300 es
                precision mediump float;
                out vec4 outColor;
                void main() {
                    outColor = vec4(1., 1., 1., 1.);
                }
                `,
                uniforms: {
                    uJointMatrices: {
                        type: UniformTypes.Matrix4Array,
                        value: null
                    },
                }
            });
            this.depthMaterial = depthMaterial;
        }

        this.bones.calcBoneOffsetMatrix();
        // this.bones.calcJointMatrix();
        
        this.boneOffsetMatrices = this.getBoneOffsetMatrices();
        
        // this.material.uniforms.uBoneOffsetMatrices.value = this.boneOffsetMatrices;
        // this.material.uniforms.uJointMatrices.value = this.getBoneJointMatrices();
        
        const indices = [];
        const checkChildNum = (bone) => {
            if(bone.hasChild) {
                bone.children.forEach(childBone => {
                    indices.push(bone.index, childBone.index);
                    checkChildNum(childBone);
                });
            }
        }
        checkChildNum(this.bones);
        
        this.boneLines = new Mesh({
            gpu,
            geometry: new Geometry({
                gpu,
                attributes: {
                    position: {
                        data: new Array((indices.length / 2) * 3),
                        size: 3,
                        usage: AttributeUsageType.DynamicDraw
                    }
                },
                indices,
                drawCount: indices.length
            }),
            material: new Material({
                gpu,
                vertexShader: `#version 300 es
                
                layout (location = 0) in vec3 aPosition;
                
                uniform mat4 uWorldMatrix;
                uniform mat4 uViewMatrix;
                uniform mat4 uProjectionMatrix;
                
                void main() {
                    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
                }
                `,
                fragmentShader: `#version 300 es
                
                precision mediump float;
                
                out vec4 outColor;
                
                void main() {
                    outColor = vec4(0, 1., 0, 1.);
                }
                `,
                primitiveType: PrimitiveTypes.Lines,
                blendType: BlendTypes.Transparent,
                depthWrite: false,
                depthTest: false
            })
        });
        
        this.addChild(this.boneLines);
    }
    
    update(options) {
        super.update(options);
        
        this.bones.calcJointMatrix();
        
        // NOTE: test update skinning by cpu
        const boneOffsetMatrices = this.boneOffsetMatrices;
        const boneJointMatrices = this.getBoneJointMatrices();

        // console.log("--------")
        const boneLinePositions = [];
        const getBoneLinePositions = (bone) => {
            boneLinePositions.push(...bone.jointMatrix.position.elements);
            bone.children.forEach(childBone => {
                getBoneLinePositions(childBone);
            });
        }
        getBoneLinePositions(this.bones);
        
        this.boneLines.geometry.updateAttribute("position", boneLinePositions.flat())
       
       // console.log("-------") 
        const jointMatrices = boneOffsetMatrices.map((boneOffsetMatrix, i) => {
            // boneOffsetMatrix.log()
            return Matrix4.multiplyMatrices(boneJointMatrices[i], boneOffsetMatrix);
        });

        this.material.uniforms.uJointMatrices.value = jointMatrices;
        if(this.depthMaterial) {
            this.depthMaterial.uniforms.uJointMatrices.value = jointMatrices;
        }
        
        // const newPositions = [];
        // for(let i = 0; i < this.positions.length; i++) {
        //     const x = this.positions[i][0];
        //     const y = this.positions[i][1];
        //     const z = this.positions[i][2];
        //     const p = new Vector3(x, y, z);
        //     const boneWeights = this.boneWeights[i];
        //     const boneIndices = this.boneIndices[i];
        //     const np = Vector3.addVectors(
        //         p.clone()
        //             .multiplyMatrix4(Matrix4.multiplyMatrices(
        //                 boneJointMatrices[boneIndices[0]],
        //                 boneOffsetMatrices[boneIndices[0]],
        //             ))
        //             .scale(boneWeights[0]),
        //         p.clone()
        //             .multiplyMatrix4(Matrix4.multiplyMatrices(
        //                 boneJointMatrices[boneIndices[1]],
        //                 boneOffsetMatrices[boneIndices[1]],
        //             ))
        //             .scale(boneWeights[1]),
        //         p.clone()
        //             .multiplyMatrix4(Matrix4.multiplyMatrices(
        //                 boneJointMatrices[boneIndices[2]],
        //                 boneOffsetMatrices[boneIndices[2]],
        //             ))
        //             .scale(boneWeights[2]),
        //         p.clone()
        //             .multiplyMatrix4(Matrix4.multiplyMatrices(
        //                 boneJointMatrices[boneIndices[3]],
        //                 boneOffsetMatrices[boneIndices[3]],
        //             ))
        //             .scale(boneWeights[3]),
        //     );
        //     newPositions.push(np);
        // }
        // const newData = newPositions.map(p => [...p.elements]).flat();
        // // this.geometry.updateAttribute("position", newData);
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