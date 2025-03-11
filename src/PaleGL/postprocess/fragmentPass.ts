// import { Gpu } from '@/PaleGL/core/gpu.ts';
// import {
//     PostProcessPass
// } from '@/PaleGL/postprocess/postProcessPassBase.ts';
// import { PostProcessPassParametersBaseArgs } from '@/PaleGL/postprocess/PostProcessPassBaseDEPRECATED';
// import { PostProcessPassType, RenderTargetType, UniformBlockName } from '@/PaleGL/constants';
// import { UniformsData } from '@/PaleGL/core/uniforms.ts';
//
// export type FragmentPassParameters = PostProcessPassParametersBaseArgs;
//
// export type FragmentPassParametersArgs = Partial<FragmentPassParameters>;
//
// export function generateFragmentPassParameters(params: FragmentPassParametersArgs = {}): FragmentPassParameters {
//     return {
//         enabled: params.enabled ?? true,
//     };
// }
//
// export class FragmentPass extends PostProcessPass {
//     constructor(args: {
//         gpu: Gpu;
//         fragmentShader: string;
//         uniforms?: UniformsData;
//         uniformBlockNames?: UniformBlockName[];
//         name?: string;
//         renderTargetType?: RenderTargetType;
//         srcTextureEnabled?: boolean;
//         parameters?: PostProcessPassParametersBaseArgs;
//     }) {
//         const {
//             gpu,
//             fragmentShader,
//             uniforms = [],
//             uniformBlockNames = [],
//             name,
//             renderTargetType,
//             srcTextureEnabled,
//         } = args;
//
//         const parameters = generateFragmentPassParameters(args.parameters ?? {});
//         super({
//             gpu,
//             type: PostProcessPassType.Fragment,
//             fragmentShader,
//             uniforms,
//             uniformBlockNames,
//             name,
//             renderTargetType,
//             srcTextureEnabled,
//             parameters,
//         });
//     }
// }

import { Gpu } from '@/PaleGL/core/gpu.ts';
import {
    PostProcessPassParametersBaseArgs,
    createPostProcessSinglePass,
    PostProcessSinglePass,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { PostProcessPassType, RenderTargetType, UniformBlockName } from '@/PaleGL/constants';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';

export type FragmentPassParameters = PostProcessPassParametersBaseArgs;

export type FragmentPassParametersArgs = Partial<FragmentPassParameters>;

export function generateFragmentPassParameters(params: FragmentPassParametersArgs = {}): FragmentPassParameters {
    return {
        enabled: params.enabled ?? true,
    };
}

export type FragmentPass = PostProcessSinglePass;

export function createFragmentPass(args: {
    gpu: Gpu;
    fragmentShader: string;
    uniforms?: UniformsData;
    uniformBlockNames?: UniformBlockName[];
    name?: string;
    renderTargetType?: RenderTargetType;
    srcTextureEnabled?: boolean;
    parameters?: PostProcessPassParametersBaseArgs;
}): FragmentPass {
    const {
        gpu,
        fragmentShader,
        uniforms = [],
        uniformBlockNames = [],
        name,
        renderTargetType,
        srcTextureEnabled,
    } = args;

    const parameters = generateFragmentPassParameters(args.parameters ?? {});

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: PostProcessPassType.Fragment,
            fragmentShader,
            uniforms,
            uniformBlockNames,
            name,
            renderTargetType,
            srcTextureEnabled,
            parameters,
        }),
    };
}
