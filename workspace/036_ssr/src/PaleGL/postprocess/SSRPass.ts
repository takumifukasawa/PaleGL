import { PostProcessPass } from '@/PaleGL/postprocess/PostProcessPass';
import { PostProcessUniformNames, UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import ssrFragmentShader from '@/PaleGL/shaders/ssr-fragment.glsl';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { PostProcessRenderArgs } from '@/PaleGL/postprocess/AbstractPostProcessPass';

export class SSRPass extends PostProcessPass {
    blendRate: number = 1;

    /**
     *
     * @param gpu
     */
    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = ssrFragmentShader;

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
                uBaseColorTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uNormalTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uDepthTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uTransposeInverseViewMatrix: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
                uProjectionMatrix: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
                uInverseProjectionMatrix: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
                [PostProcessUniformNames.CameraNear]: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                [PostProcessUniformNames.CameraFar]: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uBlendRate: {
                    type: UniformTypes.Float,
                    value: 1,
                },
            },
        });
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

    render(options: PostProcessRenderArgs) {
        this.material.updateUniform('uBlendRate', this.blendRate);

        super.render(options);
    }
}
