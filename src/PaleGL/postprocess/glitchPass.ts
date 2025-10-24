import { NeedsShorten } from '@/Marionetter/types';
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

export type GlitchPassParameters = {
    enabled: boolean;
    blendRate: number;
};

// PROPERTY定数: NeedsShortenで出し分け（JSON読み込み用）
export const GLITCH_PASS_PARAMETERS_PROPERTY_ENABLED = NeedsShorten ? 'gl_on' : 'enabled';
export const GLITCH_PASS_PARAMETERS_PROPERTY_BLEND_RATE = NeedsShorten ? 'gl_br' : 'blendRate';

// KEY定数: 常に元の名前（プロパティアクセス用）
export const GLITCH_PASS_PARAMETERS_KEY_ENABLED = 'enabled' as const;
export const GLITCH_PASS_PARAMETERS_KEY_BLEND_RATE = 'blendRate' as const;

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
                {
                    name: UNIFORM_NAME_BLEND_RATE,
                    type: UNIFORM_TYPE_FLOAT,
                    value: blendRate,
                },
                {
                    name: UNIFORM_NAME_ASPECT,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 1,
                },
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
