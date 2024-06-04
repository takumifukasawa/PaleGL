import { GPU } from '@/PaleGL/core/GPU';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase';
import { UniformNames, UniformTypes } from '@/PaleGL/constants';
import toneMappingFragmentShader from '@/PaleGL/shaders/tone-mapping-fragment.glsl';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';

export class ToneMappingPass extends PostProcessPassBase {
    constructor({
        gpu, // fragmentShader,
        // name,
    } // uniforms,
    : {
        gpu: GPU;
        // fragmentShader: string;
        // uniforms?: Uniforms;
        // name?: string;
    }) {
        const uniforms: UniformsData = [
            {
                name: UniformNames.SrcTexture,
                // uSrcTexture: {
                type: UniformTypes.Texture,
                value: null,
            },
        ];

        super({
            gpu,
            name: 'ToneMappingPass',
            fragmentShader: toneMappingFragmentShader,
            uniforms,
            // useEnvMap: false,
            // receiveShadow: false,
        });
    }

    render(opts: PostProcessPassRenderArgs) {
        super.render(opts);
    }
}
