import { NeedsShorten } from '@/Marionetter/types';
import {
    POST_PROCESS_PASS_TYPE_FOG,
    RENDER_TARGET_TYPE_R11F_G11F_B10F,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_COLOR,
    UNIFORM_NAME_DEPTH_TEXTURE,
    UNIFORM_NAME_BLEND_RATE,
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

// PROPERTY定数: NeedsShortenで出し分け（JSON読み込み用）
export const FOG_PASS_PARAMETERS_PROPERTY_ENABLED = NeedsShorten ? 'fg_on' : 'enabled';
export const FOG_PASS_PARAMETERS_PROPERTY_FOG_COLOR = NeedsShorten ? 'fg_c' : 'fogColor';
export const FOG_PASS_PARAMETERS_PROPERTY_FOG_STRENGTH = NeedsShorten ? 'fg_s' : 'fogStrength';
export const FOG_PASS_PARAMETERS_PROPERTY_FOG_DENSITY = NeedsShorten ? 'fg_d' : 'fogDensity';
export const FOG_PASS_PARAMETERS_PROPERTY_FOG_DENSITY_ATTENUATION = NeedsShorten ? 'fg_da' : 'fogDensityAttenuation';
export const FOG_PASS_PARAMETERS_PROPERTY_FOG_END_HEIGHT = NeedsShorten ? 'fg_eh' : 'fogEndHeight';
export const FOG_PASS_PARAMETERS_PROPERTY_DISTANCE_FOG_START = NeedsShorten ? 'fg_ds' : 'distanceFogStart';
export const FOG_PASS_PARAMETERS_PROPERTY_DISTANCE_FOG_POWER = NeedsShorten ? 'fg_dp' : 'distanceFogPower';
export const FOG_PASS_PARAMETERS_PROPERTY_DISTANCE_FOG_END = NeedsShorten ? 'fg_de' : 'distanceFogEnd';
export const FOG_PASS_PARAMETERS_PROPERTY_SSS_FOG_RATE = NeedsShorten ? 'fg_sss_r' : 'sssFogRate';
export const FOG_PASS_PARAMETERS_PROPERTY_SSS_FOG_COLOR = NeedsShorten ? 'fg_sss_fc' : 'sssFogColor';
export const FOG_PASS_PARAMETERS_PROPERTY_BLEND_RATE = NeedsShorten ? 'fg_br' : 'blendRate';

// KEY定数: 常に元の名前（プロパティアクセス用）
export const FOG_PASS_PARAMETERS_KEY_ENABLED = 'enabled' as const;
export const FOG_PASS_PARAMETERS_KEY_FOG_COLOR = 'fogColor' as const;
export const FOG_PASS_PARAMETERS_KEY_FOG_STRENGTH = 'fogStrength' as const;
export const FOG_PASS_PARAMETERS_KEY_FOG_DENSITY = 'fogDensity' as const;
export const FOG_PASS_PARAMETERS_KEY_FOG_DENSITY_ATTENUATION = 'fogDensityAttenuation' as const;
export const FOG_PASS_PARAMETERS_KEY_FOG_END_HEIGHT = 'fogEndHeight' as const;
export const FOG_PASS_PARAMETERS_KEY_DISTANCE_FOG_START = 'distanceFogStart' as const;
export const FOG_PASS_PARAMETERS_KEY_DISTANCE_FOG_POWER = 'distanceFogPower' as const;
export const FOG_PASS_PARAMETERS_KEY_DISTANCE_FOG_END = 'distanceFogEnd' as const;
export const FOG_PASS_PARAMETERS_KEY_SSS_FOG_RATE = 'sssFogRate' as const;
export const FOG_PASS_PARAMETERS_KEY_SSS_FOG_COLOR = 'sssFogColor' as const;
export const FOG_PASS_PARAMETERS_KEY_BLEND_RATE = 'blendRate' as const;

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
                    name: UNIFORM_NAME_DEPTH_TEXTURE,
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
                    name: UNIFORM_NAME_BLEND_RATE,
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
    setMaterialUniformValue(fogPass.material, UNIFORM_NAME_BLEND_RATE, fogPass.blendRate);

    renderPostProcessSinglePassBehaviour(fogPass, options);
}
