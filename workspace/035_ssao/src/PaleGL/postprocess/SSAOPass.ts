import { PostProcessPass } from '@/PaleGL/postprocess/PostProcessPass';
import {PostProcessUniformNames, UniformTypes} from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import ssaoFragmentShader from '@/PaleGL/shaders/ssao-fragment.glsl';

export class SSAOPass extends PostProcessPass {
    /**
     * 
     * @param gpu
     */
    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = ssaoFragmentShader;

        console.log('ssao fragment shader', fragmentShader);

        super({
            gpu,
            fragmentShader,
            uniforms: {
                [PostProcessUniformNames.TargetWidth]: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                [PostProcessUniformNames.TargetHeight]: {
                    type: UniformTypes.Float,
                    value: 1,
                },
            },
        });
        // this.gpu = gpu;
    }

    /**
     * 
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        super.setSize(width, height);
        // this.material.uniforms.uTargetWidth.value = width;
        // this.material.uniforms.uTargetHeight.value = height;
        this.material.updateUniform(PostProcessUniformNames.TargetWidth, width);
        this.material.updateUniform(PostProcessUniformNames.TargetHeight, height);
    }
}
