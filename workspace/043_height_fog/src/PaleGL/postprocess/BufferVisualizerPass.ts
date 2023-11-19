import { UniformNames, UniformTypes } from '@/PaleGL/constants';
import bufferVisualizerPassFragmentShader from '@/PaleGL/shaders/buffer-visualizer-pass-fragment.glsl';
import { PostProcessPassBase } from '@/PaleGL/postprocess/PostProcessPassBase';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { GPU } from '@/PaleGL/core/GPU';

export class BufferVisualizerPass extends PostProcessPassBase {
    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = bufferVisualizerPassFragmentShader;

        super({
            gpu,
            fragmentShader,
            uniforms: {
                [UniformNames.GBufferATexture]: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                [UniformNames.GBufferBTexture]: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                [UniformNames.GBufferCTexture]: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uDepthTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uDirectionalLightShadowMap: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uAmbientOcclusionTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uLightShaftTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uNearClip: {
                    type: UniformTypes.Float,
                    value: 0.1,
                },
                uFarClip: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uInverseViewProjectionMatrix: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
            },
        });
        // this.gpu = gpu;
    }

    // render(options: PostProcessPassRenderArgs) {
    //     super.render(options);
    //     console.log(this.material.uniforms)
    // }

    // setSize(width: number, height: number) {
    //     super.setSize(width, height);
    //     this.material.updateUniform('uTargetWidth', width);
    //     this.material.updateUniform('uTargetHeight', height);
    // }
}
