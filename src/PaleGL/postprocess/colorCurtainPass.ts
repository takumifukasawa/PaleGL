import { NeedsShorten } from '@/Marionetter/types';
import { createShortenKit, makeLongKeyMap, ShortNamesFor } from '@/Marionetter/types/makePropMap.ts';
import {
    POST_PROCESS_PASS_TYPE_BLACK_CURTAIN_PASS,
    UNIFORM_NAME_BLEND_RATE,
    UNIFORM_TYPE_COLOR,
    UNIFORM_TYPE_FLOAT,
} from '@/PaleGL/constants';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { Color, createColorBlack } from '@/PaleGL/math/color.ts';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
    PostProcessSinglePass,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { renderPostProcessSinglePassBehaviour } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import curtainFragment from '@/PaleGL/shaders/color-curtain-fragment.glsl';

// ref:

const UNIFORM_NAME_COLOR_CURTAIN_COLOR = 'uColor';
const UNIFORM_VALUE_COLOR_CURTAIN_COLOR = createColorBlack();
const UNIFORM_VALUE_COLOR_CURTAIN_BLEND_RATE = 0;

// ---

// ---- Type（既存）----
export type ColorCurtainPassParameters = {
    name?: string;
    enabled: boolean;
    color: Color;
    blendRate: number;
};

// ---- Short names（C#定数に完全一致）----
export const ColorCurtain_ShortNames = {
    enabled: 'cc_on',
    color: 'cc_c',
    blendRate: 'cc_br',
} as const satisfies ShortNamesFor<ColorCurtainPassParameters>;

// ---- 派生（テンプレ同様）----
const ColorCurtain = createShortenKit<ColorCurtainPassParameters>()(ColorCurtain_ShortNames);

// NeedsShorten に応じた「元キー -> 実キー」マップ（short/long 切替）
export const ColorCurtainPassParametersPropertyMap = ColorCurtain.map(NeedsShorten);

// 常に long キー（論理キー）
export const ColorCurtainPassParametersKey = makeLongKeyMap(ColorCurtain_ShortNames);

// 任意：キーのユニオン／拡張型
export type ColorCurtainPassParametersKey = keyof typeof ColorCurtainPassParametersKey;
export type ColorCurtainPassParametersProperty = typeof ColorCurtain.type;

// ---

export type ColorCurtainPass = PostProcessSinglePass & ColorCurtainPassParameters;

export type ColorCurtainPassArgs = PostProcessPassParametersBaseArgs & Partial<ColorCurtainPassParameters>;

export const createColorCurtainPass = (args: ColorCurtainPassArgs): ColorCurtainPass => {
    // parameters: Override<PostProcessPassParametersBase, CurtainPassParameters>;

    const { gpu, name, enabled } = args;
    const fragmentShader = curtainFragment;

    const color = args.color ?? UNIFORM_VALUE_COLOR_CURTAIN_COLOR;
    const blendRate = args.blendRate ?? UNIFORM_VALUE_COLOR_CURTAIN_BLEND_RATE;

    return {
        ...createPostProcessSinglePass({
            gpu,
            name,
            type: POST_PROCESS_PASS_TYPE_BLACK_CURTAIN_PASS, // TODO: 外から出し分け
            fragmentShader,
            uniforms: [
                [UNIFORM_NAME_COLOR_CURTAIN_COLOR, UNIFORM_TYPE_COLOR, UNIFORM_VALUE_COLOR_CURTAIN_COLOR],
                [UNIFORM_NAME_BLEND_RATE, UNIFORM_TYPE_FLOAT, UNIFORM_VALUE_COLOR_CURTAIN_BLEND_RATE],
            ],
            enabled,
        }),
        // parameters
        color,
        blendRate,
    };
};

// setSize(width: number, height: number) {
//     super.setSize(width, height);
//     setMaterialUniformValue(this.material, UNIFORM_NAME_ASPECT, width / height);
// }

export function renderColorCurtainPass(postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) {
    const curtainPass = postProcessPass as ColorCurtainPass;
    setMaterialUniformValue(curtainPass.material, UNIFORM_NAME_COLOR_CURTAIN_COLOR, curtainPass.color);
    setMaterialUniformValue(curtainPass.material, UNIFORM_NAME_BLEND_RATE, curtainPass.blendRate);
    
    renderPostProcessSinglePassBehaviour(postProcessPass, options);
}
