
import { Material } from "./Material.js";
import {shadowMapVertexUniforms, transformVertexUniforms} from "../shaders/commonUniforms";
import {shadowMapVertex} from "../shaders/shadowMapShader";


export const buildSkinningVertexShader = ({ jointNum, useShadowMap }) => `#version 300 es

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aUv;
layout(location = 2) in vec3 aNormal;
layout(location = 3) in vec3 aTangent;
layout(location = 4) in vec3 aBinormal;
layout(location = 5) in vec4 aBoneIndices;
layout(location = 6) in vec4 aBoneWeights;

${transformVertexUniforms()}
${shadowMapVertexUniforms()}
uniform mat4[${jointNum}] uJointMatrices;

out vec2 vUv;
out vec3 vNormal;
out vec3 vTangent;
out vec3 vBinormal;
out vec3 vWorldPosition;
out vec4 vShadowMapProjectionUv;

void main() {
    vUv = aUv;

    mat4 skinMatrix =
         uJointMatrices[int(aBoneIndices[0])] * aBoneWeights.x +
         uJointMatrices[int(aBoneIndices[1])] * aBoneWeights.y +
         uJointMatrices[int(aBoneIndices[2])] * aBoneWeights.z +
         uJointMatrices[int(aBoneIndices[3])] * aBoneWeights.w;
   
    vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;
    vTangent = mat3(uNormalMatrix) * mat3(skinMatrix) * aTangent;
    vBinormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aBinormal;
   
    vec4 worldPosition = uWorldMatrix * skinMatrix * vec4(aPosition, 1.); 
    vWorldPosition = worldPosition.xyz;

    ${useShadowMap ? shadowMapVertex() : ""}
   
    // with skin position 
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
    
    // pre calc skinning in cpu
    // gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
}
`



export class PhongMaterial extends Material {
    constructor(options) {
        const vertexShader = 
        super(options);
    }
}