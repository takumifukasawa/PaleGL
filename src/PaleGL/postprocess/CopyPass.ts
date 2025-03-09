import { GPU } from '@/PaleGL/core/GPU.ts';
import copyPassFragmentShader from '@/PaleGL/shaders/copy-pass-fragment.glsl';
import { PostProcessPassBase, PostProcessPassParametersBase } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { PostProcessPassType } from '@/PaleGL/constants.ts';

export type CopyPassParameters = PostProcessPassParametersBase;

export type CopyPassParametersArgs = Partial<CopyPassParameters>;

export function generateCopyPassParameters(params: CopyPassParametersArgs = {}): CopyPassParameters {
    return {
        enabled: params.enabled ?? true,
    };
}

export class CopyPass extends PostProcessPassBase {
    constructor(args: { gpu: GPU; parameters?: CopyPassParametersArgs }) {
        const { gpu } = args;
        const fragmentShader = copyPassFragmentShader;
        const parameters = generateCopyPassParameters(args.parameters);
        super({ gpu, type: PostProcessPassType.Copy, fragmentShader, parameters });
    }
}
