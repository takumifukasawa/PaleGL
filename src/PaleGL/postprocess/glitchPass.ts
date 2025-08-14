import { PostProcessPassType, UniformBlockNames, UniformNames, UniformTypes } from '@/PaleGL/constants';
import glitchFragment from '@/PaleGL/shaders/glitch-fragment.glsl';
import {
    createPostProcessSinglePass,
    PostProcessSinglePass,
    PostProcessPassBase,
    PostProcessPassRenderArgs, PostProcessPassParametersBaseArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { renderPostProcessSinglePassBehaviour } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';

const UNIFORM_NAME_BLEND_RATE = UniformNames.BlendRate;

export type GlitchPassParameters = {
    blendRate: number;
};

export type GlitchPass = PostProcessSinglePass & GlitchPassParameters;

export type GlitchPassArgs = PostProcessPassParametersBaseArgs & Partial<GlitchPassParameters>;

export function createGlitchPass(args: GlitchPassArgs): GlitchPass {
    const { gpu, enabled } = args;

    const blendRate = args.blendRate ?? 0;
        
    const fragmentShader = glitchFragment;

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: PostProcessPassType.Glitch,
            fragmentShader,
            uniforms: [
                {
                    name: UNIFORM_NAME_BLEND_RATE,
                    type: UniformTypes.Float,
                    value: blendRate,
                },
                {
                    name: UniformNames.Aspect,
                    type: UniformTypes.Float,
                    value: 1,
                },
            ],
            uniformBlockNames: [UniformBlockNames.Common],
            enabled,
        }),
        // parameters
        blendRate
    };
}

export function renderGlitchPass(postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) {
    const glitchPass = postProcessPass as GlitchPass;
    setMaterialUniformValue(glitchPass.material, UNIFORM_NAME_BLEND_RATE, glitchPass.blendRate);
    renderPostProcessSinglePassBehaviour(glitchPass, options);
}
