import {UniformNames, UniformTypes} from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import chromaticAberrationFragment from '@/PaleGL/shaders/chromatic-aberration-fragment.glsl';
import {PostProcessPassBase, PostProcessPassRenderArgs} from '@/PaleGL/postprocess/PostProcessPassBase';

// ref:

const UNIFORM_NAME_CHROMATIC_ABERRATION_SCALE = 'uChromaticAberrationScale';
const UNIFORM_VALUE_CHROMATIC_ABERRATION_SCALE = 0.015;

export class ChromaticAberrationPass extends PostProcessPassBase {
    chromaticAberrationScale: number;

    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = chromaticAberrationFragment;
        

        super({
            gpu,
            fragmentShader,
            uniforms: [{
                name: UNIFORM_NAME_CHROMATIC_ABERRATION_SCALE,
                type: UniformTypes.Float,
                value: UNIFORM_VALUE_CHROMATIC_ABERRATION_SCALE,
            }],
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
