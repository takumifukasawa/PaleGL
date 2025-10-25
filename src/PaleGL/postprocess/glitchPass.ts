import { NeedsShorten } from '@/Marionetter/types';
import { createShortenKit, makeLongKeyMap, ShortNamesFor } from '@/Marionetter/types/makePropMap.ts';
import {
    POST_PROCESS_PASS_TYPE_GLITCH,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_NAME_BLEND_RATE,
    UNIFORM_NAME_ASPECT,
} from '@/PaleGL/constants';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
    PostProcessSinglePass,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { renderPostProcessSinglePassBehaviour } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import glitchFragment from '@/PaleGL/shaders/glitch-fragment.glsl';

// ---

// ---- Type（既存）----
export type GlitchPassParameters = {
    enabled: boolean;
    blendRate: number;
};

// ---- Short names（C#定数に完全一致）----
export const Glitch_ShortNames = {
    enabled: 'gl_on',
    blendRate: 'gl_br',
} as const satisfies ShortNamesFor<GlitchPassParameters>;

// ---- 派生（テンプレ同様）----
const Glitch = createShortenKit<GlitchPassParameters>()(Glitch_ShortNames);

// NeedsShorten に応じた「元キー -> 実キー」マップ（short/long 切替）
export const GlitchPassParametersPropertyMap = Glitch.map(NeedsShorten);

// 常に long キー（論理キー）
export const GlitchPassParametersKey = makeLongKeyMap(Glitch_ShortNames);

// 任意：キーのユニオン／拡張型
export type GlitchPassParametersKey = keyof typeof GlitchPassParametersKey;
export type GlitchPassParametersProperty = typeof Glitch.type;

// ---

export type GlitchPass = PostProcessSinglePass & GlitchPassParameters;

export type GlitchPassArgs = PostProcessPassParametersBaseArgs & Partial<GlitchPassParameters>;

export function createGlitchPass(args: GlitchPassArgs): GlitchPass {
    const { gpu, enabled } = args;

    const blendRate = args.blendRate ?? 0;

    const fragmentShader = glitchFragment;

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: POST_PROCESS_PASS_TYPE_GLITCH,
            fragmentShader,
            uniforms: [
                [UNIFORM_NAME_BLEND_RATE, UNIFORM_TYPE_FLOAT, blendRate],
                [UNIFORM_NAME_ASPECT, UNIFORM_TYPE_FLOAT, 1],
            ],
            uniformBlockNames: [UNIFORM_BLOCK_NAME_COMMON],
            enabled,
        }),
        // parameters
        blendRate,
    };
}

export function renderGlitchPass(postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) {
    const glitchPass = postProcessPass as GlitchPass;
    setMaterialUniformValue(glitchPass.material, UNIFORM_NAME_BLEND_RATE, glitchPass.blendRate);
    renderPostProcessSinglePassBehaviour(glitchPass, options);
}
