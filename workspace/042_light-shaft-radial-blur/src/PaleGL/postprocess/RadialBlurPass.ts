import { GPU } from '@/PaleGL/core/GPU';
import { PostProcessPassBase } from '@/PaleGL/postprocess/PostProcessPassBase';
import { RenderTargetType, UniformNames, UniformTypes } from '@/PaleGL/constants';
import radialBlurFragmentShader from '@/PaleGL/shaders/radial-blur-fragment.glsl';

export class RadialBlurPass extends PostProcessPassBase {
    constructor({
        gpu, // fragmentShader,
        // uniforms,
        renderTargetType, // name,
    }: {
        gpu: GPU;
        // fragmentShader: string;
        renderTargetType?: RenderTargetType;
        // name?: string;
    }) {
        const uniforms = {
            [UniformNames.SrcTexture]: {
                // uSrcTexture: {
                type: UniformTypes.Texture,
                value: null,
            },
        };

        super({
            gpu,
            name: 'RadialBlurPass',
            fragmentShader: radialBlurFragmentShader,
            uniforms,
            renderTargetType,
            // useEnvMap: false,
            // receiveShadow: false,
        });
    }
}
