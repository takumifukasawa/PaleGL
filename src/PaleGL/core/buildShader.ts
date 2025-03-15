// -----------------------------------------------
// TODO:
// - out varying を centroid できるようにしたい
// NOTE:
// - modifierを使っているときはshader_minifierを使うとバグになる。変数名が変わるので
// -----------------------------------------------

import { AttributeDescriptor } from '@/PaleGL/core/attribute.ts';
import {
    VertexShaderModifierPragmas,
    FragmentShaderModifierPragmas,
    ShaderPragmas,
    VertexShaderModifiers,
    FragmentShaderModifiers,
} from '@/PaleGL/constants.ts';
import defaultDepthFragment from '@/PaleGL/shaders/default-depth-fragment.glsl';
// import uniformBlockCommon from '@/PaleGL/shaders/partial/uniform-block-common.glsl';
// import uniformBlockTransformations from '@/PaleGL/shaders/partial/uniform-block-transformations.glsl';
// import uniformBlockCamera from '@/PaleGL/shaders/partial/uniform-block-cameras.glsl';

import commonPartialContent from '@/PaleGL/shaders/partial/common.partial.glsl';
import lightingPartialContent from '@/PaleGL/shaders/partial/lighting.partial.glsl';
import bufferVisualizerHeaderContent from '@/PaleGL/shaders/partial/buffer-visualizer-h.partial.glsl';
import uniformBlockPartialContent from '@/PaleGL/shaders/partial/uniform-block.partial.glsl';
import randPartialContent from '@/PaleGL/shaders/partial/rand.partial.glsl';
import toneMappingPartialContent from '@/PaleGL/shaders/partial/tone-mapping.partial.glsl';
import depthPartialContent from '@/PaleGL/shaders/partial/depth.partial.glsl';
import gbufferPartialContent from '@/PaleGL/shaders/partial/gbuffer.partial.glsl';
import gbufferOutPartialContent from '@/PaleGL/shaders/partial/gbuffer-out.partial.glsl';
import effectTexturePartialContent from '@/PaleGL/shaders/partial/effect-texture.partial.glsl';
import raymarchDistanceFunctionsPartialContent from '@/PaleGL/shaders/partial/raymarch-distance-functions.partial.glsl';
import raymarchSceneFunctionsPartialContent from '@/PaleGL/shaders/partial/raymarch-scene-functions.partial.glsl';
import alphaTestPartialContent from '@/PaleGL/shaders/partial/alpha-test.partial.glsl';
import alphaTestFragmentPartialContent from '@/PaleGL/shaders/partial/alpha-test-fragment.partial.glsl';
import vertexColorVertexHeaderPartialContent from '@/PaleGL/shaders/partial/vertex-color-vertex-header.partial.glsl';
import vertexColorFragmentHeaderPartialContent from '@/PaleGL/shaders/partial/vertex-color-fragment-header.partial.glsl';
import normalMapFragmentHeaderPartialContent from '@/PaleGL/shaders/partial/normal-map-fragment-header.partial.glsl';
import normalMapFragmentPartialContent from '@/PaleGL/shaders/partial/normal-map-fragment.partial.glsl';
import envMapPartialContent from '@/PaleGL/shaders/partial/env-map.partial.glsl';

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

// tmp
// const insertShaderPairs: {
//     [key in ShaderPartialPragmas]: string;
// } = {
//     // [ShaderPartialPragmas.ENGINE_UNIFORMS]: uniformBlockCommon,
//     // [ShaderPartialPragmas.TRANSFORM_VERTEX_UNIFORMS]: uniformBlockTransformations,
//     // [ShaderPartialPragmas.CAMERA_UNIFORMS]: uniformBlockCamera,
// };

const includesDict = new Map<string, string>([
    ['common', commonPartialContent],
    ['buffer_visualizer_h', bufferVisualizerHeaderContent],
    ['lighting', lightingPartialContent],
    ['ub', uniformBlockPartialContent],
    ['rand', randPartialContent],
    ['tone', toneMappingPartialContent],
    ['depth', depthPartialContent],
    ['gbuffer', gbufferPartialContent],
    ['gbuffer_o', gbufferOutPartialContent],
    ['etex', effectTexturePartialContent],
    ['raymarch_df', raymarchDistanceFunctionsPartialContent],
    ['raymarch_sf', raymarchSceneFunctionsPartialContent],
    ['alpha_test', alphaTestPartialContent],
    ['alpha_test_f', alphaTestFragmentPartialContent],
    ['vcolor_vh', vertexColorVertexHeaderPartialContent],
    ['vcolor_fh', vertexColorFragmentHeaderPartialContent],
    ['normal_map_fh', normalMapFragmentHeaderPartialContent],
    ['normal_map_f', normalMapFragmentPartialContent],
    ['env_map', envMapPartialContent],
]);

export const replaceShaderIncludes = (src: string) => {
    src = src.replaceAll(/#include\s?<([a-zA-Z_]*)>/g, (_, p1: string) => {
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

const transformUnroll = (src: string) => {
    const unrollSrcRegex = /#pragma UNROLL_START\s+([\s\S]+?)\s+#pragma UNROLL_END/g;
    const unrollSrcMatches = [...src.matchAll(unrollSrcRegex)];
    // console.log(unrollSrcMatches)
    // blockを抜き出す
    for (let i = 0; i < unrollSrcMatches.length; i++) {
        // #pragmaの囲い自体を消す
        const [needsUnrollBlockContent, needsUnrollContent] = unrollSrcMatches[i];

        // 定数 + 中身 になっているはず
        const loopRegex = /^([a-zA-Z0-9_]+)([\s\S]*)/g;
        const loopMatches = [...needsUnrollContent.matchAll(loopRegex)];
        // console.log(needsUnrollContent, loopMatches)
        if (loopMatches.length < 1) {
            console.error(`[transform-glsl-unroll] specify unroll but for loop not found`);
            continue;
        }

        // unrollの中はfor文が一つだけという前提
        const [, loopDefineNameStr, forContent] = loopMatches[0];

        const numRegex = new RegExp(`#define\\s+?${loopDefineNameStr}\\s+?(\\d+)`);
        const numMatch = src.match(numRegex);
        let loopCount = 0;
        if (numMatch) {
            const loopNumStr = numMatch[1];
            loopCount = parseInt(loopNumStr);
            console.log(`[transform-glsl-unroll] loop count is defined: ${loopDefineNameStr} = ${loopCount}`);
        } else {
            loopCount = parseInt(loopDefineNameStr);
            // TODO: 固定値の場合はそのまま使い、#define で定義されている場合はdefineの値をシェーダー内から拾ってくる
            console.log(`[transform-glsl-unroll] loop count is specified: ${loopCount}`);
        }

        let unrolledStr = '';
        for (let j = 0; j < loopCount; j++) {
            // ループのindexを置き換え. UNROLL_i を i に置き換える
            const indexRegex = new RegExp(`UNROLL_N`, 'g');
            const replacedContent = forContent.replaceAll(indexRegex, j.toString());
            unrolledStr += replacedContent;
            // console.log(indexRegex, j, replacedContent)
        }

        src = src.replaceAll(needsUnrollBlockContent, unrolledStr);
    }

    return src;
};

// TODO: なぜか2回走ってしまっているっぽい?
const commonReplacementShader = (src: string, defineOptions: ShaderDefines) => {
    let replacedShader = src;

    // header
    // 2回走っている関係で追加済みの場合は追加しないガードが必要
    if (replacedShader.match(/^#version 300 es/) === null) {
        replacedShader = '#version 300 es\nprecision highp float;\n' + replacedShader;
    }

    // replace includes
    replacedShader = replaceShaderIncludes(replacedShader);

    // replace defines
    replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${ShaderPragmas.DEFINES}`, 'g'), () => {
        const defines = buildShaderDefines(defineOptions);
        return defines.join('\n');
    });

    // tmp
    // // replace partial shader
    // Object.values(ShaderPartialPragmas).forEach((value) => {
    //     const pragma = value as ShaderPartialPragmas;
    //     replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${pragma}`, 'g'), () => {
    //         return insertShaderPairs[pragma];
    //     });
    // });
    
    // transform unroll
    replacedShader = transformUnroll(replacedShader);

    return replacedShader;
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
    vertexShaderModifiers: VertexShaderModifiers
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
            const modifierIndex =  vertexShaderModifiers.findIndex(elem => elem.pragma === pragma);
            if(modifierIndex < 0) {
                return '';
            }
            return vertexShaderModifiers[modifierIndex].value || '';
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
    fragmentShaderModifiers: FragmentShaderModifiers
) => {
    let replacedShader: string = shader;

    replacedShader = commonReplacementShader(replacedShader, defineOptions);

    // replace shader block
    Object.values(FragmentShaderModifierPragmas).forEach((value) => {
        const pragma = value as FragmentShaderModifierPragmas;
        replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${pragma}`, 'g'), () => {
            const modifierIndex =  fragmentShaderModifiers.findIndex(elem => elem.pragma === pragma);
            if(modifierIndex < 0) {
                return '';
            }
            return fragmentShaderModifiers[modifierIndex].value || '';
        });
    });

    return replacedShader;
};

export const defaultDepthFragmentShader = () => defaultDepthFragment;
