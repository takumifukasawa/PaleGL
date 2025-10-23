import { NeedsShorten } from '@/Marionetter/types';
import { createShortenKit, makeLongKeyMap, ShortNamesFor } from '@/Marionetter/types/makePropMap.ts';
import { PostProcessPassType, UniformNames, UNIFORM_TYPE_FLOAT } from '@/PaleGL/constants';
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

// ---- Short names（C#定数に完全一致）----
export const Vignette_ShortNames = {
    enabled: 'vg_on',
    vignetteRadiusFrom: 'vg_rf',
    vignetteRadiusTo: 'vg_rt',
    vignettePower: 'vg_p',
    blendRate: 'vg_br',
} as const satisfies ShortNamesFor<VignettePassParameters>;

// ---- 派生（テンプレ同様）----
const Vignette = createShortenKit<VignettePassParameters>()(Vignette_ShortNames);

// NeedsShorten に応じた「元キー -> 実キー」マップ（short/long 切替）
export const VignettePassParametersPropertyMap = Vignette.map(NeedsShorten);

// 常に long キー（論理キー）
export const VignettePassParametersKey = makeLongKeyMap(Vignette_ShortNames);

// 任意：キーのユニオン／拡張型
export type VignettePassParametersKey = keyof typeof VignettePassParametersKey;
export type VignettePassParametersProperty = typeof Vignette.type;

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
            type: PostProcessPassType.Vignette,
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
                    name: UniformNames.Aspect,
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
//     setMaterialUniformValue(this.material, UniformNames.Aspect, width / height);
// }

export function renderVignettePass(postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) {
    const vignettePass = postProcessPass as VignettePass;
    setMaterialUniformValue(vignettePass.material, UNIFORM_NAME_VIGNETTE_RADIUS_FROM, vignettePass.vignetteRadiusFrom);
    setMaterialUniformValue(vignettePass.material, UNIFORM_NAME_VIGNETTE_RADIUS_TO, vignettePass.vignetteRadiusTo);
    setMaterialUniformValue(vignettePass.material, UNIFORM_NAME_VIGNETTE_POWER, vignettePass.vignettePower);
    setMaterialUniformValue(vignettePass.material, UNIFORM_NAME_BLEND_RATE, vignettePass.blendRate);

    renderPostProcessSinglePassBehaviour(postProcessPass, options);
}
