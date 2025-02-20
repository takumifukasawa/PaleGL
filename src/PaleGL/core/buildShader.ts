// -----------------------------------------------
// TODO:
// - out varying を centroid できるようにしたい
// NOTE:
// - modifierを使っているときはshader_minifierを使うとバグになる。変数名が変わるので
// -----------------------------------------------

import { AttributeDescriptor } from '@/PaleGL/core/Attribute.ts';
import {
    VertexShaderModifierPragmas,
    FragmentShaderModifierPragmas,
    ShaderPartialPragmas,
    ShaderPragmas,
    VertexShaderModifier,
    FragmentShaderModifier,
} from '@/PaleGL/constants.ts';
import defaultDepthFragment from '@/PaleGL/shaders/default-depth-fragment.glsl';
import depthFunctions from '@/PaleGL/shaders/partial/depth-functions.glsl';
import uniformBlockCommon from '@/PaleGL/shaders/partial/uniform-block-common.glsl';
import uniformBlockTransformations from '@/PaleGL/shaders/partial/uniform-block-transformations.glsl';
import uniformBlockCamera from '@/PaleGL/shaders/partial/uniform-block-camera.glsl';
import pseudoHDR from '@/PaleGL/shaders/partial/pseudo-hdr.glsl';

import bufferVisualizerHeaderContent from '@/PaleGL/shaders/partial/buffer-visualizer-h.partial.glsl';
import commonPartialContent from '@/PaleGL/shaders/partial/common.partial.glsl';

export type ShaderDefines = {
    receiveShadow: boolean;
    isSkinning: boolean;
    gpuSkinning: boolean;
    useNormalMap: boolean;
    useEnvMap: boolean;
    useReceiveShadow: boolean;
    useVertexColor: boolean;
    useAlphaTest: boolean;
    isInstancing: boolean;
    useInstanceLookDirection: boolean;
};

const insertShaderPairs: {
    [key in ShaderPartialPragmas]: string;
} = {
    [ShaderPartialPragmas.DEPTH_FUNCTIONS]: depthFunctions,
    [ShaderPartialPragmas.ENGINE_UNIFORMS]: uniformBlockCommon,
    [ShaderPartialPragmas.TRANSFORM_VERTEX_UNIFORMS]: uniformBlockTransformations,
    [ShaderPartialPragmas.CAMERA_UNIFORMS]: uniformBlockCamera,
    [ShaderPartialPragmas.PSEUDO_HDR]: pseudoHDR,
};

const includesDict = new Map<string, string>([
    ['common', commonPartialContent],
    ['buffer_visualizer_h', bufferVisualizerHeaderContent],
]);

const replaceShaderIncludes = (src: string) => {
    src = src.replaceAll(/#include\s<([a-zA-Z_]*)>/g, (_, p1: string) => {
        return includesDict.get(p1) || '';
    });
    return src;
};

const buildShaderDefines = ({
    receiveShadow,
    isSkinning,
    gpuSkinning,
    useNormalMap,
    useEnvMap,
    useVertexColor,
    useAlphaTest,
    isInstancing,
    useInstanceLookDirection,
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
    if (useEnvMap) {
        arr.push('#define USE_ENV_MAP');
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
    if (useInstanceLookDirection) {
        arr.push('#define USE_INSTANCE_LOOK_DIRECTION');
    }

    return arr;
};

/**
 *
 * @param attributeDescriptors
 */
const buildVertexAttributeLayouts = (attributeDescriptors: AttributeDescriptor[]): string[] => {
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
                        console.error('[buildVertexAttributeLayouts] invalid attribute float');
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
                        console.error('[buildVertexAttributeLayouts] invalid attribute int');
                }
                break;
            default:
                console.error('[buildVertexAttributeLayouts] invalid attribute data type');
        }
        const str = `layout(location = ${location}) in ${type} ${name};`;
        return str;
    });

    return attributesList;
};

// TODO: なぜか2回走ってしまっているっぽい?
const commonReplacementShader = (src: string, defineOptions: ShaderDefines) => {
    let replacedShader = src;

    // header
    // 2回走っている関係で追加済みの場合は追加しないガードが必要
    if (replacedShader.match(/^#version 300 es/) === null) {
        replacedShader = "#version 300 es\nprecision highp float;\n" + replacedShader;
    }

    replacedShader = replaceShaderIncludes(replacedShader);

    // replace defines
    replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${ShaderPragmas.DEFINES}`, 'g'), () => {
        const defines = buildShaderDefines(defineOptions);
        return defines.join('\n');
    });

    // replace partial shader
    Object.values(ShaderPartialPragmas).forEach((value) => {
        const pragma = value as ShaderPartialPragmas;
        replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${pragma}`, 'g'), () => {
            return insertShaderPairs[pragma];
        });
    });

    return replacedShader.trimStart();
};

/**
 *
 * @param shader
 * @param attributeDescriptors
 * @param defineOptions
 * @param vertexShaderModifier
 */
export const buildVertexShader = (
    shader: string,
    attributeDescriptors: AttributeDescriptor[],
    defineOptions: ShaderDefines,
    vertexShaderModifier: VertexShaderModifier
) => {
    let replacedShader: string = shader;

    replacedShader = commonReplacementShader(replacedShader, defineOptions);

    // replace attributes
    replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${ShaderPragmas.ATTRIBUTES}`, 'g'), () => {
        const attributes = buildVertexAttributeLayouts(attributeDescriptors);
        return attributes.join('\n');
    });

    // replace shader block
    Object.values(VertexShaderModifierPragmas).forEach((value) => {
        const pragma = value as VertexShaderModifierPragmas;
        replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${pragma}`, 'g'), () => {
            if (!vertexShaderModifier[pragma]) {
                return '';
            }
            return vertexShaderModifier[pragma] || '';
        });
    });

    return replacedShader;
};

/**
 *
 * @param shader
 * @param defineOptions
 * @param fragmentShaderModifier
 */
export const buildFragmentShader = (
    shader: string,
    defineOptions: ShaderDefines,
    fragmentShaderModifier: FragmentShaderModifier
) => {
    let replacedShader: string = shader;

    replacedShader = commonReplacementShader(replacedShader, defineOptions);

    // replace shader block
    Object.values(FragmentShaderModifierPragmas).forEach((value) => {
        const pragma = value as FragmentShaderModifierPragmas;
        replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${pragma}`, 'g'), () => {
            if (!fragmentShaderModifier[pragma]) {
                return '';
            }
            return fragmentShaderModifier[pragma] || '';
        });
    });

    return replacedShader;
};

export const defaultDepthFragmentShader = () => defaultDepthFragment;
