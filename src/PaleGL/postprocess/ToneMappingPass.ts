import { Gpu } from '@/PaleGL/core/gpu.ts';
import {
    PostProcessPassBase,
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/PostProcessPassBase';
import { PostProcessPassType, UniformNames, UniformTypes } from '@/PaleGL/constants';
import toneMappingFragmentShader from '@/PaleGL/shaders/tone-mapping-fragment.glsl';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';

export type ToneMappingPassParameters = PostProcessPassParametersBase;

export type ToneMappingPassParametersArgs = Partial<ToneMappingPassParameters>;

export function generateToneMappingPassParameters(params: ToneMappingPassParametersArgs = {}): ToneMappingPassParameters {
    return {
        enabled: params.enabled ?? true,
    };
}

export class ToneMappingPass extends PostProcessPassBase {
    constructor(args: { gpu: Gpu; parameters?: ToneMappingPassParametersArgs }) {
        const { gpu } = args;
        
        const parameters = generateToneMappingPassParameters(args.parameters);
        
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
            type: PostProcessPassType.ToneMapping,
            name: 'ToneMappingPass',
            fragmentShader: toneMappingFragmentShader,
            uniforms,
            // useEnvMap: false,
            // receiveShadow: false,
            parameters
        });
    }

    render(opts: PostProcessPassRenderArgs) {
        super.render(opts);
    }
}
