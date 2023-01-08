
// -----------------------------------------------
// TODO:
// - out varying を centroid できるようにしたい
// -----------------------------------------------

import {UniformNames} from "../constants.js";
import {calcSkinningMatrixFunc, skinningVertex, skinningVertexUniforms} from "./skinningShader.js";
import {engineCommonUniforms, transformVertexUniforms} from "./commonUniforms";

export const buildVertexAttributeLayouts = (attributeDescriptors) => {
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
            // TODO: signedなパターンが欲しい    
            case Uint16Array:
                switch(size) {
                    case 1:
                        type = "uint";
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

export const buildVertexShader = (shader, attributeDescriptors) => {
    const shaderLines =  shader.split("\n");
    const resultShaderLines = [];

    shaderLines.forEach(shaderLine => {
        const pragma = (shaderLine.trim()).match(/^#pragma(.*)/);

        if(!pragma) {
            resultShaderLines.push(shaderLine);
            return;
        }

        let newLines = [];
        const pragmas = (pragma[1].trim()).split(" ");
        
        const pragmaName = pragmas[0];
        
        switch(pragmaName) {
            
            case "attributes":
                const attributes = buildVertexAttributeLayouts(attributeDescriptors);
                newLines.push(...attributes);
                break;
                
            case "uniform_time":
                newLines.push("uniform float uTime;");
                break;
                
            case "uniform_transform_vertex":
                newLines.push(`
uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;
`);
                break;
                
            case "varying_receive_shadow":
                newLines.push("out vec4 vShadowMapProjectionUv;");
                break;
                
            case "uniform_receive_shadow":
                newLines.push("uniform mat4 uShadowMapProjectionMatrix;");
                break;
                
            case "uniform_engine":
                newLines.push(`
uniform float uTime;
`);
                break;
            case "varying_normal_map":
                newLines.push(`
out vec3 vTangent;
out vec3 vBinormal;               
`);
                break;
                
            case "function_skinning":
                newLines.push(calcSkinningMatrixFunc());
                break;
                
            case "uniform_skinning":
                const jointNum = pragmas[1];
                newLines.push(skinningVertexUniforms());
                break;
                
            case "vertex_normal_map":
                const isSkinningNormalMap = pragmas[1] && pragmas[1] === "skinning";
                newLines.push(isSkinningNormalMap ? `
vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;
vTangent = mat3(uNormalMatrix) * mat3(skinMatrix) * aTangent;
vBinormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aBinormal;
                ` : `
vNormal = mat3(uNormalMatrix) * aNormal;
vTangent = mat3(uNormalMatrix) * aTangent;
vBinormal = mat3(uNormalMatrix) * aBinormal;
`);
                break;
                
            case "vertex_skinning":
                newLines.push(skinningVertex(pragmas[1] === "gpu"));
                break;
                
            case "vertex_receive_shadow":
                newLines.push("vShadowMapProjectionUv = uShadowMapProjectionMatrix * worldPosition;");
                break;

            case "varying_vertex_color":
                newLines.push("out vec4 vVertexColor;");
                break;
            default:
                throw "[buildVertexShader] invalid pragma";
        }
        resultShaderLines.push(newLines.join("\n"));
    });
    return resultShaderLines.join("\n");
}

export const buildFragmentShader = (shader) => {
    const shaderLines =  shader.split("\n");
    const resultShaderLines = [];

    shaderLines.forEach(shaderLine => {
        const pragma = (shaderLine.trim()).match(/^#pragma\s([a-zA-Z0-9_\s]*)$/);

        if(!pragma) {
            resultShaderLines.push(shaderLine);
            return;
        }

        const pragmaContent = pragma[1];
        let newLines = [];
        switch(pragmaContent) {
            case "uniform_time":
                newLines.push("uniform float uTime;");
                break;
            case "uniform_vertex_matrices":
                newLines.push(`uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;`);
                break;
            default:
                throw "[buildFragmentShader] invalid pragma";
        }
        resultShaderLines.push(newLines.join("\n"));
    });
    return resultShaderLines.join("\n");
}