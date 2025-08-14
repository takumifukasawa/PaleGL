import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { PostProcessPassType, UniformNames, UniformTypes } from '@/PaleGL/constants';
import toneMappingFragmentShader from '@/PaleGL/shaders/tone-mapping-fragment.glsl';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';

export type ToneMappingPass = PostProcessPassBase;

export type ToneMappingPassArgs = PostProcessPassParametersBaseArgs;

export function createToneMappingPass(args: ToneMappingPassArgs): ToneMappingPass {
    const { gpu, enabled } = args;

    const uniforms: UniformsData = [
        {
            name: UniformNames.SrcTexture,
            // uSrcTexture: {
            type: UniformTypes.Texture,
            value: null,
        },
    ];

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: PostProcessPassType.ToneMapping,
            name: 'ToneMappingPass',
            fragmentShader: toneMappingFragmentShader,
            uniforms,
            // useEnvMap: false,
            // receiveShadow: false,
            enabled,
        }),
        // parameters
    };
}
