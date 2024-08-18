import { GPU } from '@/PaleGL/core/GPU';
import {
    PostProcessPassBase,
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/PostProcessPassBase';
import { PostProcessPassType, UniformNames, UniformTypes } from '@/PaleGL/constants';
import toneMappingFragmentShader from '@/PaleGL/shaders/tone-mapping-fragment.glsl';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';

export type ToneMappingPassParameters = PostProcessPassParametersBase;

export type ToneMappingPassParametersArgs = Partial<ToneMappingPassParameters>;

export class ToneMappingPass extends PostProcessPassBase {
    constructor(args: { gpu: GPU; parameters?: ToneMappingPassParametersArgs }) {
        const { gpu } = args;
        
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
            parameters: {
                type: PostProcessPassType.ToneMapping,
                ...args.parameters
            },
        });
    }

    render(opts: PostProcessPassRenderArgs) {
        super.render(opts);
    }
}
