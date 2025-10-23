import { NeedsShorten } from '@/Marionetter/types';
import { createShortenKit, makeLongKeyMap, ShortNamesFor } from '@/Marionetter/types/makePropMap.ts';
import {
    POST_PROCESS_PASS_TYPE_FOG,
    RENDER_TARGET_TYPE_R11F_G11F_B10F,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_CAMERA,
    UniformNames,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_COLOR,

} from '@/PaleGL/constants.ts';
import { Texture } from '@/PaleGL/core/texture.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { Color, createColorWhite } from '@/PaleGL/math/color.ts';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
    PostProcessSinglePass,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { renderPostProcessSinglePassBehaviour } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import fogFragmentShader from '@/PaleGL/shaders/fog-fragment.glsl';

const UNIFORM_FOG_COLOR = 'uFogColor';
const UNIFORM_FOG_STRENGTH = 'uFogStrength';
const UNIFORM_FOG_DENSITY = 'uFogDensity';
const UNIFORM_FOG_DENSITY_ATTENUATION = 'uFogDensityAttenuation';
const UNIFORM_FOG_END_HEIGHT = 'uFogEndHeight';
const UNIFORM_DISTANCE_FOG_START = 'uDistanceFogStart';
const UNIFORM_DISTANCE_FOG_END = 'uDistanceFogEnd';
const UNIFORM_DISTANCE_FOG_POWER = 'uDistanceFogPower';
const UNIFORM_SSS_FOG_RATE = 'uSSSFogRate';
const UNIFORM_SSS_FOG_COLOR = 'uSSSFogColor';
const UNIFORM_NOISE_TEXTURE = 'uNoiseTexture';

const lightShaftTextureUniformName = 'uLightShaftTexture';
const volumetricLightTextureUniformName = 'uVolumetricLightTexture';
const screenSpaceShadowTextureUniformName = 'uSSSTexture';

// ---

// ---- Type ----
export type FogPassParameters = {
    enabled: boolean;
    fogColor: Color;
    fogStrength: number;
    fogDensity: number;
    fogDensityAttenuation: number;
    fogEndHeight: number;
    distanceFogStart: number;
    distanceFogPower: number;
    distanceFogEnd: number;
    sssFogRate: number;
    sssFogColor: Color;
    blendRate: number;
};

// ---- Short names（C# に完全一致）----
export const Fog_ShortNames = {
    enabled: 'fg_on',
    fogColor: 'fg_c',
    fogStrength: 'fg_s',
    fogDensity: 'fg_d',
    fogDensityAttenuation: 'fg_da',
    fogEndHeight: 'fg_eh',
    distanceFogStart: 'fg_ds',
    distanceFogPower: 'fg_dp',
    distanceFogEnd: 'fg_de',
    sssFogRate: 'fg_sss_r',
    sssFogColor: 'fg_sss_fc',
    blendRate: 'fg_br',
} as const satisfies ShortNamesFor<FogPassParameters>;

// ---- 派生（テンプレ同様）----
const Fog = createShortenKit<FogPassParameters>()(Fog_ShortNames);

// NeedsShorten に応じた「元キー -> 実キー」マップ
export const FogPassParametersPropertyMap = Fog.map(NeedsShorten);

// 常に long キー（論理キー）
export const FogPassParametersKey = makeLongKeyMap(Fog_ShortNames);

// 任意：キーのユニオン／拡張型
export type FogPassParametersKey = keyof typeof FogPassParametersKey;
export type FogPassParametersProperty = typeof Fog.type;

// ---

export type FogPass = PostProcessSinglePass & FogPassParameters;

export type FogPassArgs = PostProcessPassParametersBaseArgs & Partial<FogPassParameters>;

export function createFogPass(args: FogPassArgs) {
    const { gpu, enabled } = args;
    const fragmentShader = fogFragmentShader;

    const fogColor = args.fogColor ?? createColorWhite();
    const fogStrength = args.fogStrength ?? 0.01;
    const fogDensity = args.fogDensity ?? 0.023;
    const fogDensityAttenuation = args.fogDensityAttenuation ?? 0.45;
    const fogEndHeight = args.fogEndHeight ?? 1;
    const distanceFogStart = args.distanceFogStart ?? 20;
    const distanceFogPower = args.distanceFogPower ?? 0.1;
    const distanceFogEnd = args.distanceFogEnd ?? 100;
    const sssFogRate = args.sssFogRate ?? 1;
    const sssFogColor = args.sssFogColor ?? createColorWhite();
    const blendRate = args.blendRate ?? 1;

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: POST_PROCESS_PASS_TYPE_FOG,
            fragmentShader,
            renderTargetType: RENDER_TARGET_TYPE_R11F_G11F_B10F,
            // renderTargetType: RenderTargetTypes.RGBA16F,
            uniforms: [
                {
                    name: UNIFORM_FOG_COLOR,
                    type: UNIFORM_TYPE_COLOR,
                    value: createColorWhite(),
                },
                {
                    // TODO: defaultはblacktextureを渡す。lightshaftがない場合もあるので. もしくはboolを渡す
                    name: UniformNames.DepthTexture,
                    type: UNIFORM_TYPE_TEXTURE,
                    value: null,
                },
                {
                    name: lightShaftTextureUniformName,
                    type: UNIFORM_TYPE_TEXTURE,
                    value: null,
                },
                {
                    name: volumetricLightTextureUniformName,
                    type: UNIFORM_TYPE_TEXTURE,
                    value: null,
                },
                {
                    name: screenSpaceShadowTextureUniformName,
                    type: UNIFORM_TYPE_TEXTURE,
                    value: null,
                },
                {
                    name: UNIFORM_FOG_STRENGTH,
                    type: UNIFORM_TYPE_FLOAT,
                    value: fogStrength,
                },
                {
                    name: UNIFORM_FOG_DENSITY,
                    type: UNIFORM_TYPE_FLOAT,
                    value: fogDensity,
                },
                {
                    name: UNIFORM_FOG_DENSITY_ATTENUATION,
                    type: UNIFORM_TYPE_FLOAT,
                    value: fogDensityAttenuation,
                },
                {
                    name: UNIFORM_FOG_END_HEIGHT,
                    type: UNIFORM_TYPE_FLOAT,
                    value: fogEndHeight,
                },
                {
                    name: UNIFORM_DISTANCE_FOG_START,
                    type: UNIFORM_TYPE_FLOAT,
                    value: distanceFogStart,
                },
                {
                    name: UNIFORM_DISTANCE_FOG_END,
                    type: UNIFORM_TYPE_FLOAT,
                    value: distanceFogEnd,
                },
                {
                    name: UNIFORM_DISTANCE_FOG_POWER,
                    type: UNIFORM_TYPE_FLOAT,
                    value: distanceFogPower,
                },
                {
                    name: UNIFORM_SSS_FOG_RATE,
                    type: UNIFORM_TYPE_FLOAT,
                    value: sssFogRate,
                },
                {
                    name: UNIFORM_SSS_FOG_COLOR,
                    type: UNIFORM_TYPE_COLOR,
                    value: createColorWhite(),
                },
                {
                    name: UNIFORM_NOISE_TEXTURE,
                    type: UNIFORM_TYPE_TEXTURE,
                    value: null,
                },
                {
                    name: UniformNames.BlendRate,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 1,
                },
                // ...PostProcessPassBaseDEPRECATED.commonUniforms,
            ],
            uniformBlockNames: [UNIFORM_BLOCK_NAME_COMMON, UNIFORM_BLOCK_NAME_CAMERA],
            enabled,
        }),
        // parameters
        fogColor,
        fogStrength,
        fogDensity,
        fogDensityAttenuation,
        fogEndHeight,
        distanceFogStart,
        distanceFogPower,
        distanceFogEnd,
        sssFogRate,
        sssFogColor,
        blendRate,
    };
}

export function setFogPassTextures(
    fogPass: FogPass,
    lightShaftRtTexture: Texture,
    volumetricLightRtTexture: Texture,
    screenSpaceShadowRtTexture: Texture,
    noiseTexture: Texture
) {
    setMaterialUniformValue(fogPass.material, lightShaftTextureUniformName, lightShaftRtTexture);
    setMaterialUniformValue(fogPass.material, volumetricLightTextureUniformName, volumetricLightRtTexture);
    setMaterialUniformValue(fogPass.material, screenSpaceShadowTextureUniformName, screenSpaceShadowRtTexture);
    setMaterialUniformValue(fogPass.material, UNIFORM_NOISE_TEXTURE, noiseTexture);
}

export function renderFogPass(postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) {
    const fogPass = postProcessPass as FogPass;
    setMaterialUniformValue(fogPass.material, UNIFORM_FOG_COLOR, fogPass.fogColor);
    setMaterialUniformValue(fogPass.material, UNIFORM_FOG_STRENGTH, fogPass.fogStrength);
    setMaterialUniformValue(fogPass.material, UNIFORM_FOG_DENSITY, fogPass.fogDensity);
    setMaterialUniformValue(fogPass.material, UNIFORM_FOG_DENSITY_ATTENUATION, fogPass.fogDensityAttenuation);
    setMaterialUniformValue(fogPass.material, UNIFORM_FOG_END_HEIGHT, fogPass.fogEndHeight);
    setMaterialUniformValue(fogPass.material, UNIFORM_DISTANCE_FOG_START, fogPass.distanceFogStart);
    setMaterialUniformValue(fogPass.material, UNIFORM_DISTANCE_FOG_END, fogPass.distanceFogEnd);
    setMaterialUniformValue(fogPass.material, UNIFORM_DISTANCE_FOG_POWER, fogPass.distanceFogPower);
    setMaterialUniformValue(fogPass.material, UNIFORM_SSS_FOG_RATE, fogPass.sssFogRate);
    setMaterialUniformValue(fogPass.material, UNIFORM_SSS_FOG_COLOR, fogPass.sssFogColor);
    setMaterialUniformValue(fogPass.material, UniformNames.BlendRate, fogPass.blendRate);

    renderPostProcessSinglePassBehaviour(fogPass, options);
}
