import { NeedsShorten } from '@/Marionetter/types';
import { createShortenKit, makeLongKeyMap, ShortNamesFor } from '@/Marionetter/types/makePropMap.ts';
import {
    POST_PROCESS_PASS_TYPE_SSR,
    RENDER_TARGET_TYPE_R11F_G11F_B10F,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_NAME_BLEND_RATE,
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

// ---- Short names (唯一の真実源) ----
// C# の定数と完全一致：
//  ssr_on, ssr_rdb, ssr_rnd, ssr_rmd, ssr_rt,
//  ssr_rjx, ssr_rjy, ssr_fmd, ssr_fxd,
//  ssr_seffmx, ssr_seffMx, ssr_seffmy, ssr_seffMy,
//  ssr_rp, ssr_ar, ssr_br
export const SSR_ShortNames = {
    enabled: 'ssr_on',
    rayDepthBias: 'ssr_rdb',
    rayNearestDistance: 'ssr_rnd',
    rayMaxDistance: 'ssr_rmd',
    reflectionRayThickness: 'ssr_rt',
    reflectionRayJitterSizeX: 'ssr_rjx',
    reflectionRayJitterSizeY: 'ssr_rjy',
    reflectionFadeMinDistance: 'ssr_fmd',
    reflectionFadeMaxDistance: 'ssr_fxd',
    reflectionScreenEdgeFadeFactorMinX: 'ssr_seffmx',
    reflectionScreenEdgeFadeFactorMaxX: 'ssr_seffMx',
    reflectionScreenEdgeFadeFactorMinY: 'ssr_seffmy',
    reflectionScreenEdgeFadeFactorMaxY: 'ssr_seffMy',
    reflectionRoughnessPower: 'ssr_rp',
    reflectionAdditionalRate: 'ssr_ar',
    blendRate: 'ssr_br',
} as const satisfies ShortNamesFor<SSRPassParameters>;

// ---- 派生（テンプレ同様）----
const SSR = createShortenKit<SSRPassParameters>()(SSR_ShortNames);

// NeedsShorten に応じた「元キー -> 実キー」マップ（short/long 切替）
export const SSRPassParametersPropertyMap = SSR.map(NeedsShorten);

// 常に long キーを返す論理キー
export const SSRPassParametersKey = makeLongKeyMap(SSR_ShortNames);

// long キーのユニオン（必要なら）
export type SSRPassParametersKey = keyof typeof SSRPassParametersKey;

// ※ 短縮キーも含む拡張型が必要なら（Bloom と同様）
export type SSRPassParametersProperty = typeof SSR.type;

// ---

export type SsrPass = PostProcessSinglePass & SSRPassParameters;

export type SSRPassArgs = PostProcessPassParametersBaseArgs & Partial<SSRPassParameters>;

export const createSSRPass = (args: SSRPassArgs): SsrPass => {
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
        [UNIFORM_NAME_GBUFFER_A_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
        [UNIFORM_NAME_GBUFFER_B_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
        [UNIFORM_NAME_GBUFFER_C_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
        [UNIFORM_NAME_DEPTH_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
        ['uRayDepthBias', UNIFORM_TYPE_FLOAT, 0],
        ['uRayNearestDistance', UNIFORM_TYPE_FLOAT, 0],
        ['uRayMaxDistance', UNIFORM_TYPE_FLOAT, 0],
        ['uReflectionAdditionalRate', UNIFORM_TYPE_FLOAT, 0],
        ['uReflectionRayThickness', UNIFORM_TYPE_FLOAT, 0],
        ['uReflectionRayJitterSizeX', UNIFORM_TYPE_FLOAT, 0],
        ['uReflectionRayJitterSizeY', UNIFORM_TYPE_FLOAT, 0],
        ['uReflectionFadeMinDistance', UNIFORM_TYPE_FLOAT, 0],
        ['uReflectionFadeMaxDistance', UNIFORM_TYPE_FLOAT, 0],
        ['uReflectionScreenEdgeFadeFactorMinX', UNIFORM_TYPE_FLOAT, 0],
        ['uReflectionScreenEdgeFadeFactorMaxX', UNIFORM_TYPE_FLOAT, 0],
        ['uReflectionScreenEdgeFadeFactorMinY', UNIFORM_TYPE_FLOAT, 0],
        ['uReflectionScreenEdgeFadeFactorMaxY', UNIFORM_TYPE_FLOAT, 0],
        ['uReflectionRoughnessPower', UNIFORM_TYPE_FLOAT, 0],
        [UNIFORM_NAME_BLEND_RATE, UNIFORM_TYPE_FLOAT, 1],
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

export const renderSSRPass = (postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) => {
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
    setMaterialUniformValue(ssrPass.material, UNIFORM_NAME_BLEND_RATE, ssrPass.blendRate);

    renderPostProcessSinglePassBehaviour(ssrPass, options);
}
