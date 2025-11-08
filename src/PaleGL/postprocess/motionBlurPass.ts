import { NeedsShorten } from '@/Marionetter/types';
import { createShortenKit, makeLongKeyMap, ShortNamesFor } from '@/Marionetter/types/makePropMap.ts';
import { POST_PROCESS_PASS_TYPE_MOTION_BLUR, UNIFORM_NAME_BLEND_RATE, UNIFORM_TYPE_FLOAT } from '@/PaleGL/constants';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
    PostProcessSinglePass,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { renderPostProcessSinglePassBehaviour } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import motionBlurFragment from '@/PaleGL/shaders/motion-blur-fragment.glsl';

const UNIFORM_NAME_MOTION_BLUR_INTENSITY = 'uIntensity';
const UNIFORM_VALUE_MOTION_BLUR_INTENSITY = 0.7;

export type MotionBlurPassParameters = {
    enabled: boolean;
    intensity: number;
    blendRate: number;
};

// 短縮名表（唯一の真実源）
export const MotionBlur_ShortNames = {
    enabled: 'mb_on',
    intensity: 'mb_i',
    blendRate: 'mb_br',
} as const satisfies ShortNamesFor<MotionBlurPassParameters>;

// 生成一式
const MotionBlur = createShortenKit<MotionBlurPassParameters>()(MotionBlur_ShortNames);

// NeedsShorten に応じたプロパティ名マップ
export const MotionBlurPassParametersPropertyMap = MotionBlur.map(NeedsShorten);

// 常に long キー（論理キー）
export const MotionBlurPassParametersKey = makeLongKeyMap(MotionBlur_ShortNames);

// 型（キーのユニオン）
export type MotionBlurPassParametersKey = keyof typeof MotionBlurPassParametersKey;
export type MotionBlurPassParametersProperty = typeof MotionBlur.type;

export type MotionBlurPass = PostProcessSinglePass & MotionBlurPassParameters;

type MotionBlurPassArgs = PostProcessPassParametersBaseArgs & Partial<MotionBlurPassParameters>;

export const createMotionBlurPass = (args: MotionBlurPassArgs): MotionBlurPass => {
    const { gpu, enabled } = args;

    const intensity = args.intensity ?? UNIFORM_VALUE_MOTION_BLUR_INTENSITY;
    const blendRate = args.blendRate ?? 1;

    const fragmentShader = motionBlurFragment;

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: POST_PROCESS_PASS_TYPE_MOTION_BLUR,
            fragmentShader,
            uniforms: [
                [UNIFORM_NAME_MOTION_BLUR_INTENSITY, UNIFORM_TYPE_FLOAT, intensity],
                [UNIFORM_NAME_BLEND_RATE, UNIFORM_TYPE_FLOAT, blendRate],
            ],
            enabled,
        }),
        intensity,
        blendRate,
    };
};

// export const renderMotionBlurPass = (postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) => {
//     const motionBlurPass = postProcessPass as MotionBlurPass;
//     setMaterialUniformValue(motionBlurPass.material, UNIFORM_NAME_MOTION_BLUR_INTENSITY, motionBlurPass.intensity);
//     renderPostProcessSinglePassBehaviour(motionBlurPass, options);
// };
