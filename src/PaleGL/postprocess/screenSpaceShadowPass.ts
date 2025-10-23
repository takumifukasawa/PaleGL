import { NeedsShorten } from '@/Marionetter/types';
import { createShortenKit, makeLongKeyMap, ShortNamesFor } from '@/Marionetter/types/makePropMap.ts';
import {
    POST_PROCESS_PASS_TYPE_SCREEN_SPACE_SHADOW,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_BLOCK_NAME_POINT_LIGHT,
    UniformNames,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_VECTOR3,
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

export const SSS_ShortNames = {
    enabled: 'sss_on',
    bias: 'sss_b',
    jitterSize: 'sss_js',
    sharpness: 'sss_sh',
    strength: 'sss_s',
    ratio: 'sss_r',
    rayStepMultiplier: 'sss_rsm',
} as const satisfies ShortNamesFor<ScreenSpaceShadowPassParameters>;

const SSS = createShortenKit<ScreenSpaceShadowPassParameters>()(SSS_ShortNames);
export const ScreenSpaceShadowPassParametersPropertyMap = SSS.map(NeedsShorten);

export const ScreenSpaceShadowPassParametersKey = makeLongKeyMap(SSS_ShortNames);

export type ScreenSpaceShadowPassParametersKey = keyof typeof ScreenSpaceShadowPassParametersKey;

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
                    name: UniformNames.GBufferBTexture,
                    type: UNIFORM_TYPE_TEXTURE,
                    value: null,
                },
                {
                    name: UniformNames.DepthTexture,
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
