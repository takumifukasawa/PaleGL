import {UniformNames, UniformTypes} from '@/PaleGL/constants';
import bufferVisualizerPassFragmentShader from '@/PaleGL/shaders/buffer-visualizer-pass-fragment.glsl';
import {PostProcessPassBase} from '@/PaleGL/postprocess/PostProcessPassBase';
import {Matrix4} from "@/PaleGL/math/Matrix4";
import {GPU} from "@/PaleGL/core/GPU";

// ref:
// https://catlikecoding.com/unity/tutorials/advanced-rendering/fxaa/
// http://blog.simonrodriguez.fr/articles/2016/07/implementing_fxaa.html
// https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
// http://iryoku.com/aacourse/downloads/09-FXAA-3.11-in-15-Slides.pdf

export class BufferVisualizerPass extends PostProcessPassBase {
    constructor({gpu}: { gpu: GPU }) {
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
                uDepthTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uDirectionalLightShadowMap: {
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

    // setSize(width: number, height: number) {
    //     super.setSize(width, height);
    //     this.material.updateUniform('uTargetWidth', width);
    //     this.material.updateUniform('uTargetHeight', height);
    // }
}
