// -----------------------------------------------
// TODO:
// - out varying を centroid できるようにしたい
// -----------------------------------------------

// .matchAll(/#pragma\s([a-zA-Z0-9_\s]+)/g)

import { AttributeDescriptor } from '@/PaleGL/core/Attribute';

import { VertexShaderModifier } from '@/PaleGL/materials/Material';
import defaultDepthFragment from '@/PaleGL/shaders/default-depth-fragment.glsl';
import { ShaderPragmas, VertexShaderModifiers } from '@/PaleGL/constants';
import depthFunctions from '@/PaleGL/shaders/partial/depth-functions.glsl';
import engineUniforms from '@/PaleGL/shaders/partial/engine-uniforms.glsl';
import transformVertexUniforms from '@/PaleGL/shaders/partial/transform-vertex-uniforms.glsl';

const pragmaRegex = /^#pragma(.*)/;

export type ShaderDefines = {
    receiveShadow: boolean;
    isSkinning: boolean;
    gpuSkinning: boolean;
    useNormalMap: boolean;
    useReceiveShadow: boolean;
    useVertexColor: boolean;
    useAlphaTest: boolean;
    isInstancing: boolean;
};

const buildShaderDefines = ({
    receiveShadow,
    isSkinning,
    gpuSkinning,
    useNormalMap,
    useReceiveShadow,
    useVertexColor,
    useAlphaTest,
    isInstancing,
}: ShaderDefines): string[] => {
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
    if (isInstancing) {
        arr.push('#define USE_INSTANCING');
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
    defineOptions: ShaderDefines,
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
            case ShaderPragmas.DEFINES:
                const defines = buildShaderDefines(defineOptions);
                newLines.push(...defines);
                break;
            case ShaderPragmas.ATTRIBUTES:
                const attributes = buildVertexAttributeLayouts(attributeDescriptors);
                newLines.push(...attributes);
                break;
            case ShaderPragmas.BEGIN_MAIN:
                if (vertexShaderModifier[VertexShaderModifiers.beginMain]) {
                    newLines.push(vertexShaderModifier[VertexShaderModifiers.beginMain]);
                }
                break;
            case ShaderPragmas.LOCAL_POSITION_POST_PROCESS:
                if (vertexShaderModifier[VertexShaderModifiers.localPositionPostProcess]) {
                    newLines.push(vertexShaderModifier[VertexShaderModifiers.localPositionPostProcess]);
                }
                break;
            // case 'worldPositionPostProcess':
            case ShaderPragmas.WORLD_POSITION_POST_PROCESS:
                if (vertexShaderModifier[VertexShaderModifiers.worldPositionPostProcess]) {
                    newLines.push(vertexShaderModifier[VertexShaderModifiers.worldPositionPostProcess]);
                }
                break;
            case ShaderPragmas.VIEW_POSITION_POST_PROCESS:
                if (vertexShaderModifier[VertexShaderModifiers.viewPositionPostProcess]) {
                    newLines.push(vertexShaderModifier[VertexShaderModifiers.viewPositionPostProcess]);
                }
                break;
            // case 'outClipPositionPreProcess':
            case ShaderPragmas.OUT_CLIP_POSITION_PRE_PROCESS:
                if (vertexShaderModifier[VertexShaderModifiers.outClipPositionPreProcess]) {
                    newLines.push(vertexShaderModifier[VertexShaderModifiers.outClipPositionPreProcess]);
                }
                break;
            case ShaderPragmas.LAST_MAIN:
                if (vertexShaderModifier[VertexShaderModifiers.lastMain]) {
                    newLines.push(vertexShaderModifier[VertexShaderModifiers.lastMain]);
                }
                break;

            case ShaderPragmas.TRANSFORM_VERTEX_UNIFORMS:
                newLines.push(transformVertexUniforms);
                break;
            case ShaderPragmas.ENGINE_UNIFORMS:
                newLines.push(engineUniforms);
                break;
            default:
                // throw `[buildVertexShader] invalid pragma: ${pragmaName}`;
                break;
        }
        resultShaderLines.push(newLines.join('\n'));
    });
    return joinShaderLines(resultShaderLines);
};

export const buildFragmentShader = (shader: string, defineOptions: ShaderDefines) => {
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
            case ShaderPragmas.DEFINES:
                const defines = buildShaderDefines(defineOptions);
                newLines.push(...defines);
                break;
            case ShaderPragmas.DEPTH_FUNCTIONS:
                newLines.push(depthFunctions);
                break;
            default:
                throw `[buildFragmentShader] invalid pragma: ${pragmaName}`;
        }
        resultShaderLines.push(newLines.join('\n'));
    });
    return joinShaderLines(resultShaderLines);
};

export const defaultDepthFragmentShader = () => defaultDepthFragment;
