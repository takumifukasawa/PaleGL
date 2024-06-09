import { UniformNames, UniformTypes, UniformBlockNames } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import screenSpaceShadowFragmentShader from '@/PaleGL/shaders/screen-space-shadow-fragment.glsl';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';

/**
 *
 */
export class ScreenSpaceShadowPass extends PostProcessPassBase {
    bias: number = 0;
    // jitterSize: Vector3 = new Vector3(0.2, 0.2, 0.2);
    jitterSize: Vector3 = new Vector3(0.025, 0.025, 0.025);
    // sharpness: number = 0.3;
    sharpness: number = 2;
    strength: number = 1;

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
                    type: UniformTypes.Texture,
                    value: null,
                },
                // {
                //     name: 'uJitterSizeX',
                //     type: UniformTypes.Float,
                //     value: 0,
                // },
                // {
                //     name: 'uJitterSizeY',
                //     type: UniformTypes.Float,
                //     value: 0,
                // },
                {
                    name: 'uBias',
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: 'uJitterSize',
                    type: UniformTypes.Vector3,
                    value: Vector3.zero,
                },
                {
                    name: 'uSharpness',
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: 'uStrength',
                    type: UniformTypes.Float,
                    value: 0,
                },
            ],
            uniformBlockNames: [UniformBlockNames.Common, UniformBlockNames.Transformations, UniformBlockNames.Camera, UniformBlockNames.PointLight],
            // renderTargetType: RenderTargetTypes.R16F,
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
        this.material.uniforms.setValue('uBias', this.bias);
        this.material.uniforms.setValue('uJitterSize', this.jitterSize);
        this.material.uniforms.setValue('uSharpness', this.sharpness);
        this.material.uniforms.setValue('uStrength', this.strength);
        super.render(options);
    }
}
