// import { Gpu } from '@/PaleGL/core/gpu.ts';
// import {
//     PostProcessPassBaseDEPRECATED
// } from '@/PaleGL/postprocess/postProcessPassBase.ts';
// import {
//     PostProcessPassParametersBase,
//     PostProcessPassRenderArgs,
// } from '@/PaleGL/postprocess/PostProcessPassBaseDEPRECATED';
// import { PostProcessPassType, UniformNames, UniformTypes } from '@/PaleGL/constants';
// import toneMappingFragmentShader from '@/PaleGL/shaders/tone-mapping-fragment.glsl';
// import { UniformsData } from '@/PaleGL/core/uniforms.ts';
//
// export type ToneMappingPassParameters = PostProcessPassParametersBase;
//
// export type ToneMappingPassParametersArgs = Partial<ToneMappingPassParameters>;
//
// export function generateToneMappingPassParameters(params: ToneMappingPassParametersArgs = {}): ToneMappingPassParameters {
//     return {
//         enabled: params.enabled ?? true,
//     };
// }
//
// export class ToneMappingPass extends PostProcessPassBaseDEPRECATED {
//     constructor(args: { gpu: Gpu; parameters?: ToneMappingPassParametersArgs }) {
//         const { gpu } = args;
//
//         const parameters = generateToneMappingPassParameters(args.parameters);
//
//         const uniforms: UniformsData = [
//             {
//                 name: UniformNames.SrcTexture,
//                 // uSrcTexture: {
//                 type: UniformTypes.Texture,
//                 value: null,
//             },
//         ];
//
//         super({
//             gpu,
//             type: PostProcessPassType.ToneMapping,
//             name: 'ToneMappingPass',
//             fragmentShader: toneMappingFragmentShader,
//             uniforms,
//             // useEnvMap: false,
//             // receiveShadow: false,
//             parameters
//         });
//     }
//
//     render(opts: PostProcessPassRenderArgs) {
//         super.render(opts);
//     }
// }

import { Gpu } from '@/PaleGL/core/gpu.ts';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessPassParametersBase,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { PostProcessPassType, UniformNames, UniformTypes } from '@/PaleGL/constants';
import toneMappingFragmentShader from '@/PaleGL/shaders/tone-mapping-fragment.glsl';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';

export type ToneMappingPassParameters = PostProcessPassParametersBase;

export type ToneMappingPassParametersArgs = Partial<ToneMappingPassParameters>;

export function generateToneMappingPassParameters(
    params: ToneMappingPassParametersArgs = {}
): ToneMappingPassParameters {
    return {
        enabled: params.enabled ?? true,
    };
}

export type ToneMappingPass = PostProcessPassBase;

export function createToneMappingPass(args: { gpu: Gpu; parameters?: ToneMappingPassParametersArgs }): ToneMappingPass {
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

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: PostProcessPassType.ToneMapping,
            name: 'ToneMappingPass',
            fragmentShader: toneMappingFragmentShader,
            uniforms,
            // useEnvMap: false,
            // receiveShadow: false,
            parameters,
        }),
    };
}
