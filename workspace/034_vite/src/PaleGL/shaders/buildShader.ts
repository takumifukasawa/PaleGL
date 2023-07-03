
// -----------------------------------------------
// TODO:
// - out varying を centroid できるようにしたい
// -----------------------------------------------

// .matchAll(/#pragma\s([a-zA-Z0-9_\s]+)/g)

import {AttributeDescriptor} from "../core/Attribute";

const pragmaRegex = /^#pragma(.*)/;



import {calcSkinningMatrixFunc, skinningVertex, skinningVertexUniforms} from "./skinningShader";

export const buildVertexAttributeLayouts = (attributeDescriptors: AttributeDescriptor[]) => {
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

const joinShaderLines = (shaderLines: string[]) => {
    return shaderLines
        .map(line => line.replace(/^\s*$/, ""))
        .join("\n")
        .replaceAll(/\n{3,}/g, "\n");
};

export const buildVertexShader = (shader: string, attributeDescriptors: AttributeDescriptor[]) => {
    const shaderLines =  shader.split("\n");
    const resultShaderLines: string[] = [];

    shaderLines.forEach(shaderLine => {
        const pragma = (shaderLine.trim()).match(pragmaRegex);

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
                
            case "uniform_transform_vertex":
                newLines.push(`
uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;
`);
                break;
                
            case "varying_receive_shadow":
                newLines.push(`
out vec4 vShadowMapProjectionUv;
`);
                break;
                
            case "uniform_receive_shadow":
                newLines.push(`
uniform mat4 uShadowMapProjectionMatrix;
`);
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
                newLines.push(skinningVertexUniforms(jointNum));
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
                newLines.push(`    
vShadowMapProjectionUv = uShadowMapProjectionMatrix * worldPosition;
`);
                break;

            case "varying_vertex_color":
                newLines.push(`
out vec4 vVertexColor;
`);
                break;
            default:
                throw `[buildVertexShader] invalid pragma: ${pragmaName}`;
        }
        resultShaderLines.push(newLines.join("\n"));
    });
    return joinShaderLines(resultShaderLines);
}

export const buildFragmentShader = (shader: string) => {
    const shaderLines =  shader.split("\n");
    const resultShaderLines: string[] = [];

    shaderLines.forEach(shaderLine => {
        const pragma = (shaderLine.trim()).match(pragmaRegex);

        if(!pragma) {
            resultShaderLines.push(shaderLine);
            return;
        }

        let newLines = [];
        const pragmas = (pragma[1].trim()).split(" ");

        const pragmaName = pragmas[0];

        switch(pragmaName) {
            case "uniform_vertex_matrices":
                newLines.push(`uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;`);
                break;
            case "function_depth":
                newLines.push(`
// ref:
// https://github.com/mebiusbox/docs/blob/master/%EF%BC%93%E6%AC%A1%E5%85%83%E5%BA%A7%E6%A8%99%E5%A4%89%E6%8F%9B%E3%81%AE%E3%83%A1%E3%83%A2%E6%9B%B8%E3%81%8D.pdf
float viewZToLinearDepth(float z, float near, float far) {
    return (z + near) / (near - far);
}
float perspectiveDepthToLinearDepth(float depth, float near, float far) {
    float nz = near * depth;
    return -nz / (far * (depth - 1.) - nz);
}
`);
                break;
            default:
                throw `[buildFragmentShader] invalid pragma: ${pragmaName}`;
        }
        resultShaderLines.push(newLines.join("\n"));
    });
    return joinShaderLines(resultShaderLines);
}

export const defaultDepthFragmentShader = () => `#version 300 es

precision mediump float;

out vec4 outColor;

void main() {
    outColor = vec4(1., 1., 1., 1.);
}
`;
