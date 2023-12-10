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
            uniforms: [
                {
                    name: UniformNames.GBufferATexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UniformNames.GBufferBTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UniformNames.GBufferCTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UniformNames.GBufferDTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UniformNames.DepthTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uDirectionalLightShadowMap',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uAmbientOcclusionTexture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uDeferredShadingTexture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uLightShaftTexture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uFogTexture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uNearClip',
                    type: UniformTypes.Float,
                    value: 0.1,
                },
                {
                    name: 'uFarClip',
                    type: UniformTypes.Float,
                    value: 1,
                },
                {
                    name: 'uInverseViewProjectionMatrix',
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
            ],
        });
    }
}
