import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { POST_PROCESS_PASS_TYPE_TONE_MAPPING, UNIFORM_TYPE_TEXTURE, UNIFORM_NAME_SRC_TEXTURE } from '@/PaleGL/constants';
import toneMappingFragmentShader from '@/PaleGL/shaders/tone-mapping-fragment.glsl';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';

export type ToneMappingPass = PostProcessPassBase;

export type ToneMappingPassArgs = PostProcessPassParametersBaseArgs;

export function createToneMappingPass(args: ToneMappingPassArgs): ToneMappingPass {
    const { gpu, enabled } = args;

    const uniforms: UniformsData = [
        {
            name: UNIFORM_NAME_SRC_TEXTURE,
            // uSrcTexture: {
            type: UNIFORM_TYPE_TEXTURE,
            value: null,
        },
    ];

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: POST_PROCESS_PASS_TYPE_TONE_MAPPING,
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
