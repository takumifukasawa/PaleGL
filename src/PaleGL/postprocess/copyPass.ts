// import { Gpu } from '@/PaleGL/core/Gpu.ts';
// import copyPassFragmentShader from '@/PaleGL/shaders/copy-pass-fragment.glsl';
// import { PostProcessPassBaseDEPRECATED, PostProcessPassParametersBase } from '@/PaleGL/postprocess/PostProcessPassBaseDEPRECATED.ts';
// import { PostProcessPassType } from '@/PaleGL/constants.ts';
//
// export type CopyPassParameters = PostProcessPassParametersBase;
//
// export type CopyPassParametersArgs = Partial<CopyPassParameters>;
//
// export function generateCopyPassParameters(params: CopyPassParametersArgs = {}): CopyPassParameters {
//     return {
//         enabled: params.enabled ?? true,
//     };
// }
//
// export class CopyPass extends PostProcessPassBaseDEPRECATED {
//     constructor(args: { gpu: Gpu; parameters?: CopyPassParametersArgs }) {
//         const { gpu } = args;
//         const fragmentShader = copyPassFragmentShader;
//         const parameters = generateCopyPassParameters(args.parameters);
//         super({ gpu, type: PostProcessPassType.Copy, fragmentShader, parameters });
//     }
// }

import { Gpu } from '@/PaleGL/core/gpu.ts';
import copyPassFragmentShader from '@/PaleGL/shaders/copy-pass-fragment.glsl';
import { PostProcessPassType } from '@/PaleGL/constants.ts';
import { createPostProcessSinglePass, PostProcessSinglePass, PostProcessPassParametersBase } from '@/PaleGL/postprocess/postProcessPassBase.ts';

export type CopyPassParameters = PostProcessPassParametersBase;

export type CopyPassParametersArgs = Partial<CopyPassParameters>;

export function generateCopyPassParameters(params: CopyPassParametersArgs = {}): CopyPassParameters {
    return {
        enabled: params.enabled ?? true,
    };
}

export type CopyPass = PostProcessSinglePass;

export function createCopyPass(args: { gpu: Gpu; parameters?: CopyPassParametersArgs }): CopyPass {
    const { gpu } = args;
    const fragmentShader = copyPassFragmentShader;
    const parameters = generateCopyPassParameters(args.parameters);

    return {
        ...createPostProcessSinglePass({ gpu, type: PostProcessPassType.Copy, fragmentShader, parameters }),
    };
}
