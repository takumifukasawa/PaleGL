// NOTE: deprecated

import {
    skinningVertexUniforms,
    calcSkinningMatrixFunc, skinningVertex
} from "./skinningShader";
import {engineCommonUniforms, transformVertexUniforms} from "./commonUniforms";
import {shadowMapVertex, shadowMapVertexUniforms, shadowMapVertexVaryings} from "./shadowMapShader";
import {normalMapVertexVaryings} from "./lightingCommon";
import {AttributeNames} from "../constants";
import {buildVertexAttributeLayouts} from "./buildShader";
import {AttributeDescriptor} from "../core/Attribute";

type GenerateVertexShaderArgs = {
    // required
    attributeDescriptors: AttributeDescriptor[],
    // optional
    receiveShadow?: boolean,
    useNormalMap?: boolean,
    vertexShaderModifier?: {
        beginMain: string,
        localPositionPostProcess:string,
        worldPositionPostProcess: string,
        viewPositionPostProcess: string,
        outClipPositionPreProcess: string,
        lastMain: string,
    },
    insertVaryings?: string,
    insertUniforms?: string, // TODO: 使ってるuniformsから自動的に生成したいかも
    // skinning
    isSkinning?: boolean,
    gpuSkinning?: boolean,
    jointNum?: string,
    // instancing
    isInstancing?: boolean,
    // vertex color
    useVertexColor?: boolean,
    
};

export const generateVertexShader = ({
    // required
    attributeDescriptors,
    // optional
    receiveShadow,
    useNormalMap,
    vertexShaderModifier = {
        beginMain: "",
        localPositionPostProcess: "",
        worldPositionPostProcess: "",
        viewPositionPostProcess: "",
        outClipPositionPreProcess: "",
        lastMain: "",
    },
    insertVaryings,
    insertUniforms, // TODO: 使ってるuniformsから自動的に生成したいかも
    // skinning
    isSkinning,
    gpuSkinning,
    jointNum,
    // instancing
    isInstancing,
    // vertex color
    useVertexColor,
}: GenerateVertexShaderArgs) => {
    // for debug
    // console.log("[generateVertexShader] attributeDescriptors", attributeDescriptors)
   
    const attributes = buildVertexAttributeLayouts(attributeDescriptors);
    const hasNormal = !!attributeDescriptors.find(({ name }) => name === AttributeNames.Normal);
    // const hasVertexColor = !!attributeDescriptors.find(({ name }) => name === AttributeNames.Color);
    // const hasInstanceVertexColor = !!attributeDescriptors.find(({ name }) => name === AttributeNames.InstanceVertexColor);
    // const hasColor = hasVertexColor || hasInstanceVertexColor;

    return `#version 300 es

${attributes.join("\n")}

${isSkinning ? calcSkinningMatrixFunc() : ""}

out vec2 vUv;
out vec3 vWorldPosition;
out vec3 vNormal;
${useNormalMap ? normalMapVertexVaryings() : ""}
${receiveShadow ? shadowMapVertexVaryings() : "" }
${useVertexColor ? "out vec4 vVertexColor;" : ""}
${insertVaryings ? insertVaryings : ""}

${transformVertexUniforms()}
${engineCommonUniforms()}

${receiveShadow ? shadowMapVertexUniforms() : ""}
${isSkinning ? skinningVertexUniforms(jointNum || "") : ""}
${insertUniforms || ""}

void main() {
    ${vertexShaderModifier.beginMain || ""}

    ${isSkinning ? skinningVertex(!!gpuSkinning) : ""}
    
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
                : hasNormal ? `
    vNormal = mat3(uNormalMatrix) * aNormal;
` : "";
        }
    })()}
  
    // assign common varyings 
    vUv = aUv; 
    ${(() => {
        if(!useVertexColor) {
            return "";
        }
        return isInstancing
            ? "vVertexColor = aInstanceVertexColor;"
            : "vVertexColor = aColor;";
    })()}

    vec4 worldPosition = uWorldMatrix * localPosition;
    ${vertexShaderModifier.worldPositionPostProcess || ""}
  
    vWorldPosition = worldPosition.xyz;

    ${receiveShadow ? shadowMapVertex() : ""}
    
    vec4 viewPosition = uViewMatrix * worldPosition;
    ${vertexShaderModifier.viewPositionPostProcess || ""}
 
    ${vertexShaderModifier.outClipPositionPreProcess || ""}

    gl_Position = uProjectionMatrix * viewPosition;
    
    ${vertexShaderModifier.lastMain || ""}
}
`;
}

type GenerateDepthVertexShaderArgs = {
    attributeDescriptors: AttributeDescriptor[],
    isSkinning?: boolean,
    gpuSkinning?: boolean,
    vertexShaderModifier: {
        beginMain: string,
        localPositionPostProcess: string,
        worldPositionPostProcess: string,
        outClipPositionPreProcess: string,
        lastMain: string
    },
    insertVaryings?: string
    useNormalMap?: boolean,
    jointNum?: string
}

export const generateDepthVertexShader = ({
    attributeDescriptors,
    isSkinning,
    gpuSkinning,
    vertexShaderModifier = {
        beginMain: "",
        localPositionPostProcess: "",
        worldPositionPostProcess: "",
        outClipPositionPreProcess: "",
        lastMain: ""
    },
    insertVaryings,
    // useNormalMap,
    jointNum
}: GenerateDepthVertexShaderArgs) => {
   
    const attributes = buildVertexAttributeLayouts(attributeDescriptors);

    return `#version 300 es

${attributes.join("\n")}

${isSkinning ? calcSkinningMatrixFunc() : ""}

${transformVertexUniforms()}
${engineCommonUniforms()}
${isSkinning ? skinningVertexUniforms(jointNum || "") : ""}

// TODO: depthでは必要ないのでなくしたい
out vec4 vVertexColor;
${insertVaryings ? insertVaryings : ""}

void main() {
    ${vertexShaderModifier.beginMain || ""}

    ${isSkinning ? skinningVertex(!!gpuSkinning) : ""}
    
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

    ${vertexShaderModifier.lastMain || ""}
}
`;
}
