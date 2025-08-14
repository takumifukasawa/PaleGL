import { UniformNames, UniformTypes, UniformBlockNames, PostProcessPassType } from '@/PaleGL/constants';
import screenSpaceShadowFragmentShader from '@/PaleGL/shaders/screen-space-shadow-fragment.glsl';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessSinglePass,
    PostProcessPassRenderArgs,
    PostProcessPassParametersBaseArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { createVector3, createVector3Zero, Vector3 } from '@/PaleGL/math/vector3.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import {
    renderPostProcessSinglePassBehaviour,
    setPostProcessSinglePassSizeBehaviour,
} from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';

const UNIFORM_BIAS_NAME = 'uBias';
const UNIFORM_JITTER_SIZE_NAME = 'uJitterSize';
const UNIFORM_SHARPNESS_NAME = 'uSharpness';
const UNIFORM_STRENGTH_NAME = 'uStrength';
const UNIFORM_RAY_STEP_MULTIPLIER_NAME = 'uRayStepMultiplier';

export type ScreenSpaceShadowPassParameters = {
    bias: number;
    jitterSize: Vector3;
    sharpness: number;
    strength: number;
    ratio: number;
    rayStepMultiplier: number;
};

export type ScreenSpaceShadowPass = PostProcessSinglePass & ScreenSpaceShadowPassParameters;

export type ScreenSpaceShadowPassArgs = PostProcessPassParametersBaseArgs & Partial<ScreenSpaceShadowPassParameters>;

export function createScreenSpaceShadowPass(args: ScreenSpaceShadowPassArgs) {
    const { gpu, enabled } = args;

    const fragmentShader = screenSpaceShadowFragmentShader;

    const bias = args.bias ?? 0;
    const jitterSize = args.jitterSize ?? createVector3(0.025, 0.025, 0.025);
    const sharpness = args.sharpness ?? 2;
    const strength = args.strength ?? 1;
    const ratio = args.ratio ?? 0.5;
    const rayStepMultiplier = args.rayStepMultiplier ?? 1;

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: PostProcessPassType.ScreenSpaceShadow,
            fragmentShader,
            uniforms: [
                {
                    name: UniformNames.GBufferBTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UniformNames.DepthTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UNIFORM_BIAS_NAME,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: UNIFORM_JITTER_SIZE_NAME,
                    type: UniformTypes.Vector3,
                    value: createVector3Zero(),
                },
                {
                    name: UNIFORM_SHARPNESS_NAME,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: UNIFORM_STRENGTH_NAME,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: UNIFORM_RAY_STEP_MULTIPLIER_NAME,
                    type: UniformTypes.Float,
                    value: 0,
                },
            ],
            uniformBlockNames: [
                UniformBlockNames.Common,
                UniformBlockNames.Transformations,
                UniformBlockNames.Camera,
                UniformBlockNames.PointLight,
            ],
            // renderTargetType: RenderTargetTypes.R16F,
            enabled,
        }),
        // parameters
        bias,
        jitterSize,
        sharpness,
        strength,
        ratio,
        rayStepMultiplier,
    };
}

export function setScreenSpaceShadowPassSize(postProcessPass: PostProcessPassBase, width: number, height: number) {
    const screenSpaceShadowPass = postProcessPass as ScreenSpaceShadowPass;
    setPostProcessSinglePassSizeBehaviour(
        screenSpaceShadowPass,
        width * screenSpaceShadowPass.ratio,
        height * screenSpaceShadowPass.ratio
    );
}

export function renderScreenShadowPass(postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) {
    const screenSpaceShadowPass = postProcessPass as ScreenSpaceShadowPass;
    setMaterialUniformValue(screenSpaceShadowPass.material, UNIFORM_BIAS_NAME, screenSpaceShadowPass.bias);
    setMaterialUniformValue(screenSpaceShadowPass.material, UNIFORM_JITTER_SIZE_NAME, screenSpaceShadowPass.jitterSize);
    setMaterialUniformValue(screenSpaceShadowPass.material, UNIFORM_SHARPNESS_NAME, screenSpaceShadowPass.sharpness);
    setMaterialUniformValue(screenSpaceShadowPass.material, UNIFORM_STRENGTH_NAME, screenSpaceShadowPass.strength);
    setMaterialUniformValue(
        screenSpaceShadowPass.material,
        UNIFORM_RAY_STEP_MULTIPLIER_NAME,
        screenSpaceShadowPass.rayStepMultiplier
    );
    renderPostProcessSinglePassBehaviour(screenSpaceShadowPass, options);
}

export function getScreenSpaceShadowRenderTargetTexture(postProcessPass: PostProcessPassBase) {
    const screenSpaceShadowPass = postProcessPass as ScreenSpaceShadowPass;
    return screenSpaceShadowPass.renderTarget.texture;
}
