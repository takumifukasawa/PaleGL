import { Gpu } from '@/PaleGL/core/gpu.ts';
import fogFragmentShader from '@/PaleGL/shaders/fog-fragment.glsl';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessSinglePass,
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import {
    PostProcessPassType,
    RenderTargetTypes,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
import {Color, createColorWhite} from '@/PaleGL/math/color.ts';
import { Override } from '@/PaleGL/palegl';
import { Texture } from '@/PaleGL/core/texture.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { renderPostProcessSinglePassBehaviour } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';

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

export type FogPassParametersBase = {
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

export type FogPassParameters = PostProcessPassParametersBase & FogPassParametersBase;

export type FogPassParametersArgs = Partial<FogPassParameters>;

type RequiredToOptional<T> = {
    [K in keyof T]?: T[K]; // `?` adds the optional modifier
};

// type OptionalToRequired<T> = {
//     [K in keyof T]-?: T[K]; // `-?` removes the optional modifier
// };

export function generateFogPassParameters(params: RequiredToOptional<FogPassParametersArgs> = {}): FogPassParameters {
    return {
        enabled: params.enabled ?? true,
        fogColor: params.fogColor ?? createColorWhite(),
        fogStrength: params.fogStrength ?? 0.01,
        fogDensity: params.fogDensity ?? 0.023,
        fogDensityAttenuation: params.fogDensityAttenuation ?? 0.45,
        fogEndHeight: params.fogEndHeight ?? 1,
        distanceFogStart: params.distanceFogStart ?? 20,
        distanceFogPower: params.distanceFogPower ?? 0.1,
        distanceFogEnd: params.distanceFogEnd ?? 100,
        sssFogRate: params.sssFogRate ?? 1,
        sssFogColor: params.sssFogColor ?? createColorWhite(),
        blendRate: 1,
    };
}

const lightShaftTextureUniformName = 'uLightShaftTexture';
const volumetricLightTextureUniformName = 'uVolumetricLightTexture';
const screenSpaceShadowTextureUniformName = 'uSSSTexture';

export type FogPass = PostProcessSinglePass;

export function createFogPass(args: { gpu: Gpu; parameters?: FogPassParametersArgs }) {
    const { gpu } = args;
    const fragmentShader = fogFragmentShader;

    const parameters: Override<PostProcessPassParametersBase, FogPassParameters> = generateFogPassParameters();

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: PostProcessPassType.Fog,
            fragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            // renderTargetType: RenderTargetTypes.RGBA16F,
            uniforms: [
                {
                    name: UNIFORM_FOG_COLOR,
                    type: UniformTypes.Color,
                    value: createColorWhite(),
                },
                {
                    // TODO: defaultはblacktextureを渡す。lightshaftがない場合もあるので. もしくはboolを渡す
                    name: UniformNames.DepthTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: lightShaftTextureUniformName,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: volumetricLightTextureUniformName,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: screenSpaceShadowTextureUniformName,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UNIFORM_FOG_STRENGTH,
                    type: UniformTypes.Float,
                    value: parameters.fogStrength,
                },
                {
                    name: UNIFORM_FOG_DENSITY,
                    type: UniformTypes.Float,
                    value: parameters.fogDensity,
                },
                {
                    name: UNIFORM_FOG_DENSITY_ATTENUATION,
                    type: UniformTypes.Float,
                    value: parameters.fogDensityAttenuation,
                },
                {
                    name: UNIFORM_FOG_END_HEIGHT,
                    type: UniformTypes.Float,
                    value: parameters.fogEndHeight,
                },
                {
                    name: UNIFORM_DISTANCE_FOG_START,
                    type: UniformTypes.Float,
                    value: parameters.distanceFogStart,
                },
                {
                    name: UNIFORM_DISTANCE_FOG_END,
                    type: UniformTypes.Float,
                    value: parameters.distanceFogEnd,
                },
                {
                    name: UNIFORM_DISTANCE_FOG_POWER,
                    type: UniformTypes.Float,
                    value: parameters.distanceFogPower,
                },
                {
                    name: UNIFORM_SSS_FOG_RATE,
                    type: UniformTypes.Float,
                    value: parameters.sssFogRate,
                },
                {
                    name: UNIFORM_SSS_FOG_COLOR,
                    type: UniformTypes.Color,
                    value: createColorWhite(),
                },
                {
                    name: UNIFORM_NOISE_TEXTURE,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UniformNames.BlendRate,
                    type: UniformTypes.Float,
                    value: 1,
                },
                // ...PostProcessPassBaseDEPRECATED.commonUniforms,
            ],
            uniformBlockNames: [UniformBlockNames.Common, UniformBlockNames.Camera],
            parameters,
        }),
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
    const parameters = fogPass.parameters as FogPassParameters;

    setMaterialUniformValue(fogPass.material, UNIFORM_FOG_COLOR, parameters.fogColor);
    setMaterialUniformValue(fogPass.material, UNIFORM_FOG_STRENGTH, parameters.fogStrength);
    setMaterialUniformValue(fogPass.material, UNIFORM_FOG_DENSITY, parameters.fogDensity);
    setMaterialUniformValue(fogPass.material, UNIFORM_FOG_DENSITY_ATTENUATION, parameters.fogDensityAttenuation);
    setMaterialUniformValue(fogPass.material, UNIFORM_FOG_END_HEIGHT, parameters.fogEndHeight);
    setMaterialUniformValue(fogPass.material, UNIFORM_DISTANCE_FOG_START, parameters.distanceFogStart);
    setMaterialUniformValue(fogPass.material, UNIFORM_DISTANCE_FOG_END, parameters.distanceFogEnd);
    setMaterialUniformValue(fogPass.material, UNIFORM_DISTANCE_FOG_POWER, parameters.distanceFogPower);
    setMaterialUniformValue(fogPass.material, UNIFORM_SSS_FOG_RATE, parameters.sssFogRate);
    setMaterialUniformValue(fogPass.material, UNIFORM_SSS_FOG_COLOR, parameters.sssFogColor);
    setMaterialUniformValue(fogPass.material, UniformNames.BlendRate, parameters.blendRate);

    renderPostProcessSinglePassBehaviour(fogPass, options);
}
