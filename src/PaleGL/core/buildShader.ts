// -----------------------------------------------
// TODO:
// - out varying を centroid できるようにしたい
// NOTE:
// - modifierを使っているときはshader_minifierを使うとバグになる。変数名が変わるので
// -----------------------------------------------

import {
    FRAGMENT_SHADER_MODIFIER_PRAGMA_AFTER_OUT,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_APPEND_ATTRIBUTES,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_APPEND_INCLUDE,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_APPEND_UNIFORMS,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_APPEND_VARYINGS,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_BEFORE_OUT,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_BEGIN_MAIN,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_BLOCK_BEFORE_RAYMARCH_CONTENT,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_END_MAIN,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_GBUFFER_BUILDER_DEFAULT,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_GBUFFER_BUILDER_RAYMARCH,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_GPU_PARTICLE_MODIFY_INITIALIZE,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_GPU_PARTICLE_MODIFY_UPDATE,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE,
    FragmentShaderModifierPragmas,
    FragmentShaderModifiers,
    SHADER_DEFINE_ALPHA_TEST,
    SHADER_DEFINE_ENV_MAP,
    SHADER_DEFINE_HEIGHT_MAP,
    SHADER_DEFINE_INSTANCE_LOOK_DIRECTION,
    SHADER_DEFINE_INSTANCING,
    SHADER_DEFINE_NORMAL_MAP,
    SHADER_DEFINE_RECEIVE_SHADOW,
    SHADER_DEFINE_TRAIL,
    SHADER_DEFINE_VAT,
    SHADER_DEFINE_VAT_LOOK_FORWARD,
    SHADER_PRAGMA_BASE_ATTRIBUTES,
    SHADER_PRAGMA_DEFINES,
    VERTEX_SHADER_MODIFIER_PRAGMA_APPEND_ATTRIBUTES,
    VERTEX_SHADER_MODIFIER_PRAGMA_APPEND_INCLUDE,
    VERTEX_SHADER_MODIFIER_PRAGMA_APPEND_UNIFORMS,
    VERTEX_SHADER_MODIFIER_PRAGMA_APPEND_VARYINGS,
    VERTEX_SHADER_MODIFIER_PRAGMA_BEGIN_MAIN,
    VERTEX_SHADER_MODIFIER_PRAGMA_END_MAIN,
    VERTEX_SHADER_MODIFIER_PRAGMA_INSTANCE_TRANSFORM_PRE_PROCESS,
    VERTEX_SHADER_MODIFIER_PRAGMA_LOCAL_POSITION_POST_PROCESS,
    VERTEX_SHADER_MODIFIER_PRAGMA_OUT_CLIP_POSITION_PRE_PROCESS,
    VERTEX_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE,
    // CUSTOM_BEGIN comment out
    // VERTEX_SHADER_MODIFIER_PRAGMA_VERTEX_COLOR_POST_PROCESS,
    // CUSTOM_END
    VERTEX_SHADER_MODIFIER_PRAGMA_VIEW_POSITION_POST_PROCESS,
    VERTEX_SHADER_MODIFIER_PRAGMA_WORLD_POSITION_POST_PROCESS,
    VertexShaderModifiers,
} from '@/PaleGL/constants.ts';
import { AttributeDescriptor } from '@/PaleGL/core/attribute.ts';
import { isDevelopment } from '@/PaleGL/utilities/envUtilities.ts';

import defaultDepthFragment from '@/PaleGL/shaders/default-depth-fragment.glsl';
import alphaTestFragmentPartialContent from '@/PaleGL/shaders/partial/alpha-test-fragment.partial.glsl';
import alphaTestPartialContent from '@/PaleGL/shaders/partial/alpha-test.partial.glsl';
import bufferVisualizerHeaderContent from '@/PaleGL/shaders/partial/buffer-visualizer-h.partial.glsl';
import commonPartialContent from '@/PaleGL/shaders/partial/common.partial.glsl';
import curlNoisePartialContent from '@/PaleGL/shaders/partial/curl-noise.partial.glsl';
import depthPartialContent from '@/PaleGL/shaders/partial/depth.partial.glsl';
import effectTexturePartialContent from '@/PaleGL/shaders/partial/effect-texture.partial.glsl';
import envMapPartialContent from '@/PaleGL/shaders/partial/env-map.partial.glsl';
import gbufferBuilderDefaultPartialContent from '@/PaleGL/shaders/partial/gbuffer-builder-default.partial.glsl';
import gbufferBuilderRaymarchPartialContent from '@/PaleGL/shaders/partial/gbuffer-builder-raymarch.partial.glsl';
import gbufferOutPartialContent from '@/PaleGL/shaders/partial/gbuffer-out.partial.glsl';
import surfaceUniformsPartialContent from '@/PaleGL/shaders/partial/surface-uniforms.partial.glsl';
import gbufferPartialContent from '@/PaleGL/shaders/partial/gbuffer.partial.glsl';
import geometryHeaderPartialContent from '@/PaleGL/shaders/partial/geometry-h.partial.glsl';
import lightingPartialContent from '@/PaleGL/shaders/partial/lighting.partial.glsl';
import msdfHeadreContent from '@/PaleGL/shaders/partial/msdf-header.glsl';
import normalMapFragmentHeaderPartialContent from '@/PaleGL/shaders/partial/normal-map-fragment-header.partial.glsl';
import normalMapFragmentPartialContent from '@/PaleGL/shaders/partial/normal-map-fragment.partial.glsl';
import objectSpaceRaymarchFunctionsPartialContent from '@/PaleGL/shaders/partial/object-space-raymarch-fragment-functions.partial.glsl';
import perlinPartialContent from '@/PaleGL/shaders/partial/perlin.partial.glsl';
import randPartialContent from '@/PaleGL/shaders/partial/rand.partial.glsl';
import raymarchDistanceFunctionsPartialContent from '@/PaleGL/shaders/partial/raymarch-distance-functions.partial.glsl';
import raymarchSceneFunctionsPartialContent from '@/PaleGL/shaders/partial/raymarch-scene-functions.partial.glsl';
import shapeFontFragmentPartialContent from '@/PaleGL/shaders/partial/shape-font-fragment.partial.glsl';
import shapeFontHeaderPartialContent from '@/PaleGL/shaders/partial/shape-font-h.partial.glsl';
import skyboxHeaderPartialContent from '@/PaleGL/shaders/partial/skybox-h.partial.glsl';
import toneMappingPartialContent from '@/PaleGL/shaders/partial/tone-mapping.partial.glsl';
import uniformBlockPartialContent from '@/PaleGL/shaders/partial/uniform-block.partial.glsl';
import vertexColorFragmentHeaderPartialContent from '@/PaleGL/shaders/partial/vertex-color-fragment-header.partial.glsl';
import vertexColorVertexHeaderPartialContent from '@/PaleGL/shaders/partial/vertex-color-vertex-header.partial.glsl';
// CUSTOM_BEGIN
import raymarchHumanFunctionsPostPartialContent from '@/PaleGL/shaders/partial/custom/raymarch-human-functions-post.partial.glsl';
import raymarchHumanFunctionsPartialContent from '@/PaleGL/shaders/partial/custom/raymarch-human-functions.partial.glsl';
// CUSTOM_END

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
    useVAT: boolean;
    useVATLookForward: boolean;
    isTrail: boolean;
    useHeightMap: boolean;
};

const includesDict = new Map<string, string>([
    ['<common>', commonPartialContent],
    ['<buffer_visualizer_h>', isDevelopment() ? bufferVisualizerHeaderContent : ''],
    ['<lighting>', lightingPartialContent],
    ['<ub>', uniformBlockPartialContent],
    ['<rand>', randPartialContent],
    ['<tone>', toneMappingPartialContent],
    ['<depth>', depthPartialContent],
    ['<gbuffer>', gbufferPartialContent],
    ['<gbuffer_o>', gbufferOutPartialContent],
    ['<surface_u>', surfaceUniformsPartialContent],
    ['<etex>', effectTexturePartialContent],
    ['<raymarch_df>', raymarchDistanceFunctionsPartialContent],
    ['<raymarch_sf>', raymarchSceneFunctionsPartialContent],
    ['<alpha_test>', alphaTestPartialContent],
    ['<alpha_test_f>', alphaTestFragmentPartialContent],
    ['<shape_font_h>', shapeFontHeaderPartialContent],
    ['<shape_font_f>', shapeFontFragmentPartialContent],
    ['<vcolor_vh>', vertexColorVertexHeaderPartialContent],
    ['<vcolor_fh>', vertexColorFragmentHeaderPartialContent],
    ['<normal_map_fh>', normalMapFragmentHeaderPartialContent],
    ['<normal_map_f>', normalMapFragmentPartialContent],
    ['<env_map>', envMapPartialContent],
    ['<skybox_h>', skyboxHeaderPartialContent],
    ['<geometry_h>', geometryHeaderPartialContent],
    ['<os_raymarch_f>', objectSpaceRaymarchFunctionsPartialContent],
    ['<perlin>', perlinPartialContent],
    ['<curl_noise>', curlNoisePartialContent],
    ['<msdf_h>', msdfHeadreContent],
    // CUSTOM_BEGIN
    ['<human_df>', raymarchHumanFunctionsPartialContent],
    ['<human_dfp>', raymarchHumanFunctionsPostPartialContent],
    // CUSTOM_END
]);

export const replaceShaderIncludes = (src: string) => {
    // TODO: include先もreplace対象にし、ネスト状態も対応
    // const expandedIncludes = new Set<string>();
    src = src.replaceAll(/#include\s?(<[a-zA-Z_]*>)/g, (_, p1: string) => {
        // if (expandedIncludes.has(p1)) {
        //     return '';
        // }
        // expandedIncludes.add(p1);

        // return includesDict.get(p1) || '';

        // <lighting> -> lighting
        // const id = p1.slice(1, p1.length - 1);
        return includesDict.get(p1) || '';
    });
    return src;
};

const d = (str: string) => `#define ${str}`;

const buildShaderDefines = ({
    receiveShadow,
    // CUSTOM_BEGIN comment out
    // isSkinning,
    // gpuSkinning,
    // CUSTOM_END
    useNormalMap,
    useEnvMap,
    // CUSTOM_BEGIN comment out
    // useVertexColor,
    // CUSTOM_END
    useAlphaTest,
    isInstancing,
    useInstanceLookDirection,
    useVAT,
    useVATLookForward,
    isTrail,
    useHeightMap,
}: ShaderDefines): string[] => {
    const arr: string[] = [];
    if (receiveShadow) {
        arr.push(d(SHADER_DEFINE_RECEIVE_SHADOW));
    }
    // CUSTOM_BEGIN comment out
    // if (isSkinning) {
    //     if (gpuSkinning) {
    //         arr.push(d(SHADER_DEFINE_SKINNING_GPU));
    //     } else {
    //         arr.push(d(SHADER_DEFINE_SKINNING_CPU));
    //     }
    // }
    // CUSTOM_END
    if (useNormalMap) {
        arr.push(d(SHADER_DEFINE_NORMAL_MAP));
    }
    if (useEnvMap) {
        arr.push(d(SHADER_DEFINE_ENV_MAP));
    }
    // CUSTOM_BEGIN comment out
    // if (useVertexColor) {
    //     arr.push(d(SHADER_DEFINE_VERTEX_COLOR));
    // }
    // CUSTOM_END
    if (useAlphaTest) {
        arr.push(d(SHADER_DEFINE_ALPHA_TEST));
    }
    if (isInstancing) {
        arr.push(d(SHADER_DEFINE_INSTANCING));
    }
    if (useInstanceLookDirection) {
        arr.push(d(SHADER_DEFINE_INSTANCE_LOOK_DIRECTION));
    }
    if (useVAT) {
        arr.push(d(SHADER_DEFINE_VAT));
    }
    if (useVATLookForward) {
        arr.push(d(SHADER_DEFINE_VAT_LOOK_FORWARD));
    }
    if (isTrail) {
        arr.push(d(SHADER_DEFINE_TRAIL));
    }
    if (useHeightMap) {
        arr.push(d(SHADER_DEFINE_HEIGHT_MAP));
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
    replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${SHADER_PRAGMA_DEFINES}`, 'g'), () => {
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

    // replace attributes
    replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${SHADER_PRAGMA_BASE_ATTRIBUTES}`, 'g'), () => {
        const attributes = buildVertexAttributeLayouts(attributeDescriptors);
        return attributes.join('\n');
    });

    // replace shader block
    [
        VERTEX_SHADER_MODIFIER_PRAGMA_LOCAL_POSITION_POST_PROCESS,
        // CUSTOM_BEGIN comment out
        // VERTEX_SHADER_MODIFIER_PRAGMA_VERTEX_COLOR_POST_PROCESS,
        // CUSTOM_END
        VERTEX_SHADER_MODIFIER_PRAGMA_INSTANCE_TRANSFORM_PRE_PROCESS,
        VERTEX_SHADER_MODIFIER_PRAGMA_WORLD_POSITION_POST_PROCESS,
        VERTEX_SHADER_MODIFIER_PRAGMA_VIEW_POSITION_POST_PROCESS,
        VERTEX_SHADER_MODIFIER_PRAGMA_OUT_CLIP_POSITION_PRE_PROCESS,
        VERTEX_SHADER_MODIFIER_PRAGMA_APPEND_INCLUDE,
        VERTEX_SHADER_MODIFIER_PRAGMA_APPEND_VARYINGS,
        VERTEX_SHADER_MODIFIER_PRAGMA_BEGIN_MAIN,
        VERTEX_SHADER_MODIFIER_PRAGMA_END_MAIN,
        VERTEX_SHADER_MODIFIER_PRAGMA_APPEND_ATTRIBUTES,
        VERTEX_SHADER_MODIFIER_PRAGMA_APPEND_UNIFORMS,
        VERTEX_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE,
    ].forEach((pragma) => {
        replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${pragma}`, 'g'), () => {
            const modifierIndex = vertexShaderModifiers.findIndex((elem) => elem[0] === pragma);
            if (modifierIndex < 0) {
                return '';
            }
            return vertexShaderModifiers[modifierIndex][1] || '';
        });
    });

    replacedShader = commonReplacementShader(replacedShader, defineOptions);

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
    fragmentShaderModifiers: FragmentShaderModifiers,
    deletePragmas: FragmentShaderModifierPragmas[]
) => {
    // 型チェックとエラーハンドリング
    if (typeof shader !== 'string') {
        console.error('[buildFragmentShader] Invalid shader type:', typeof shader, shader);
        throw new Error(`Expected string shader, got ${typeof shader}`);
    }

    let replacedShader: string = shader;

    // 消したいmodifierは全部消す
    deletePragmas.forEach((pragma) => {
        replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${pragma}`, 'g'), '');
    });

    // 必ず必要なもの
    // TODO: 定数としてまとめられそう
    if (
        !fragmentShaderModifiers.find(
            ([modifier]) => modifier === FRAGMENT_SHADER_MODIFIER_PRAGMA_GBUFFER_BUILDER_DEFAULT
        )
    ) {
        fragmentShaderModifiers.push([
            FRAGMENT_SHADER_MODIFIER_PRAGMA_GBUFFER_BUILDER_DEFAULT,
            gbufferBuilderDefaultPartialContent,
        ]);
    }
    if (
        !fragmentShaderModifiers.find(
            ([modifier]) => modifier === FRAGMENT_SHADER_MODIFIER_PRAGMA_GBUFFER_BUILDER_RAYMARCH
        )
    ) {
        fragmentShaderModifiers.push([
            FRAGMENT_SHADER_MODIFIER_PRAGMA_GBUFFER_BUILDER_RAYMARCH,
            gbufferBuilderRaymarchPartialContent,
        ]);
    }

    // replace shader block
    [
        FRAGMENT_SHADER_MODIFIER_PRAGMA_BLOCK_BEFORE_RAYMARCH_CONTENT,
        FRAGMENT_SHADER_MODIFIER_PRAGMA_BEFORE_OUT,
        FRAGMENT_SHADER_MODIFIER_PRAGMA_AFTER_OUT,
        FRAGMENT_SHADER_MODIFIER_PRAGMA_APPEND_INCLUDE,
        FRAGMENT_SHADER_MODIFIER_PRAGMA_APPEND_VARYINGS,
        FRAGMENT_SHADER_MODIFIER_PRAGMA_BEGIN_MAIN,
        FRAGMENT_SHADER_MODIFIER_PRAGMA_END_MAIN,
        FRAGMENT_SHADER_MODIFIER_PRAGMA_APPEND_ATTRIBUTES,
        FRAGMENT_SHADER_MODIFIER_PRAGMA_APPEND_UNIFORMS,
        FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE,
        FRAGMENT_SHADER_MODIFIER_PRAGMA_GPU_PARTICLE_MODIFY_INITIALIZE,
        FRAGMENT_SHADER_MODIFIER_PRAGMA_GPU_PARTICLE_MODIFY_UPDATE,
        FRAGMENT_SHADER_MODIFIER_PRAGMA_GBUFFER_BUILDER_DEFAULT,
        FRAGMENT_SHADER_MODIFIER_PRAGMA_GBUFFER_BUILDER_RAYMARCH,
    ].forEach((pragma) => {
        replacedShader = replacedShader.replaceAll(new RegExp(`#pragma ${pragma}`, 'g'), () => {
            const modifierIndex = fragmentShaderModifiers.findIndex((elem) => elem[0] === pragma);
            if (modifierIndex < 0) {
                return '';
            }
            return fragmentShaderModifiers[modifierIndex][1] || '';
        });
    });

    replacedShader = commonReplacementShader(replacedShader, defineOptions);

    return replacedShader;
};

export const defaultDepthFragmentShader = () => defaultDepthFragment;
