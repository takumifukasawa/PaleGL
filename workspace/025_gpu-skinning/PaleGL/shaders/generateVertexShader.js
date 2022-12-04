import {
    skinningVertexUniforms,
    skinningVertexAttributes,
    calcSkinningMatrixFunc, skinningVertex
} from "./skinningShader.js";
import {transformVertexUniforms} from "./commonUniforms.js";
import {shadowMapVertex, shadowMapVertexUniforms, shadowMapVertexVaryings} from "./shadowMapShader.js";
import {normalMapVertexAttributes, normalMapVertexVaryings} from "./lightingCommon.js";

// TODO: out varying を centroid できるようにしたい

export const generateVertexShader = ({
    isSkinning,
    gpuSkinning,
    jointNum,
    receiveShadow,
    useNormalMap,
    localPositionProcess,
    insertUniforms,
} = {}) => {
    
    const attributes = [
        `layout(location = 0) in vec3 aPosition;`,
        `layout(location = 1) in vec2 aUv;`,
        `layout(location = 2) in vec3 aNormal;`,
    ];
    if(isSkinning) {
        attributes.push(...skinningVertexAttributes(attributes.length));
    }
    if(useNormalMap) {
        attributes.push(...normalMapVertexAttributes(attributes.length));
    }

    return `#version 300 es

${attributes.join("\n")}

${isSkinning ? calcSkinningMatrixFunc() : ""}

${transformVertexUniforms()}

out vec2 vUv;
out vec3 vWorldPosition;
out vec3 vNormal;
${useNormalMap ? normalMapVertexVaryings() : ""}
${receiveShadow ? shadowMapVertexVaryings() : "" }

${receiveShadow ? shadowMapVertexUniforms() : ""}
${isSkinning ? skinningVertexUniforms(jointNum) : ""}
${insertUniforms || ""}

void main() {
    ${isSkinning ? skinningVertex(gpuSkinning) : ""}
    
    vec4 localPosition = vec4(aPosition, 1.);
    ${localPositionProcess || ""}
    ${isSkinning
        ? `
    localPosition = skinMatrix * localPosition;`
        : ""
    }
    
    ${(() => {
        if(isSkinning) {
            return useNormalMap
                ? `
    vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;
    vTangent = mat3(uNormalMatrix) * mat3(skinMatrix) * aTangent;
    vBinormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aBinormal;
`
                : `
    vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;
`;
        } else {
            return useNormalMap
                ? `
    vNormal = mat3(uNormalMatrix) * aNormal;
    vTangent = mat3(uNormalMatrix) * aTangent;
    vBinormal = mat3(uNormalMatrix) * aBinormal;
`
                : `
    vNormal = mat3(uNormalMatrix) * aNormal;
`;
        }
    })()}

    ${receiveShadow ? shadowMapVertex() : ""}
  
    // assign common varyings 
    vUv = aUv; 
    vec4 worldPosition = uWorldMatrix * localPosition;
  
    vWorldPosition = worldPosition.xyz;
   
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * localPosition;
}
`;
}

export const generateDepthVertexShader = ({
    isSkinning,
    gpuSkinning,
    localPositionProcess ,
    useNormalMap,
    jointNum
} = {}) => {

    const attributes = [
        `layout(location = 0) in vec3 aPosition;`,
        `layout(location = 1) in vec2 aUv;`,
        `layout(location = 2) in vec3 aNormal;`,
    ];
    if (isSkinning) {
        attributes.push(...skinningVertexAttributes(attributes.length));
    }
    if(useNormalMap) {
        attributes.push(...normalMapVertexAttributes(attributes.length));
    }

    return `#version 300 es

${attributes.join("\n")}

${isSkinning ? calcSkinningMatrixFunc() : ""}

${transformVertexUniforms()}
${isSkinning ? skinningVertexUniforms(jointNum) : ""}

void main() {
    ${isSkinning ? skinningVertex(gpuSkinning) : ""}
    
    vec4 localPosition = vec4(aPosition, 1.);
    ${localPositionProcess || ""}
    ${isSkinning
        ? `
    localPosition = skinMatrix * localPosition;`
        : ""
    }
 
    
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * localPosition;
}
`;
}
