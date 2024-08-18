import {PostProcessPassType, UniformNames, UniformTypes} from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import chromaticAberrationFragment from '@/PaleGL/shaders/chromatic-aberration-fragment.glsl';
import {
    PostProcessPassBase,
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs
} from '@/PaleGL/postprocess/PostProcessPassBase';

// ref:

const UNIFORM_NAME_CHROMATIC_ABERRATION_SCALE = 'uChromaticAberrationScale';
const UNIFORM_VALUE_CHROMATIC_ABERRATION_SCALE = 0.015;

export type ChromaticAberrationPassParameters = PostProcessPassParametersBase;

export type ChromaticAberrationPassParametersArgs = Partial<ChromaticAberrationPassParameters>;

export function generateChromaticAberrationPassParameters(
    params: ChromaticAberrationPassParametersArgs = {}
): ChromaticAberrationPassParameters {
    return {
        type: PostProcessPassType.ChromaticAberration,
        enabled: params.enabled ?? true,
    };
}

export class ChromaticAberrationPass extends PostProcessPassBase {
    chromaticAberrationScale: number;

    constructor(args : { gpu: GPU, parameters?: ChromaticAberrationPassParametersArgs }) {
        const { gpu } = args;
        
        const parameters = generateChromaticAberrationPassParameters(args.parameters ?? {});
        
        const fragmentShader = chromaticAberrationFragment;
        
        super({
            gpu,
            fragmentShader,
            uniforms: [{
                name: UNIFORM_NAME_CHROMATIC_ABERRATION_SCALE,
                type: UniformTypes.Float,
                value: UNIFORM_VALUE_CHROMATIC_ABERRATION_SCALE,
            }],
            parameters: {
                ...parameters,
                type: PostProcessPassType.ChromaticAberration,
            },
        });

        this.chromaticAberrationScale = UNIFORM_VALUE_CHROMATIC_ABERRATION_SCALE;
    }

    setSize(width: number, height: number) {
        super.setSize(width, height);
        this.material.uniforms.setValue(UniformNames.TargetWidth, width);
        this.material.uniforms.setValue(UniformNames.TargetHeight, height);
    }
    
    render(options: PostProcessPassRenderArgs) {
        this.material.uniforms.setValue(
            UNIFORM_NAME_CHROMATIC_ABERRATION_SCALE,
            this.chromaticAberrationScale
        );

        super.render(options);
    }
}
