import {
    skinningVertexUniforms,
    // skinningVertex,
    skinningVertexAttributes,
    calcSkinningMatrixFunc
} from "./skinningShader.js";
import {transformVertexUniforms} from "./commonUniforms.js";
import {shadowMapVertex, shadowMapVertexUniforms, shadowMapVertexVaryings} from "./shadowMapShader.js";
import {normalMapVertexAttributes, normalMapVertexVaryings} from "./lightingCommon.js";

export const generateVertexShader = ({
    isSkinning,
    jointNum,
    useShadowMap,
    useNormalMap,
}) => {
    
    let attributeLayoutPointer = 0;
    
    const attributes = [
        `layout(location = 0) in vec3 aPosition;`,
        `layout(location = 1) in vec2 aUv;`,
        `layout(location = 2) in vec3 aNormal;`,
    ];
    if(useNormalMap) {
        attributes.push(...normalMapVertexAttributes(attributes.length));
    }
    if(isSkinning) {
        attributes.push(...skinningVertexAttributes(attributes.length));
    }
        
    return `#version 300 es

${attributes.join("\n")}

${isSkinning ? calcSkinningMatrixFunc() : ""}

${transformVertexUniforms()}

out vec2 vUv;
out vec3 vWorldPosition;
out vec3 vNormal;
${useNormalMap ? normalMapVertexVaryings() : ""}
${useShadowMap ? shadowMapVertexVaryings() : "" }

${useShadowMap ? shadowMapVertexUniforms() : ""}
${isSkinning ? skinningVertexUniforms(jointNum) : ""}

void main() {
    ${isSkinning ? `
    mat4 skinMatrix = calcSkinningMatrix(
        uJointMatrices[int(aBoneIndices[0])],
        uJointMatrices[int(aBoneIndices[1])],
        uJointMatrices[int(aBoneIndices[2])],
        uJointMatrices[int(aBoneIndices[3])],
        aBoneWeights
    );
    ` : ""}

    ${isSkinning
        ? `
    vec4 localPosition = skinMatrix * vec4(aPosition, 1.);`
        : `
    vec4 localPosition = vec4(aPosition, 1.);`
    }
    
    ${isSkinning ? `
    vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;
    vTangent = mat3(uNormalMatrix) * mat3(skinMatrix) * aTangent;
    vBinormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aBinormal;
    ` : ""}

    ${useShadowMap ? shadowMapVertex() : ""}
  
    // assign common varyings 
    vUv = aUv; 
    vWorldPosition = (uWorldMatrix * localPosition).xyz;
   
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * localPosition;
}
`;
}