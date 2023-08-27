import { GPU } from '@/PaleGL/core/GPU';
import {PostProcessPassBase, PostProcessPassRenderArgs} from '@/PaleGL/postprocess/PostProcessPassBase';
import {UniformNames, UniformTypes} from '@/PaleGL/constants';
import toneMappingFragmentShader from '@/PaleGL/shaders/tone-mapping-fragment.glsl';

export class ToneMappingPass extends PostProcessPassBase {
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
            name: 'ToneMappingPass',
            fragmentShader: toneMappingFragmentShader,
            uniforms,
            useEnvMap: true,
            receiveShadow: true,
        });
    }
    
    render(opts: PostProcessPassRenderArgs) {
        super.render(opts);
    }
}
