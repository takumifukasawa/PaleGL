import { NeedsShorten } from '@/Marionetter/types';
import {
    POST_PROCESS_PASS_TYPE_SSR,
    RENDER_TARGET_TYPE_R11F_G11F_B10F,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_NAME_GBUFFER_A_TEXTURE,
    UNIFORM_NAME_GBUFFER_B_TEXTURE,
    UNIFORM_NAME_GBUFFER_C_TEXTURE,
    UNIFORM_NAME_DEPTH_TEXTURE,
} from '@/PaleGL/constants';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
    PostProcessSinglePass,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { renderPostProcessSinglePassBehaviour } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import ssrFragmentShader from '@/PaleGL/shaders/ssr-fragment.glsl';

/*
float eps = .001;

float uRayDepthBias = .0099;
float uRayNearestDistance = .13;
float uRayMaxDistance = 3.25;
float uReflectionRayThickness = .3;

float uReflectionRayJitterSizeX = .05;
float uReflectionRayJitterSizeY = .05;

float uReflectionFadeMinDistance = 0.;
float uReflectionFadeMaxDistance = 4.2;

float uReflectionScreenEdgeFadeFactorMinX = .42;
float uReflectionScreenEdgeFadeFactorMaxX = .955;
float uReflectionScreenEdgeFadeFactorMinY = .444;
float uReflectionScreenEdgeFadeFactorMaxY = 1.;

float uReflectionAdditionalRate = .355;

int maxIterationNum = 32;
int binarySearchNum = 8;
*/

// ---- Type ----
export type SSRPassParameters = {
    enabled: boolean;
    rayDepthBias: number;
    rayNearestDistance: number;
    rayMaxDistance: number;
    reflectionRayThickness: number;
    reflectionRayJitterSizeX: number;
    reflectionRayJitterSizeY: number;
    reflectionFadeMinDistance: number;
    reflectionFadeMaxDistance: number;
    reflectionScreenEdgeFadeFactorMinX: number;
    reflectionScreenEdgeFadeFactorMaxX: number;
    reflectionScreenEdgeFadeFactorMinY: number;
    reflectionScreenEdgeFadeFactorMaxY: number;
    reflectionRoughnessPower: number;
    reflectionAdditionalRate: number;
    blendRate: number;
};

// PROPERTY定数: NeedsShortenで出し分け（JSON読み込み用）
export const SSR_PASS_PARAMETERS_PROPERTY_ENABLED = NeedsShorten ? 'ssr_on' : 'enabled';
export const SSR_PASS_PARAMETERS_PROPERTY_RAY_DEPTH_BIAS = NeedsShorten ? 'ssr_rdb' : 'rayDepthBias';
export const SSR_PASS_PARAMETERS_PROPERTY_RAY_NEAREST_DISTANCE = NeedsShorten ? 'ssr_rnd' : 'rayNearestDistance';
export const SSR_PASS_PARAMETERS_PROPERTY_RAY_MAX_DISTANCE = NeedsShorten ? 'ssr_rmd' : 'rayMaxDistance';
export const SSR_PASS_PARAMETERS_PROPERTY_REFLECTION_RAY_THICKNESS = NeedsShorten ? 'ssr_rt' : 'reflectionRayThickness';
export const SSR_PASS_PARAMETERS_PROPERTY_REFLECTION_RAY_JITTER_SIZE_X = NeedsShorten ? 'ssr_rjx' : 'reflectionRayJitterSizeX';
export const SSR_PASS_PARAMETERS_PROPERTY_REFLECTION_RAY_JITTER_SIZE_Y = NeedsShorten ? 'ssr_rjy' : 'reflectionRayJitterSizeY';
export const SSR_PASS_PARAMETERS_PROPERTY_REFLECTION_FADE_MIN_DISTANCE = NeedsShorten ? 'ssr_fmd' : 'reflectionFadeMinDistance';
export const SSR_PASS_PARAMETERS_PROPERTY_REFLECTION_FADE_MAX_DISTANCE = NeedsShorten ? 'ssr_fxd' : 'reflectionFadeMaxDistance';
export const SSR_PASS_PARAMETERS_PROPERTY_REFLECTION_SCREEN_EDGE_FADE_FACTOR_MIN_X = NeedsShorten ? 'ssr_seffmx' : 'reflectionScreenEdgeFadeFactorMinX';
export const SSR_PASS_PARAMETERS_PROPERTY_REFLECTION_SCREEN_EDGE_FADE_FACTOR_MAX_X = NeedsShorten ? 'ssr_seffMx' : 'reflectionScreenEdgeFadeFactorMaxX';
export const SSR_PASS_PARAMETERS_PROPERTY_REFLECTION_SCREEN_EDGE_FADE_FACTOR_MIN_Y = NeedsShorten ? 'ssr_seffmy' : 'reflectionScreenEdgeFadeFactorMinY';
export const SSR_PASS_PARAMETERS_PROPERTY_REFLECTION_SCREEN_EDGE_FADE_FACTOR_MAX_Y = NeedsShorten ? 'ssr_seffMy' : 'reflectionScreenEdgeFadeFactorMaxY';
export const SSR_PASS_PARAMETERS_PROPERTY_REFLECTION_ROUGHNESS_POWER = NeedsShorten ? 'ssr_rp' : 'reflectionRoughnessPower';
export const SSR_PASS_PARAMETERS_PROPERTY_REFLECTION_ADDITIONAL_RATE = NeedsShorten ? 'ssr_ar' : 'reflectionAdditionalRate';
export const SSR_PASS_PARAMETERS_PROPERTY_BLEND_RATE = NeedsShorten ? 'ssr_br' : 'blendRate';

// KEY定数: 常に元の名前（プロパティアクセス用）
export const SSR_PASS_PARAMETERS_KEY_ENABLED = 'enabled' as const;
export const SSR_PASS_PARAMETERS_KEY_RAY_DEPTH_BIAS = 'rayDepthBias' as const;
export const SSR_PASS_PARAMETERS_KEY_RAY_NEAREST_DISTANCE = 'rayNearestDistance' as const;
export const SSR_PASS_PARAMETERS_KEY_RAY_MAX_DISTANCE = 'rayMaxDistance' as const;
export const SSR_PASS_PARAMETERS_KEY_REFLECTION_RAY_THICKNESS = 'reflectionRayThickness' as const;
export const SSR_PASS_PARAMETERS_KEY_REFLECTION_RAY_JITTER_SIZE_X = 'reflectionRayJitterSizeX' as const;
export const SSR_PASS_PARAMETERS_KEY_REFLECTION_RAY_JITTER_SIZE_Y = 'reflectionRayJitterSizeY' as const;
export const SSR_PASS_PARAMETERS_KEY_REFLECTION_FADE_MIN_DISTANCE = 'reflectionFadeMinDistance' as const;
export const SSR_PASS_PARAMETERS_KEY_REFLECTION_FADE_MAX_DISTANCE = 'reflectionFadeMaxDistance' as const;
export const SSR_PASS_PARAMETERS_KEY_REFLECTION_SCREEN_EDGE_FADE_FACTOR_MIN_X = 'reflectionScreenEdgeFadeFactorMinX' as const;
export const SSR_PASS_PARAMETERS_KEY_REFLECTION_SCREEN_EDGE_FADE_FACTOR_MAX_X = 'reflectionScreenEdgeFadeFactorMaxX' as const;
export const SSR_PASS_PARAMETERS_KEY_REFLECTION_SCREEN_EDGE_FADE_FACTOR_MIN_Y = 'reflectionScreenEdgeFadeFactorMinY' as const;
export const SSR_PASS_PARAMETERS_KEY_REFLECTION_SCREEN_EDGE_FADE_FACTOR_MAX_Y = 'reflectionScreenEdgeFadeFactorMaxY' as const;
export const SSR_PASS_PARAMETERS_KEY_REFLECTION_ROUGHNESS_POWER = 'reflectionRoughnessPower' as const;
export const SSR_PASS_PARAMETERS_KEY_REFLECTION_ADDITIONAL_RATE = 'reflectionAdditionalRate' as const;
export const SSR_PASS_PARAMETERS_KEY_BLEND_RATE = 'blendRate' as const;

// ---

export type SsrPass = PostProcessSinglePass & SSRPassParameters;

export type SSRPassArgs = PostProcessPassParametersBaseArgs & Partial<SSRPassParameters>;

export function createSSRPass(args: SSRPassArgs): SsrPass {
    const { gpu, enabled } = args;

    const fragmentShader = ssrFragmentShader;

    const rayDepthBias = args.rayDepthBias ?? 0.0099;
    const rayNearestDistance = args.rayNearestDistance ?? 0.13;
    const rayMaxDistance = args.rayMaxDistance ?? 3.25;
    const reflectionRayThickness = args.reflectionRayThickness ?? 0.3;
    const reflectionRayJitterSizeX = args.reflectionRayJitterSizeX ?? 0.05;
    const reflectionRayJitterSizeY = args.reflectionRayJitterSizeY ?? 0.05;
    const reflectionFadeMinDistance = args.reflectionFadeMinDistance ?? 0;
    const reflectionFadeMaxDistance = args.reflectionFadeMaxDistance ?? 4.2;
    const reflectionScreenEdgeFadeFactorMinX = args.reflectionScreenEdgeFadeFactorMinX ?? 0.42;
    const reflectionScreenEdgeFadeFactorMaxX = args.reflectionScreenEdgeFadeFactorMaxX ?? 0.955;
    const reflectionScreenEdgeFadeFactorMinY = args.reflectionScreenEdgeFadeFactorMinY ?? 0.444;
    const reflectionScreenEdgeFadeFactorMaxY = args.reflectionScreenEdgeFadeFactorMaxY ?? 1;
    const reflectionRoughnessPower = args.reflectionRoughnessPower ?? 0.5;
    const reflectionAdditionalRate = args.reflectionAdditionalRate ?? 0.355;
    const blendRate = args.blendRate ?? 1;

    const baseUniforms: UniformsData = [
        {
            name: UNIFORM_NAME_GBUFFER_A_TEXTURE,
            type: UNIFORM_TYPE_TEXTURE,
            value: null,
        },
        {
            name: UNIFORM_NAME_GBUFFER_B_TEXTURE,
            type: UNIFORM_TYPE_TEXTURE,
            value: null,
        },
        {
            name: UNIFORM_NAME_GBUFFER_C_TEXTURE,
            type: UNIFORM_TYPE_TEXTURE,
            value: null,
        },
        {
            name: UNIFORM_NAME_DEPTH_TEXTURE,
            type: UNIFORM_TYPE_TEXTURE,
            value: null,
        },
        {
            name: 'uRayDepthBias',
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: 'uRayNearestDistance',
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: 'uRayMaxDistance',
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: 'uReflectionAdditionalRate',
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: 'uReflectionRayThickness',
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: 'uReflectionRayJitterSizeX',
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: 'uReflectionRayJitterSizeY',
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: 'uReflectionFadeMinDistance',
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: 'uReflectionFadeMaxDistance',
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: 'uReflectionScreenEdgeFadeFactorMinX',
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: 'uReflectionScreenEdgeFadeFactorMaxX',
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: 'uReflectionScreenEdgeFadeFactorMinY',
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: 'uReflectionScreenEdgeFadeFactorMaxY',
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: 'uReflectionRoughnessPower',
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: 'uBlendRate',
            type: UNIFORM_TYPE_FLOAT,
            value: 1,
        },
    ];

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: POST_PROCESS_PASS_TYPE_SSR,
            fragmentShader,
            uniforms: baseUniforms,
            renderTargetType: RENDER_TARGET_TYPE_R11F_G11F_B10F,
            uniformBlockNames: [UNIFORM_BLOCK_NAME_COMMON],
            enabled,
        }),
        // parameters
        rayDepthBias,
        rayNearestDistance,
        rayMaxDistance,
        reflectionRayThickness,
        reflectionRayJitterSizeX,
        reflectionRayJitterSizeY,
        reflectionFadeMinDistance,
        reflectionFadeMaxDistance,
        reflectionScreenEdgeFadeFactorMinX,
        reflectionScreenEdgeFadeFactorMaxX,
        reflectionScreenEdgeFadeFactorMinY,
        reflectionScreenEdgeFadeFactorMaxY,
        reflectionRoughnessPower,
        reflectionAdditionalRate,
        blendRate,
    };
}

// /**
//  *
//  * @param width
//  * @param height
//  */
// export function setSSRPassSize(postProcessPass: PostProcessPassBaseDEPRECATED, width: number, height: number) {
//     super.setSize(width, height);
//     setMaterialUniformValue(this.material, UNIFORM_NAME_TARGET_WIDTH, width);
//     setMaterialUniformValue(this.material, UNIFORM_NAME_TARGET_HEIGHT, height);
// }

export function renderSSRPass(postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) {
    const ssrPass = postProcessPass as SsrPass;
    setMaterialUniformValue(ssrPass.material, 'uRayDepthBias', ssrPass.rayDepthBias);
    setMaterialUniformValue(ssrPass.material, 'uRayNearestDistance', ssrPass.rayNearestDistance);
    setMaterialUniformValue(ssrPass.material, 'uRayMaxDistance', ssrPass.rayMaxDistance);
    setMaterialUniformValue(ssrPass.material, 'uReflectionRayThickness', ssrPass.reflectionRayThickness);
    setMaterialUniformValue(ssrPass.material, 'uReflectionRayJitterSizeX', ssrPass.reflectionRayJitterSizeX);
    setMaterialUniformValue(ssrPass.material, 'uReflectionRayJitterSizeY', ssrPass.reflectionRayJitterSizeY);
    setMaterialUniformValue(ssrPass.material, 'uReflectionFadeMinDistance', ssrPass.reflectionFadeMinDistance);
    setMaterialUniformValue(ssrPass.material, 'uReflectionFadeMaxDistance', ssrPass.reflectionFadeMaxDistance);
    setMaterialUniformValue(
        ssrPass.material,
        'uReflectionScreenEdgeFadeFactorMinX',
        ssrPass.reflectionScreenEdgeFadeFactorMinX
    );
    setMaterialUniformValue(
        ssrPass.material,
        'uReflectionScreenEdgeFadeFactorMaxX',
        ssrPass.reflectionScreenEdgeFadeFactorMaxX
    );
    setMaterialUniformValue(
        ssrPass.material,
        'uReflectionScreenEdgeFadeFactorMinY',
        ssrPass.reflectionScreenEdgeFadeFactorMinY
    );
    setMaterialUniformValue(
        ssrPass.material,
        'uReflectionScreenEdgeFadeFactorMaxY',
        ssrPass.reflectionScreenEdgeFadeFactorMaxY
    );

    setMaterialUniformValue(ssrPass.material, 'uReflectionAdditionalRate', ssrPass.reflectionAdditionalRate);
    setMaterialUniformValue(ssrPass.material, 'uReflectionRoughnessPower', ssrPass.reflectionRoughnessPower);
    setMaterialUniformValue(ssrPass.material, 'uBlendRate', ssrPass.blendRate);

    renderPostProcessSinglePassBehaviour(ssrPass, options);
}
