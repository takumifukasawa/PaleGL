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
    const sortedAttributeDescriptors = [...attributeDescriptors].sort((a, b) => a.location - b.location);

    const attributesList = sortedAttributeDescriptors.map(({ location, size, name, dataType }) => {
        let type;
        // TODO: fix all type
        switch(dataType) {
            case Float32Array:
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
                        throw "[buildVertexAttributeLayouts] invalid attribute float";
                }
                break;
            case Uint16Array:
                switch(size) {
                    case 1:
                        type = "int";
                        break;
                    case 2:
                        type = "uvec2";
                        break;
                    case 3:
                        type = "uvec3";
                        break;
                    case 4:
                        type = "uvec4";
                        break;
                    default:
                        throw "[buildVertexAttributeLayouts] invalid attribute int";
                }               
                break;
            default:
                throw "[buildVertexAttributeLayouts] invalid attribute data type";
        }
        const str = `layout(location = ${location}) in ${type} ${name};`;
        return str;
    });

    return attributesList;
}

export const generateVertexShader = ({
    // required
    attributeDescriptors,
    // optional
    isSkinning,
    gpuSkinning,
    jointNum,
    receiveShadow,
    useNormalMap,
    vertexShaderModifier = {
        localPositionPostProcess: "",
        worldPositionPostProcess: "",
        outClipPositionPreProcess: "",
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
// TODO: フラグで必要に応じて出し分け
out vec4 vVertexColor;

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
  
    // assign common varyings 
    vUv = aUv; 
    // TODO: 頂点カラーが必要かどうかはフラグで出し分けたい
    vVertexColor = vec4(1., 1., 1., 1.);

    vec4 worldPosition = uWorldMatrix * localPosition;
    ${vertexShaderModifier.worldPositionPostProcess || ""}
  
    vWorldPosition = worldPosition.xyz;

    ${receiveShadow ? shadowMapVertex() : ""}
 
    ${vertexShaderModifier.outClipPositionPreProcess || ""}
 
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
        worldPositionPostProcess: "",
        outClipPositionPreProcess: "",
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

// TODO: depthでは必要ないのでなくしたい
out vec4 vVertexColor;

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
 
    ${vertexShaderModifier.outClipPositionPreProcess || ""}
    
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;
}