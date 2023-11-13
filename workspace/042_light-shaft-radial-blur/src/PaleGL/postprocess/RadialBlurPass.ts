import { GPU } from '@/PaleGL/core/GPU';
import {PostProcessPassBase, PostProcessPassRenderArgs} from '@/PaleGL/postprocess/PostProcessPassBase';
import {RenderTargetTypes, UniformNames, UniformTypes} from '@/PaleGL/constants';
import radialBlurFragmentShader from '@/PaleGL/shaders/radial-blur-fragment.glsl';

export class RadialBlurPass extends PostProcessPassBase {
    constructor({
        gpu, // fragmentShader,
        // uniforms,
    } // name,
    : {
        gpu: GPU;
        // fragmentShader: string;
        // uniforms?: Uniforms;
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
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F
            // useEnvMap: false,
            // receiveShadow: false,
        });
    }
    
    render(opts: PostProcessPassRenderArgs) {
        super.render(opts);
    }
}
