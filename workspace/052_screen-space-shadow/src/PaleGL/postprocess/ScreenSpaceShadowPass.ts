import { UniformNames, UniformTypes, UniformBlockNames } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import screenSpaceShadowFragmentShader from '@/PaleGL/shaders/screen-space-shadow-fragment.glsl';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase.ts';

/**
 * 
 */
export class ScreenSpaceShadowPass extends PostProcessPassBase {
    blendRate: number = 1;

    /**
     *
     * @param gpu
     */
    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = screenSpaceShadowFragmentShader;

        super({
            gpu,
            fragmentShader,
            uniforms: [
                {
                    name: UniformNames.GBufferBTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UniformNames.DepthTexture,
                    // uDepthTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uBlendRate',
                    type: UniformTypes.Float,
                    value: 1,
                },
            ],
            uniformBlockNames: [UniformBlockNames.Transformations, UniformBlockNames.Camera],
        });
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        super.setSize(width, height);
        this.material.uniforms.setValue(UniformNames.TargetWidth, width);
        this.material.uniforms.setValue(UniformNames.TargetHeight, height);
    }

    /**
     *
     * @param options
     */
    render(options: PostProcessPassRenderArgs) {
        this.material.uniforms.setValue('uBlendRate', this.blendRate);
        super.render(options);
    }
}
