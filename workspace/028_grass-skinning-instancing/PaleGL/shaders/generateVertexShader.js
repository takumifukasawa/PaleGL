import {
    skinningVertexUniforms,
    calcSkinningMatrixFunc, skinningVertex
} from "./skinningShader.js";
import {engineCommonUniforms, transformVertexUniforms} from "./commonUniforms.js";
import {shadowMapVertex, shadowMapVertexUniforms, shadowMapVertexVaryings} from "./shadowMapShader.js";
import {normalMapVertexVaryings} from "./lightingCommon.js";

// -----------------------------------------------
// TODO:
// - out varying を centroid できるようにしたい
// -----------------------------------------------

const buildVertexAttributeLayouts = (attributeDescriptors) => {
    const sortedAttributeDescriptors = [];
    Object.keys(attributeDescriptors).forEach(key => {
        const attributeDescriptor = attributeDescriptors[key];
        sortedAttributeDescriptors[attributeDescriptor.location] = { ...attributeDescriptor, key };
    });

    const attributesList = sortedAttributeDescriptors.map(({ location, size, key }) => {
        let type;
        // TODO: fix all type
        switch(size) {
            case 1:
                type = "float";
                break;
            case 2:
                type = "vec2";
                break;
            case 3:
                type = "vec3";
                break;
            case 4:
                type = "vec4";
                break;
            default:
                throw "[buildVertexAttributeLayouts] invalid attribute layout size";
        }
        const str = `layout(location = ${location}) in ${type} ${key};`;
        return str;
    });
    
    return attributesList;
}

export const generateVertexShader = ({
    attributeDescriptors,
    isSkinning,
    gpuSkinning,
    jointNum,
    receiveShadow,
    useNormalMap,
    vertexShaderModifier = {
        localPositionPostProcess: "",
        worldPositionPostProcess: "",
    },
    insertUniforms,
} = {}) => {
    // for debug
    // console.log("[generateVertexShader] attributeDescriptors", attributeDescriptors)
   
    const attributes = buildVertexAttributeLayouts(attributeDescriptors);

    return `#version 300 es

${attributes.join("\n")}

${isSkinning ? calcSkinningMatrixFunc() : ""}

out vec2 vUv;
out vec3 vWorldPosition;
out vec3 vNormal;
${useNormalMap ? normalMapVertexVaryings() : ""}
${receiveShadow ? shadowMapVertexVaryings() : "" }

${transformVertexUniforms()}
${engineCommonUniforms()}

${receiveShadow ? shadowMapVertexUniforms() : ""}
${isSkinning ? skinningVertexUniforms(jointNum) : ""}
${insertUniforms || ""}

void main() {
    ${isSkinning ? skinningVertex(gpuSkinning) : ""}
    
    vec4 localPosition = vec4(aPosition, 1.);
    ${isSkinning
        ? `
    localPosition = skinMatrix * localPosition;`
        : ""
    }
    ${vertexShaderModifier.localPositionPostProcess || ""}
    
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
    ${vertexShaderModifier.worldPositionPostProcess || ""}
  
    vWorldPosition = worldPosition.xyz;
   
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;
}

export const generateDepthVertexShader = ({
    attributeDescriptors,
    isSkinning,
    gpuSkinning,
    vertexShaderModifier = {
        localPositionPostProcess: "",
        worldPositionPostProcess: ""
    },
    useNormalMap,
    jointNum
} = {}) => {
   
    const attributes = buildVertexAttributeLayouts(attributeDescriptors);

    return `#version 300 es

${attributes.join("\n")}

${isSkinning ? calcSkinningMatrixFunc() : ""}

${transformVertexUniforms()}
${engineCommonUniforms()}
${isSkinning ? skinningVertexUniforms(jointNum) : ""}

void main() {
    ${isSkinning ? skinningVertex(gpuSkinning) : ""}
    
    vec4 localPosition = vec4(aPosition, 1.);
    ${isSkinning
        ? `
    localPosition = skinMatrix * localPosition;`
        : ""
    }
    ${vertexShaderModifier.localPositionPostProcess || ""}
    
    vec4 worldPosition = uWorldMatrix * localPosition;
    ${vertexShaderModifier.worldPositionPostProcess || ""}
    
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;
}
