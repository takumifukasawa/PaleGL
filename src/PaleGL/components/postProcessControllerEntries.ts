import { Renderer } from '@/PaleGL/core/renderer.ts';
import {
    Color,
    RawColor,
    RAW_COLOR_R_INDEX,
    RAW_COLOR_G_INDEX,
    RAW_COLOR_B_INDEX,
    RAW_COLOR_A_INDEX,
    setColorChannels,
} from '@/PaleGL/math/color.ts';
import {
    RAW_VECTOR3_X_INDEX,
    RAW_VECTOR3_Y_INDEX,
    RAW_VECTOR3_Z_INDEX,
    RawVector3,
    setV3,
    Vector3,
} from '@/PaleGL/math/vector3.ts';
import { BloomPassParametersKey, BloomPassParametersPropertyMap } from '@/PaleGL/postprocess/bloomPass.ts';
import {
    ChromaticAberrationPassParametersKey,
    ChromaticAberrationPassParametersPropertyMap,
} from '@/PaleGL/postprocess/chromaticAberrationPass.ts';
import {
    ColorCurtainPassParametersKey,
    ColorCurtainPassParametersPropertyMap,
} from '@/PaleGL/postprocess/colorCurtainPass.ts';
import {
    DepthOfFieldPassParametersKey,
    DepthOfFieldPassParametersPropertyMap,
} from '@/PaleGL/postprocess/depthOfFieldPass.ts';
import { FogPassParametersKey, FogPassParametersPropertyMap } from '@/PaleGL/postprocess/fogPass.ts';
import { GlitchPassParametersKey, GlitchPassParametersPropertyMap } from '@/PaleGL/postprocess/glitchPass.ts';
import {
    LightShaftPassParametersKey,
    LightShaftPassParametersPropertyMap,
} from '@/PaleGL/postprocess/lightShaftPass.ts';
import {
    ScreenSpaceShadowPassParametersKey,
    ScreenSpaceShadowPassParametersPropertyMap,
} from '@/PaleGL/postprocess/screenSpaceShadowPass.ts';
import { SSAOPassParametersKey, SSAOPassParametersPropertyMap } from '@/PaleGL/postprocess/ssaoPass.ts';
import { SSRPassParametersKey, SSRPassParametersPropertyMap } from '@/PaleGL/postprocess/ssrPass.ts';
import { StreakPassParametersKey, StreakPassParametersPropertyMap } from '@/PaleGL/postprocess/streakPass.ts';
import { VignettePassParametersKey, VignettePassParametersPropertyMap } from '@/PaleGL/postprocess/vignettePass.ts';
import {
    VolumetricLightPassParametersKey,
    VolumetricLightPassParametersPropertyMap,
} from '@/PaleGL/postprocess/volumetricLightPass.ts';

type NumToBoolConverter = (n: number, prop: unknown, key: string) => void;
const numToBoolConverter: NumToBoolConverter = (n: number, prop: unknown, key: string) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line
    (prop[key] as boolean) = n > 0.5;
};
type AssignVector3Converter = (v: RawVector3, prop: unknown, key: string) => void;
const assignVector3Converter: AssignVector3Converter = (v: RawVector3, prop: unknown, key: string) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line
    setV3(prop[key] as Vector3, v[RAW_VECTOR3_X_INDEX], v[RAW_VECTOR3_Y_INDEX], v[RAW_VECTOR3_Z_INDEX]);
};
type AssignColorConverter = (c: RawColor, prop: unknown, key: string) => void;
const assignColorConverter: AssignColorConverter = (c: RawColor, prop: unknown, key: string) => {
    console.log(c,prop,key);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    setColorChannels(prop[key] as Color, c[RAW_COLOR_R_INDEX], c[RAW_COLOR_G_INDEX], c[RAW_COLOR_B_INDEX], c[RAW_COLOR_A_INDEX]);
};

export type PostProcessParametersConversionFunctions =
    | NumToBoolConverter
    | AssignVector3Converter
    | AssignColorConverter;

export type PostProcessParameterBindingValue =
    | [unknown, string]
    | [unknown, string, PostProcessParametersConversionFunctions];

export const buildPostProcessControllerEntries = (renderer: Renderer) => {
    const entries = [
        // CUSTOM_BEGIN comment out
        // // screen space shadow ---
        // [
        //     ScreenSpaceShadowPassParametersPropertyMap.enabled,
        //     [renderer.screenSpaceShadowPass, ScreenSpaceShadowPassParametersKey.enabled, numToBoolConverter],
        // ],
        // [
        //     ScreenSpaceShadowPassParametersPropertyMap.bias,
        //     [renderer.screenSpaceShadowPass, ScreenSpaceShadowPassParametersKey.bias],
        // ],
        // [
        //     ScreenSpaceShadowPassParametersPropertyMap.jitterSize,
        //     [renderer.screenSpaceShadowPass, ScreenSpaceShadowPassParametersKey.jitterSize, assignVector3Converter],
        // ],
        // [
        //     ScreenSpaceShadowPassParametersPropertyMap.sharpness,
        //     [renderer.screenSpaceShadowPass, ScreenSpaceShadowPassParametersKey.sharpness],
        // ],
        // [
        //     ScreenSpaceShadowPassParametersPropertyMap.strength,
        //     [renderer.screenSpaceShadowPass, ScreenSpaceShadowPassParametersKey.strength],
        // ],
        // [
        //     ScreenSpaceShadowPassParametersPropertyMap.ratio,
        //     [renderer.screenSpaceShadowPass, ScreenSpaceShadowPassParametersKey.ratio],
        // ],
        // [
        //     ScreenSpaceShadowPassParametersPropertyMap.rayStepMultiplier,
        //     [renderer.screenSpaceShadowPass, ScreenSpaceShadowPassParametersKey.rayStepMultiplier],
        // ],
        // CUSTOM_END

        // ssao ---

        [
            SSAOPassParametersPropertyMap.enabled,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.enabled, numToBoolConverter],
        ],
        [
            SSAOPassParametersPropertyMap.occlusionSampleLength,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.occlusionSampleLength],
        ],
        [
            SSAOPassParametersPropertyMap.occlusionBias,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.occlusionBias],
        ],
        [
            SSAOPassParametersPropertyMap.occlusionMinDistance,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.occlusionMinDistance],
        ],
        [
            SSAOPassParametersPropertyMap.occlusionMaxDistance,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.occlusionMaxDistance],
        ],
        [
            SSAOPassParametersPropertyMap.occlusionColor,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.occlusionColor, assignColorConverter],
        ],
        [
            SSAOPassParametersPropertyMap.occlusionPower,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.occlusionPower],
        ],
        [
            SSAOPassParametersPropertyMap.occlusionStrength,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.occlusionStrength],
        ],
        [SSAOPassParametersPropertyMap.blendRate, [renderer.ambientOcclusionPass, SSAOPassParametersKey.blendRate]],
        [
            SSAOPassParametersPropertyMap.samplingTexture,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.samplingTexture],
        ],

        // screen space reflection ---

        [SSRPassParametersPropertyMap.enabled, [renderer.ssrPass, SSRPassParametersKey.enabled, numToBoolConverter]],
        [SSRPassParametersPropertyMap.rayDepthBias, [renderer.ssrPass, SSRPassParametersKey.rayDepthBias]],
        [SSRPassParametersPropertyMap.rayNearestDistance, [renderer.ssrPass, SSRPassParametersKey.rayNearestDistance]],
        [SSRPassParametersPropertyMap.rayMaxDistance, [renderer.ssrPass, SSRPassParametersKey.rayMaxDistance]],
        [
            SSRPassParametersPropertyMap.reflectionRayThickness,
            [renderer.ssrPass, SSRPassParametersKey.reflectionRayThickness],
        ],
        [
            SSRPassParametersPropertyMap.reflectionRayJitterSizeX,
            [renderer.ssrPass, SSRPassParametersKey.reflectionRayJitterSizeX],
        ],
        [
            SSRPassParametersPropertyMap.reflectionRayJitterSizeY,
            [renderer.ssrPass, SSRPassParametersKey.reflectionRayJitterSizeY],
        ],
        [
            SSRPassParametersPropertyMap.reflectionFadeMinDistance,
            [renderer.ssrPass, SSRPassParametersKey.reflectionFadeMinDistance],
        ],
        [
            SSRPassParametersPropertyMap.reflectionFadeMaxDistance,
            [renderer.ssrPass, SSRPassParametersKey.reflectionFadeMaxDistance],
        ],
        [
            SSRPassParametersPropertyMap.reflectionScreenEdgeFadeFactorMinX,
            [renderer.ssrPass, SSRPassParametersKey.reflectionScreenEdgeFadeFactorMinX],
        ],
        [
            SSRPassParametersPropertyMap.reflectionScreenEdgeFadeFactorMaxX,
            [renderer.ssrPass, SSRPassParametersKey.reflectionScreenEdgeFadeFactorMaxX],
        ],
        [
            SSRPassParametersPropertyMap.reflectionScreenEdgeFadeFactorMinY,
            [renderer.ssrPass, SSRPassParametersKey.reflectionScreenEdgeFadeFactorMinY],
        ],
        [
            SSRPassParametersPropertyMap.reflectionScreenEdgeFadeFactorMaxY,
            [renderer.ssrPass, SSRPassParametersKey.reflectionScreenEdgeFadeFactorMaxY],
        ],
        [
            SSRPassParametersPropertyMap.reflectionRoughnessPower,
            [renderer.ssrPass, SSRPassParametersKey.reflectionRoughnessPower],
        ],
        [
            SSRPassParametersPropertyMap.reflectionAdditionalRate,
            [renderer.ssrPass, SSRPassParametersKey.reflectionAdditionalRate],
        ],
        [SSRPassParametersPropertyMap.blendRate, [renderer.ssrPass, SSRPassParametersKey.blendRate]],

        // light shaft ---

        [
            LightShaftPassParametersPropertyMap.enabled,
            [renderer.lightShaftPass, LightShaftPassParametersKey.enabled, numToBoolConverter],
        ],
        [LightShaftPassParametersPropertyMap.ratio, [renderer.lightShaftPass, LightShaftPassParametersKey.ratio]],
        [
            LightShaftPassParametersPropertyMap.blendRate,
            [renderer.lightShaftPass, LightShaftPassParametersKey.blendRate],
        ],
        [
            LightShaftPassParametersPropertyMap.passScaleBase,
            [renderer.lightShaftPass, LightShaftPassParametersKey.passScaleBase],
        ],
        [
            LightShaftPassParametersPropertyMap.rayStepStrength,
            [renderer.lightShaftPass, LightShaftPassParametersKey.rayStepStrength],
        ],

        // volumetric light ---

        [
            VolumetricLightPassParametersPropertyMap.enabled,
            [renderer.volumetricLightPass, VolumetricLightPassParametersKey.enabled, numToBoolConverter],
        ],
        [
            VolumetricLightPassParametersPropertyMap.rayStep,
            [renderer.volumetricLightPass, VolumetricLightPassParametersKey.rayStep],
        ],
        [
            VolumetricLightPassParametersPropertyMap.blendRate,
            [renderer.volumetricLightPass, VolumetricLightPassParametersKey.blendRate],
        ],
        [
            VolumetricLightPassParametersPropertyMap.densityMultiplier,
            [renderer.volumetricLightPass, VolumetricLightPassParametersKey.densityMultiplier],
        ],
        [
            VolumetricLightPassParametersPropertyMap.rayJitterSize,
            [renderer.volumetricLightPass, VolumetricLightPassParametersKey.rayJitterSize, assignVector3Converter],
        ],
        [
            VolumetricLightPassParametersPropertyMap.ratio,
            [renderer.volumetricLightPass, VolumetricLightPassParametersKey.ratio],
        ],

        // fog ---

        [FogPassParametersPropertyMap.enabled, [renderer.fogPass, FogPassParametersKey.enabled, numToBoolConverter]],
        [
            FogPassParametersPropertyMap.fogColor,
            [renderer.fogPass, FogPassParametersKey.fogColor, assignColorConverter],
        ],
        [FogPassParametersPropertyMap.fogStrength, [renderer.fogPass, FogPassParametersKey.fogStrength]],
        [FogPassParametersPropertyMap.fogDensity, [renderer.fogPass, FogPassParametersKey.fogDensity]],
        [
            FogPassParametersPropertyMap.fogDensityAttenuation,
            [renderer.fogPass, FogPassParametersKey.fogDensityAttenuation],
        ],
        [FogPassParametersPropertyMap.fogEndHeight, [renderer.fogPass, FogPassParametersKey.fogEndHeight]],
        [FogPassParametersPropertyMap.distanceFogStart, [renderer.fogPass, FogPassParametersKey.distanceFogStart]],
        [FogPassParametersPropertyMap.distanceFogPower, [renderer.fogPass, FogPassParametersKey.distanceFogPower]],
        [FogPassParametersPropertyMap.distanceFogEnd, [renderer.fogPass, FogPassParametersKey.distanceFogEnd]],
        [FogPassParametersPropertyMap.sssFogRate, [renderer.fogPass, FogPassParametersKey.sssFogRate]],
        [
            FogPassParametersPropertyMap.sssFogColor,
            [renderer.fogPass, FogPassParametersKey.sssFogColor, assignColorConverter],
        ],
        [FogPassParametersPropertyMap.blendRate, [renderer.fogPass, FogPassParametersKey.blendRate]],

        // dof ---

        [
            DepthOfFieldPassParametersPropertyMap.enabled,
            [renderer.depthOfFieldPass, DepthOfFieldPassParametersKey.enabled, numToBoolConverter],
        ],
        [
            DepthOfFieldPassParametersPropertyMap.focusDistance,
            [renderer.depthOfFieldPass, DepthOfFieldPassParametersKey.focusDistance],
        ],
        [
            DepthOfFieldPassParametersPropertyMap.focusRange,
            [renderer.depthOfFieldPass, DepthOfFieldPassParametersKey.focusRange],
        ],
        [
            DepthOfFieldPassParametersPropertyMap.bokehRadius,
            [renderer.depthOfFieldPass, DepthOfFieldPassParametersKey.bokehRadius],
        ],

        // bloom ---

        [
            BloomPassParametersPropertyMap.enabled,
            [renderer.bloomPass, BloomPassParametersKey.enabled, numToBoolConverter],
        ],
        [BloomPassParametersPropertyMap.threshold, [renderer.bloomPass, BloomPassParametersKey.threshold]],
        [BloomPassParametersPropertyMap.tone, [renderer.bloomPass, BloomPassParametersKey.tone]],
        [BloomPassParametersPropertyMap.bloomAmount, [renderer.bloomPass, BloomPassParametersKey.bloomAmount]],

        // streak ---

        [
            StreakPassParametersPropertyMap.enabled,
            [renderer.streakPass, StreakPassParametersKey.enabled, numToBoolConverter],
        ],
        [StreakPassParametersPropertyMap.threshold, [renderer.streakPass, StreakPassParametersKey.threshold]],
        [StreakPassParametersPropertyMap.stretch, [renderer.streakPass, StreakPassParametersKey.stretch]],
        [
            StreakPassParametersPropertyMap.color,
            [renderer.streakPass, StreakPassParametersKey.color, assignColorConverter],
        ],
        [StreakPassParametersPropertyMap.intensity, [renderer.streakPass, StreakPassParametersKey.intensity]],
        [StreakPassParametersPropertyMap.verticalScale, [renderer.streakPass, StreakPassParametersKey.verticalScale]],
        [
            StreakPassParametersPropertyMap.horizontalScale,
            [renderer.streakPass, StreakPassParametersKey.horizontalScale],
        ],

        // vignette ---

        [
            VignettePassParametersPropertyMap.enabled,
            [renderer.vignettePass, VignettePassParametersKey.enabled, numToBoolConverter],
        ],
        [
            VignettePassParametersPropertyMap.vignetteRadiusFrom,
            [renderer.vignettePass, VignettePassParametersKey.vignetteRadiusFrom],
        ],
        [
            VignettePassParametersPropertyMap.vignetteRadiusTo,
            [renderer.vignettePass, VignettePassParametersKey.vignetteRadiusTo],
        ],
        [
            VignettePassParametersPropertyMap.vignettePower,
            [renderer.vignettePass, VignettePassParametersKey.vignettePower],
        ],
        [VignettePassParametersPropertyMap.blendRate, [renderer.vignettePass, VignettePassParametersKey.blendRate]],

        // chromatic aberration ---

        [
            ChromaticAberrationPassParametersPropertyMap.enabled,
            [renderer.chromaticAberrationPass, ChromaticAberrationPassParametersKey.enabled, numToBoolConverter],
        ],
        [
            ChromaticAberrationPassParametersPropertyMap.scale,
            [renderer.chromaticAberrationPass, ChromaticAberrationPassParametersKey.scale],
        ],
        [
            ChromaticAberrationPassParametersPropertyMap.power,
            [renderer.chromaticAberrationPass, ChromaticAberrationPassParametersKey.power],
        ],
        [
            ChromaticAberrationPassParametersPropertyMap.blendRate,
            [renderer.chromaticAberrationPass, ChromaticAberrationPassParametersKey.blendRate],
        ],

        // glitch ---

        [
            GlitchPassParametersPropertyMap.enabled,
            [renderer.glitchPass, GlitchPassParametersKey.enabled, numToBoolConverter],
        ],
        [GlitchPassParametersPropertyMap.blendRate, [renderer.glitchPass, GlitchPassParametersKey.blendRate]],

        // color curtain ---

        [
            ColorCurtainPassParametersPropertyMap.enabled,
            [renderer.colorCurtainPass, ColorCurtainPassParametersKey.enabled, numToBoolConverter],
        ],
        [
            ColorCurtainPassParametersPropertyMap.color,
            [renderer.colorCurtainPass, ColorCurtainPassParametersKey.color, assignColorConverter],
        ],
        [
            ColorCurtainPassParametersPropertyMap.blendRate,
            [renderer.colorCurtainPass, ColorCurtainPassParametersKey.blendRate],
        ],
    ] satisfies ReadonlyArray<readonly [string, PostProcessParameterBindingValue]>;

    return new Map<string, PostProcessParameterBindingValue>(entries);
};
