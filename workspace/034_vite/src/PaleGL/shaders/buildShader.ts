// -----------------------------------------------
// TODO:
// - out varying を centroid できるようにしたい
// -----------------------------------------------

// .matchAll(/#pragma\s([a-zA-Z0-9_\s]+)/g)

import { AttributeDescriptor } from '@/PaleGL/core/Attribute';

// import { calcSkinningMatrixFunc, skinningVertex, skinningVertexUniforms } from './skinningShader';
import { VertexShaderModifier } from '@/PaleGL/materials/Material.ts';
import defaultDepthFragment from "@/PaleGL/shaders/default-depth-fragment.glsl";
import {ShaderPragmas, VertexShaderModifiers} from "@/PaleGL/constants.ts";
import depthFunctions from "@/PaleGL/shaders/partial/depth-functions.glsl";

const pragmaRegex = /^#pragma(.*)/;

type VertexShaderDefines = {
    receiveShadow?: boolean;
    isSkinning?: boolean;
    gpuSkinning?: boolean;
    useNormalMap?: boolean;
    useReceiveShadow?: boolean;
    useVertexColor?: boolean;
    useAlphaTest?: boolean;
};

const buildShaderDefines = ({
    receiveShadow,
    isSkinning,
    gpuSkinning,
    useNormalMap,
    useReceiveShadow,
    useVertexColor,
    useAlphaTest,
}: VertexShaderDefines = {}): string[] => {
    const arr: string[] = [];
    if (receiveShadow) {
        arr.push('#define USE_RECEIVE_SHADOW');
    }
    if (isSkinning) {
        if (gpuSkinning) {
            arr.push('#define USE_SKINNING_GPU');
        } else {
            arr.push('#define USE_SKINNING_CPU');
        }
    }
    if (useNormalMap) {
        arr.push('#define USE_NORMAL_MAP');
    }
    if (useReceiveShadow) {
        arr.push('#define USE_RECEIVE_SHADOW');
    }
    if (useVertexColor) {
        arr.push('#define USE_VERTEX_COLOR');
    }
    if (useAlphaTest) {
        arr.push('#define USE_ALPHA_TEST');
    }

    return arr;
};

export const buildVertexAttributeLayouts = (attributeDescriptors: AttributeDescriptor[]): string[] => {
    const sortedAttributeDescriptors = [...attributeDescriptors].sort((a, b) => a.location - b.location);

    const attributesList = sortedAttributeDescriptors.map(({ location, size, name, dataType }) => {
        let type;
        // TODO: fix all type
        switch (dataType) {
            case Float32Array:
                switch (size) {
                    case 1:
                        type = 'float';
                        break;
                    case 2:
                        type = 'vec2';
                        break;
                    case 3:
                        type = 'vec3';
                        break;
                    case 4:
                        type = 'vec4';
                        break;
                    default:
                        throw '[buildVertexAttributeLayouts] invalid attribute float';
                }
                break;
            // TODO: signedなパターンが欲しい
            case Uint16Array:
                switch (size) {
                    case 1:
                        type = 'uint';
                        break;
                    case 2:
                        type = 'uvec2';
                        break;
                    case 3:
                        type = 'uvec3';
                        break;
                    case 4:
                        type = 'uvec4';
                        break;
                    default:
                        throw '[buildVertexAttributeLayouts] invalid attribute int';
                }
                break;
            default:
                throw '[buildVertexAttributeLayouts] invalid attribute data type';
        }
        const str = `layout(location = ${location}) in ${type} ${name};`;
        return str;
    });

    return attributesList;
};

const joinShaderLines = (shaderLines: string[]) => {
    return shaderLines
        .map((line) => line.replace(/^\s*$/, ''))
        .join('\n')
        .replaceAll(/\n{3,}/g, '\n');
};

export const buildVertexShader = (
    shader: string,
    attributeDescriptors: AttributeDescriptor[],
    defineOptions: VertexShaderDefines,
    vertexShaderModifier: VertexShaderModifier
) => {
    const shaderLines = shader.split('\n');
    const resultShaderLines: string[] = [];

    shaderLines.forEach((shaderLine) => {
        const pragma = shaderLine.trim().match(pragmaRegex);

        if (!pragma) {
            resultShaderLines.push(shaderLine);
            return;
        }

        const newLines = [];
        const pragmas = pragma[1].trim().split(' ');

        const pragmaName = pragmas[0];

        switch (pragmaName) {
            case ShaderPragmas.BLOCK_DEFINE:
                const defines = buildShaderDefines(defineOptions);
                newLines.push(...defines);
                break;
            case ShaderPragmas.BLOCK_ATTRIBUTES:
                const attributes = buildVertexAttributeLayouts(attributeDescriptors);
                newLines.push(...attributes);
                break;
            case ShaderPragmas.BLOCK_VERTEX_SHADER_BEGIN_MAIN:
                if (vertexShaderModifier[VertexShaderModifiers.beginMain]) {
                    newLines.push(vertexShaderModifier[VertexShaderModifiers.beginMain]);
                }
                break;
            case ShaderPragmas.BLOCK_VERTEX_SHADER_LOCAL_POSITION_POST_PROCESS:
                if (vertexShaderModifier[VertexShaderModifiers.localPositionPostProcess]) {
                    newLines.push(vertexShaderModifier[VertexShaderModifiers.localPositionPostProcess]);
                }
                break;
            // case 'worldPositionPostProcess':
            case ShaderPragmas.BLOCK_VERTEX_SHADER_WORLD_POSITION_POST_PROCESS:
                if (vertexShaderModifier[VertexShaderModifiers.worldPositionPostProcess]) {
                    newLines.push(vertexShaderModifier[VertexShaderModifiers.worldPositionPostProcess]);
                }
                break;
            case ShaderPragmas.BLOCK_VERTEX_SHADER_VIEW_POSITION_POST_PROCESS:
                if (vertexShaderModifier[VertexShaderModifiers.viewPositionPostProcess]) {
                    newLines.push(vertexShaderModifier[VertexShaderModifiers.viewPositionPostProcess]);
                }
                break;
            // case 'outClipPositionPreProcess':
            case ShaderPragmas.BLOCK_VERTEX_SHADER_OUT_CLIP_POSITION_PRE_PROCESS:
                if (vertexShaderModifier[VertexShaderModifiers.outClipPositionPreProcess]) {
                    newLines.push(vertexShaderModifier[VertexShaderModifiers.outClipPositionPreProcess]);
                }
                break;
            case ShaderPragmas.BLOCK_VERTEX_SHADER_LAST_MAIN:
                if (vertexShaderModifier[VertexShaderModifiers.lastMain]) {
                    newLines.push(vertexShaderModifier[VertexShaderModifiers.lastMain]);
                }
                break;

            case 'uniform_transform_vertex':
                newLines.push(`
            uniform mat4 uWorldMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uNormalMatrix;
            `);
                break;
            //
            //             case 'varying_receive_shadow':
            //                 newLines.push(`
            // out vec4 vShadowMapProjectionUv;
            // `);
            //                 break;
            //
            //             case 'uniform_receive_shadow':
            //                 newLines.push(`
            // uniform mat4 uShadowMapProjectionMatrix;
            // `);
            //                 break;
            //
            case 'uniform_engine':
                newLines.push(`
             uniform float uTime;
             `);
                break;
            //             case 'varying_normal_map':
            //                 newLines.push(`
            // out vec3 vTangent;
            // out vec3 vBinormal;
            // `);
            //                 break;
            //
            //             case 'function_skinning':
            //                 newLines.push(calcSkinningMatrixFunc());
            //                 break;
            //
            //             case 'uniform_skinning':
            //                 const jointNum = pragmas[1];
            //                 newLines.push(skinningVertexUniforms(jointNum));
            //                 break;
            //
            //             case 'vertex_normal_map':
            //                 const isSkinningNormalMap = pragmas[1] && pragmas[1] === 'skinning';
            //                 newLines.push(
            //                     isSkinningNormalMap
            //                         ? `
            // vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;
            // vTangent = mat3(uNormalMatrix) * mat3(skinMatrix) * aTangent;
            // vBinormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aBinormal;
            //                 `
            //                         : `
            // vNormal = mat3(uNormalMatrix) * aNormal;
            // vTangent = mat3(uNormalMatrix) * aTangent;
            // vBinormal = mat3(uNormalMatrix) * aBinormal;
            // `
            //                 );
            //                 break;
            //
            //             case 'vertex_skinning':
            //                 newLines.push(skinningVertex(pragmas[1] === 'gpu'));
            //                 break;
            //
            //             case 'vertex_receive_shadow':
            //                 newLines.push(`
            // vShadowMapProjectionUv = uShadowMapProjectionMatrix * worldPosition;
            // `);
            //                 break;
            //
            //             case 'varying_vertex_color':
            //                 newLines.push(`
            // out vec4 vVertexColor;
            // `);
            //                 break;
            default:
                // throw `[buildVertexShader] invalid pragma: ${pragmaName}`;
                break;
        }
        resultShaderLines.push(newLines.join('\n'));
    });
    return joinShaderLines(resultShaderLines);
};

export const buildFragmentShader = (shader: string, defineOptions: VertexShaderDefines) => {
    const shaderLines = shader.split('\n');
    const resultShaderLines: string[] = [];

    shaderLines.forEach((shaderLine) => {
        const pragma = shaderLine.trim().match(pragmaRegex);

        if (!pragma) {
            resultShaderLines.push(shaderLine);
            return;
        }

        const newLines = [];
        const pragmas = pragma[1].trim().split(' ');

        const pragmaName = pragmas[0];

        switch (pragmaName) {
            case ShaderPragmas.BLOCK_DEFINE:
                const defines = buildShaderDefines(defineOptions);
                newLines.push(...defines);
                break;
//             case 'uniform_vertex_matrices':
//                 newLines.push(`uniform mat4 uWorldMatrix;
// uniform mat4 uViewMatrix;
// uniform mat4 uProjectionMatrix;`);
//                 break;
            case ShaderPragmas.DEPTH_FUNCTIONS:
                newLines.push(depthFunctions);
                break;
//             case 'function_depth':
//                 newLines.push(`
// // ref:
// // https://github.com/mebiusbox/docs/blob/master/%EF%BC%93%E6%AC%A1%E5%85%83%E5%BA%A7%E6%A8%99%E5%A4%89%E6%8F%9B%E3%81%AE%E3%83%A1%E3%83%A2%E6%9B%B8%E3%81%8D.pdf
// float viewZToLinearDepth(float z, float near, float far) {
//     return (z + near) / (near - far);
// }
// float perspectiveDepthToLinearDepth(float depth, float near, float far) {
//     float nz = near * depth;
//     return -nz / (far * (depth - 1.) - nz);
// }
// `);
//                 break;
            default:
                throw `[buildFragmentShader] invalid pragma: ${pragmaName}`;
        }
        resultShaderLines.push(newLines.join('\n'));
    });
    return joinShaderLines(resultShaderLines);
};

export const defaultDepthFragmentShader = () => defaultDepthFragment;
