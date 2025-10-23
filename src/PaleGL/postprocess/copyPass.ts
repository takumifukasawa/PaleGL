import copyPassFragmentShader from '@/PaleGL/shaders/copy-pass-fragment.glsl';
import { POST_PROCESS_PASS_TYPE_COPY } from '@/PaleGL/constants.ts';
import {
    createPostProcessSinglePass,
    PostProcessSinglePass,
    PostProcessPassParametersBaseArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';

export type CopyPassArgs = PostProcessPassParametersBaseArgs;

export type CopyPass = PostProcessSinglePass;

export function createCopyPass(args: CopyPassArgs): CopyPass {
    const { gpu, enabled } = args;
    const fragmentShader = copyPassFragmentShader;

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: POST_PROCESS_PASS_TYPE_COPY,
            fragmentShader,
            enabled,
        }),
    };
}
