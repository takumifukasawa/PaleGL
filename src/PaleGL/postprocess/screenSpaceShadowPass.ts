import { NeedsShorten } from '@/Marionetter/types';
import {
    POST_PROCESS_PASS_TYPE_SCREEN_SPACE_SHADOW,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_BLOCK_NAME_POINT_LIGHT,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_VECTOR3,
    UNIFORM_NAME_GBUFFER_B_TEXTURE,
    UNIFORM_NAME_DEPTH_TEXTURE,
} from '@/PaleGL/constants';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { createVector3, createVector3Zero, Vector3 } from '@/PaleGL/math/vector3.ts';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
    PostProcessSinglePass,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import {
    renderPostProcessSinglePassBehaviour,
    setPostProcessSinglePassSizeBehaviour,
} from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import screenSpaceShadowFragmentShader from '@/PaleGL/shaders/screen-space-shadow-fragment.glsl';

const UNIFORM_BIAS_NAME = 'uBias';
const UNIFORM_JITTER_SIZE_NAME = 'uJitterSize';
const UNIFORM_SHARPNESS_NAME = 'uSharpness';
const UNIFORM_STRENGTH_NAME = 'uStrength';
const UNIFORM_RAY_STEP_MULTIPLIER_NAME = 'uRayStepMultiplier';

export type ScreenSpaceShadowPassParameters = {
    enabled: boolean;
    bias: number;
    jitterSize: Vector3;
    sharpness: number;
    strength: number;
    ratio: number;
    rayStepMultiplier: number;
};

// PROPERTY定数: NeedsShortenで出し分け（JSON読み込み用）
export const SCREEN_SPACE_SHADOW_PASS_PARAMETERS_PROPERTY_ENABLED = NeedsShorten ? 'sss_on' : 'enabled';
export const SCREEN_SPACE_SHADOW_PASS_PARAMETERS_PROPERTY_BIAS = NeedsShorten ? 'sss_b' : 'bias';
export const SCREEN_SPACE_SHADOW_PASS_PARAMETERS_PROPERTY_JITTER_SIZE = NeedsShorten ? 'sss_js' : 'jitterSize';
export const SCREEN_SPACE_SHADOW_PASS_PARAMETERS_PROPERTY_SHARPNESS = NeedsShorten ? 'sss_sh' : 'sharpness';
export const SCREEN_SPACE_SHADOW_PASS_PARAMETERS_PROPERTY_STRENGTH = NeedsShorten ? 'sss_s' : 'strength';
export const SCREEN_SPACE_SHADOW_PASS_PARAMETERS_PROPERTY_RATIO = NeedsShorten ? 'sss_r' : 'ratio';
export const SCREEN_SPACE_SHADOW_PASS_PARAMETERS_PROPERTY_RAY_STEP_MULTIPLIER = NeedsShorten ? 'sss_rsm' : 'rayStepMultiplier';

// KEY定数: 常に元の名前（プロパティアクセス用）
export const SCREEN_SPACE_SHADOW_PASS_PARAMETERS_KEY_ENABLED = 'enabled' as const;
export const SCREEN_SPACE_SHADOW_PASS_PARAMETERS_KEY_BIAS = 'bias' as const;
export const SCREEN_SPACE_SHADOW_PASS_PARAMETERS_KEY_JITTER_SIZE = 'jitterSize' as const;
export const SCREEN_SPACE_SHADOW_PASS_PARAMETERS_KEY_SHARPNESS = 'sharpness' as const;
export const SCREEN_SPACE_SHADOW_PASS_PARAMETERS_KEY_STRENGTH = 'strength' as const;
export const SCREEN_SPACE_SHADOW_PASS_PARAMETERS_KEY_RATIO = 'ratio' as const;
export const SCREEN_SPACE_SHADOW_PASS_PARAMETERS_KEY_RAY_STEP_MULTIPLIER = 'rayStepMultiplier' as const;

// pass ---

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
            type: POST_PROCESS_PASS_TYPE_SCREEN_SPACE_SHADOW,
            fragmentShader,
            uniforms: [
                {
                    name: UNIFORM_NAME_GBUFFER_B_TEXTURE,
                    type: UNIFORM_TYPE_TEXTURE,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_DEPTH_TEXTURE,
                    type: UNIFORM_TYPE_TEXTURE,
                    value: null,
                },
                {
                    name: UNIFORM_BIAS_NAME,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 0,
                },
                {
                    name: UNIFORM_JITTER_SIZE_NAME,
                    type: UNIFORM_TYPE_VECTOR3,
                    value: createVector3Zero(),
                },
                {
                    name: UNIFORM_SHARPNESS_NAME,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 0,
                },
                {
                    name: UNIFORM_STRENGTH_NAME,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 0,
                },
                {
                    name: UNIFORM_RAY_STEP_MULTIPLIER_NAME,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 0,
                },
            ],
            uniformBlockNames: [
                UNIFORM_BLOCK_NAME_COMMON,
                UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
                UNIFORM_BLOCK_NAME_CAMERA,
                UNIFORM_BLOCK_NAME_POINT_LIGHT,
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
