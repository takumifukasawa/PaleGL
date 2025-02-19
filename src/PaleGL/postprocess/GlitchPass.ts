import { PostProcessPassType, UniformBlockNames, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import glitchFragment from '@/PaleGL/shaders/glitch-fragment.glsl';
import {
    PostProcessPassBase,
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/PostProcessPassBase';

export type GlitchPassParameters = PostProcessPassParametersBase & {
    blendRate: number;
};

export type GlitchPassParametersArgs = Partial<GlitchPassParameters>;

export function generateGlitchPassParameters(params: GlitchPassParametersArgs = {}): GlitchPassParameters {
    return {
        enabled: params.enabled ?? true,
        blendRate: params.blendRate ?? 0
    };
}

const UNIFORM_NAME_BLEND_RATE = UniformNames.BlendRate;

export class GlitchPass extends PostProcessPassBase {
    parameters: GlitchPassParameters;

    constructor(args: { gpu: GPU; parameters?: GlitchPassParametersArgs }) {
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
                }
            ],
            uniformBlockNames: [UniformBlockNames.Common],
            parameters,
        });
        
        this.parameters = parameters;
    }

    setSize(width: number, height: number) {
        super.setSize(width, height);
        this.material.uniforms.setValue(UniformNames.TargetWidth, width);
        this.material.uniforms.setValue(UniformNames.TargetHeight, height);
        this.material.uniforms.setValue(UniformNames.Aspect, width / height);
    }

    render(options: PostProcessPassRenderArgs) {
        this.material.uniforms.setValue(UNIFORM_NAME_BLEND_RATE, this.parameters.blendRate);

        super.render(options);
    }
}
