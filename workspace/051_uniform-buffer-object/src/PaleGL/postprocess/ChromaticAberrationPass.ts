import {UniformNames} from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import chromaticAberrationFragment from '@/PaleGL/shaders/chromatic-aberration-fragment.glsl';
import { PostProcessPassBase } from '@/PaleGL/postprocess/PostProcessPassBase';

// ref:

export class ChromaticAberrationPass extends PostProcessPassBase {
    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = chromaticAberrationFragment;

        super({
            gpu,
            fragmentShader,
            uniforms: [],
        });
    }

    setSize(width: number, height: number) {
        super.setSize(width, height);
        this.material.uniforms.setValue(UniformNames.TargetWidth, width);
        this.material.uniforms.setValue(UniformNames.TargetHeight, height);
    }
}
