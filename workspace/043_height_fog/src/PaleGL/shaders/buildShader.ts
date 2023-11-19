// -----------------------------------------------
// TODO:
// - out varying を centroid できるようにしたい
// -----------------------------------------------

// .matchAll(/#pragma\s([a-zA-Z0-9_\s]+)/g)

import { AttributeDescriptor } from '@/PaleGL/core/Attribute';
import {
    VertexShaderModifierPragmas,
    FragmentShaderModifierPragmas,
    ShaderPartialPragmas,
    ShaderPragmas,
    VertexShaderModifier,
    FragmentShaderModifier,
} from '@/PaleGL/constants';
import defaultDepthFragment from '@/PaleGL/shaders/default-depth-fragment.glsl';
import depthFunctions from '@/PaleGL/shaders/partial/depth-functions.glsl';
import engineUniforms from '@/PaleGL/shaders/partial/engine-uniforms.glsl';
import transformVertexUniforms from '@/PaleGL/shaders/partial/transform-vertex-uniforms.glsl';
import pseudoHDR from '@/PaleGL/shaders/partial/pseudo-hdr.glsl';

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
};

const insertShaderPairs: {
    [key in ShaderPartialPragmas]: string;
} = {
    [ShaderPartialPragmas.DEPTH_FUNCTIONS]: depthFunctions,
    [ShaderPartialPragmas.ENGINE_UNIFORMS]: engineUniforms,
    [ShaderPartialPragmas.TRANSFORM_VERTEX_UNIFORMS]: transformVertexUniforms,
    [ShaderPartialPragmas.PSEUDO_HDR]: pseudoHDR
};

/**
 * 
 * @param receiveShadow
 * @param isSkinning
 * @param gpuSkinning
 * @param useNormalMap
 * @param useEnvMap
 * @param useReceiveShadow
 * @param useVertexColor
 * @param useAlphaTest
 * @param isInstancing
 */
const buildShaderDefines = ({
    receiveShadow,
    isSkinning,
    gpuSkinning,
    useNormalMap,
    useEnvMap,
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
    if(useEnvMap) {
        arr.push('#define USE_ENV_MAP');
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

    // replace defines
    replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${ShaderPragmas.DEFINES}`, 'g'), () => {
        const defines = buildShaderDefines(defineOptions);
        return defines.join('\n');
    });

    // replace attributes
    replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${ShaderPragmas.ATTRIBUTES}`, 'g'), () => {
        const attributes = buildVertexAttributeLayouts(attributeDescriptors);
        return attributes.join('\n');
    });

    // replace shader block
    Object.keys(VertexShaderModifierPragmas).forEach((key) => {
        const pragma = key as VertexShaderModifierPragmas;
        replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${pragma}`, 'g'), () => {
            if (!vertexShaderModifier[pragma]) {
                return '';
            }
            return vertexShaderModifier[pragma] || '';
        });
    });

    // replace partial shader
    Object.keys(ShaderPartialPragmas).forEach((key) => {
        const pragma = key as ShaderPartialPragmas;
        replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${pragma}`, 'g'), () => {
            return insertShaderPairs[pragma];
        });
    });

    return replacedShader;

    // TODO: なくて大丈夫？
    // return joinShaderLines(resultShaderLines);
};

export const buildFragmentShader = (
    shader: string,
    defineOptions: ShaderDefines,
    fragmentShaderModifier: FragmentShaderModifier
) => {
    let replacedShader: string = shader;

    // replace defines
    replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${ShaderPragmas.DEFINES}`, 'g'), () => {
        const defines = buildShaderDefines(defineOptions);
        return defines.join('\n');
    });

    // replace shader block
    Object.keys(FragmentShaderModifierPragmas).forEach((key) => {
        const pragma = key as FragmentShaderModifierPragmas;
        replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${pragma}`, 'g'), () => {
            if (!fragmentShaderModifier[pragma]) {
                return '';
            }
            return fragmentShaderModifier[pragma] || '';
        });
    });

    // replace partial shader
    Object.keys(ShaderPartialPragmas).forEach((key) => {
        const pragma = key as ShaderPartialPragmas;
        replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${pragma}`, 'g'), () => {
            return insertShaderPairs[pragma];
        });
    });

    return replacedShader;

    // TODO: なくて大丈夫？
    // return joinShaderLines(resultShaderLines);
};

export const defaultDepthFragmentShader = () => defaultDepthFragment;
