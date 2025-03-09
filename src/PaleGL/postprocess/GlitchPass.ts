import { PostProcessPassType, UniformBlockNames, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import glitchFragment from '@/PaleGL/shaders/glitch-fragment.glsl';
import {
    PostProcessPassBase,
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/PostProcessPassBase';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';

export type GlitchPassParameters = PostProcessPassParametersBase & {
    blendRate: number;
};

export type GlitchPassParametersArgs = Partial<GlitchPassParameters>;

export function generateGlitchPassParameters(params: GlitchPassParametersArgs = {}): GlitchPassParameters {
    return {
        enabled: params.enabled ?? true,
        blendRate: params.blendRate ?? 0,
    };
}

const UNIFORM_NAME_BLEND_RATE = UniformNames.BlendRate;

export class GlitchPass extends PostProcessPassBase {
    parameters: GlitchPassParameters;

    constructor(args: { gpu: Gpu; parameters?: GlitchPassParametersArgs }) {
        const { gpu } = args;

        const parameters = generateGlitchPassParameters(args.parameters ?? {});

        const fragmentShader = glitchFragment;

        super({
            gpu,
            type: PostProcessPassType.Glitch,
            fragmentShader,
            uniforms: [
                {
                    name: UNIFORM_NAME_BLEND_RATE,
                    type: UniformTypes.Float,
                    value: parameters.blendRate,
                },
                {
                    name: UniformNames.Aspect,
                    type: UniformTypes.Float,
                    value: 1,
                },
            ],
            uniformBlockNames: [UniformBlockNames.Common],
            parameters,
        });

        this.parameters = parameters;
    }

    setSize(width: number, height: number) {
        super.setSize(width, height);
        setMaterialUniformValue(this.material, UniformNames.TargetWidth, width);
        setMaterialUniformValue(this.material, UniformNames.TargetHeight, height);
        setMaterialUniformValue(this.material, UniformNames.Aspect, width / height);
    }

    render(options: PostProcessPassRenderArgs) {
        setMaterialUniformValue(this.material, UNIFORM_NAME_BLEND_RATE, this.parameters.blendRate);

        super.render(options);
    }
}
