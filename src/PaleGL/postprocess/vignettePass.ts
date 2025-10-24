import { NeedsShorten } from '@/Marionetter/types';
import { POST_PROCESS_PASS_TYPE_VIGNETTE, UNIFORM_TYPE_FLOAT, UNIFORM_NAME_ASPECT } from '@/PaleGL/constants';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
    PostProcessSinglePass,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { renderPostProcessSinglePassBehaviour } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import vignetteFragment from '@/PaleGL/shaders/vignette-fragment.glsl';

// ref:

const UNIFORM_NAME_VIGNETTE_RADIUS_FROM = 'uVignetteRadiusFrom';
const UNIFORM_NAME_VIGNETTE_RADIUS_TO = 'uVignetteRadiusTo';
const UNIFORM_VALUE_VIGNETTE_RADIUS_FROM = 1.77;
const UNIFORM_VALUE_VIGNETTE_RADIUS_TO = 4.484;
const UNIFORM_NAME_VIGNETTE_POWER = 'uVignettePower';
const UNIFORM_VALUE_VIGNETTE_POWER = 1.345;
const UNIFORM_NAME_BLEND_RATE = 'uBlendRate';
const UNIFORM_VALUE_BLEND_RATE = 0.73;

// ---

// ---- Type（既存）----
export type VignettePassParameters = {
    enabled: boolean;
    vignetteRadiusFrom: number;
    vignetteRadiusTo: number;
    vignettePower: number;
    blendRate: number;
};

// PROPERTY定数: NeedsShortenで出し分け（JSON読み込み用）
export const VIGNETTE_PASS_PARAMETERS_PROPERTY_ENABLED = NeedsShorten ? 'vg_on' : 'enabled';
export const VIGNETTE_PASS_PARAMETERS_PROPERTY_VIGNETTE_RADIUS_FROM = NeedsShorten ? 'vg_rf' : 'vignetteRadiusFrom';
export const VIGNETTE_PASS_PARAMETERS_PROPERTY_VIGNETTE_RADIUS_TO = NeedsShorten ? 'vg_rt' : 'vignetteRadiusTo';
export const VIGNETTE_PASS_PARAMETERS_PROPERTY_VIGNETTE_POWER = NeedsShorten ? 'vg_p' : 'vignettePower';
export const VIGNETTE_PASS_PARAMETERS_PROPERTY_BLEND_RATE = NeedsShorten ? 'vg_br' : 'blendRate';

// KEY定数: 常に元の名前（プロパティアクセス用）
export const VIGNETTE_PASS_PARAMETERS_KEY_ENABLED = 'enabled' as const;
export const VIGNETTE_PASS_PARAMETERS_KEY_VIGNETTE_RADIUS_FROM = 'vignetteRadiusFrom' as const;
export const VIGNETTE_PASS_PARAMETERS_KEY_VIGNETTE_RADIUS_TO = 'vignetteRadiusTo' as const;
export const VIGNETTE_PASS_PARAMETERS_KEY_VIGNETTE_POWER = 'vignettePower' as const;
export const VIGNETTE_PASS_PARAMETERS_KEY_BLEND_RATE = 'blendRate' as const;

// ---

export type VignettePass = PostProcessSinglePass & VignettePassParameters;

export type VignettePassArgs = PostProcessPassParametersBaseArgs & Partial<VignettePassParameters>;

export function createVignettePass(args: VignettePassArgs): VignettePass {
    // parameters: Override<PostProcessPassParametersBase, VignettePassParameters>;

    const { gpu, enabled } = args;
    const fragmentShader = vignetteFragment;

    const vignetteRadiusFrom = args.vignetteRadiusFrom ?? UNIFORM_VALUE_VIGNETTE_RADIUS_FROM;
    const vignetteRadiusTo = args.vignetteRadiusTo ?? UNIFORM_VALUE_VIGNETTE_RADIUS_TO;
    const vignettePower = args.vignettePower ?? UNIFORM_VALUE_VIGNETTE_POWER;
    const blendRate = args.blendRate ?? UNIFORM_VALUE_BLEND_RATE;

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: POST_PROCESS_PASS_TYPE_VIGNETTE,
            fragmentShader,
            uniforms: [
                {
                    name: UNIFORM_NAME_VIGNETTE_RADIUS_FROM,
                    type: UNIFORM_TYPE_FLOAT,
                    value: UNIFORM_VALUE_VIGNETTE_RADIUS_FROM,
                },
                {
                    name: UNIFORM_NAME_VIGNETTE_RADIUS_TO,
                    type: UNIFORM_TYPE_FLOAT,
                    value: UNIFORM_VALUE_VIGNETTE_RADIUS_TO,
                },
                {
                    name: UNIFORM_NAME_VIGNETTE_POWER,
                    type: UNIFORM_TYPE_FLOAT,
                    value: UNIFORM_VALUE_VIGNETTE_POWER,
                },
                {
                    name: UNIFORM_NAME_BLEND_RATE,
                    type: UNIFORM_TYPE_FLOAT,
                    value: UNIFORM_VALUE_BLEND_RATE,
                },
                {
                    name: UNIFORM_NAME_ASPECT,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 1,
                },
            ],
            enabled,
        }),
        // parameters
        vignetteRadiusFrom,
        vignetteRadiusTo,
        vignettePower,
        blendRate,
    };
}

// setSize(width: number, height: number) {
//     super.setSize(width, height);
//     setMaterialUniformValue(this.material, UNIFORM_NAME_ASPECT, width / height);
// }

export function renderVignettePass(postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) {
    const vignettePass = postProcessPass as VignettePass;
    setMaterialUniformValue(vignettePass.material, UNIFORM_NAME_VIGNETTE_RADIUS_FROM, vignettePass.vignetteRadiusFrom);
    setMaterialUniformValue(vignettePass.material, UNIFORM_NAME_VIGNETTE_RADIUS_TO, vignettePass.vignetteRadiusTo);
    setMaterialUniformValue(vignettePass.material, UNIFORM_NAME_VIGNETTE_POWER, vignettePass.vignettePower);
    setMaterialUniformValue(vignettePass.material, UNIFORM_NAME_BLEND_RATE, vignettePass.blendRate);

    renderPostProcessSinglePassBehaviour(postProcessPass, options);
}
