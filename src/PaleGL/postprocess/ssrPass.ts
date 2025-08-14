import {
    PostProcessPassType,
    RenderTargetTypes,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants';
import ssrFragmentShader from '@/PaleGL/shaders/ssr-fragment.glsl';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessSinglePass,
    PostProcessPassRenderArgs, PostProcessPassParametersBaseArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { renderPostProcessSinglePassBehaviour } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';

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

export type SSRPassParameters = {
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
            name: UniformNames.GBufferATexture,
            type: UniformTypes.Texture,
            value: null,
        },
        {
            name: UniformNames.GBufferBTexture,
            type: UniformTypes.Texture,
            value: null,
        },
        {
            name: UniformNames.GBufferCTexture,
            type: UniformTypes.Texture,
            value: null,
        },
        {
            name: UniformNames.DepthTexture,
            type: UniformTypes.Texture,
            value: null,
        },
        {
            name: 'uRayDepthBias',
            type: UniformTypes.Float,
            value: 0,
        },
        {
            name: 'uRayNearestDistance',
            type: UniformTypes.Float,
            value: 0,
        },
        {
            name: 'uRayMaxDistance',
            type: UniformTypes.Float,
            value: 0,
        },
        {
            name: 'uReflectionAdditionalRate',
            type: UniformTypes.Float,
            value: 0,
        },
        {
            name: 'uReflectionRayThickness',
            type: UniformTypes.Float,
            value: 0,
        },
        {
            name: 'uReflectionRayJitterSizeX',
            type: UniformTypes.Float,
            value: 0,
        },
        {
            name: 'uReflectionRayJitterSizeY',
            type: UniformTypes.Float,
            value: 0,
        },
        {
            name: 'uReflectionFadeMinDistance',
            type: UniformTypes.Float,
            value: 0,
        },
        {
            name: 'uReflectionFadeMaxDistance',
            type: UniformTypes.Float,
            value: 0,
        },
        {
            name: 'uReflectionScreenEdgeFadeFactorMinX',
            type: UniformTypes.Float,
            value: 0,
        },
        {
            name: 'uReflectionScreenEdgeFadeFactorMaxX',
            type: UniformTypes.Float,
            value: 0,
        },
        {
            name: 'uReflectionScreenEdgeFadeFactorMinY',
            type: UniformTypes.Float,
            value: 0,
        },
        {
            name: 'uReflectionScreenEdgeFadeFactorMaxY',
            type: UniformTypes.Float,
            value: 0,
        },
        {
            name: 'uReflectionRoughnessPower',
            type: UniformTypes.Float,
            value: 0,
        },
        {
            name: 'uBlendRate',
            type: UniformTypes.Float,
            value: 1,
        },
    ];

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: PostProcessPassType.SSR,
            fragmentShader,
            uniforms: baseUniforms,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniformBlockNames: [UniformBlockNames.Common],
            enabled
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
//     setMaterialUniformValue(this.material, UniformNames.TargetWidth, width);
//     setMaterialUniformValue(this.material, UniformNames.TargetHeight, height);
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
