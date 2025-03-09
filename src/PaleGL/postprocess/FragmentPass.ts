import { GPU } from '@/PaleGL/core/GPU.ts';
import {
    PostProcessPassBase
} from '@/PaleGL/postprocess/postprocessPassBaseWIP.ts';
import { PostProcessPassParametersBaseArgs } from '@/PaleGL/postprocess/PostProcessPassBase';
import { PostProcessPassType, RenderTargetType, UniformBlockName } from '@/PaleGL/constants';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';

export type FragmentPassParameters = PostProcessPassParametersBaseArgs;

export type FragmentPassParametersArgs = Partial<FragmentPassParameters>;

export function generateFragmentPassParameters(params: FragmentPassParametersArgs = {}): FragmentPassParameters {
    return {
        enabled: params.enabled ?? true,
    };
}

export class FragmentPass extends PostProcessPassBase {
    constructor(args: {
        gpu: GPU;
        fragmentShader: string;
        uniforms?: UniformsData;
        uniformBlockNames?: UniformBlockName[];
        name?: string;
        renderTargetType?: RenderTargetType;
        srcTextureEnabled?: boolean;
        parameters?: PostProcessPassParametersBaseArgs;
    }) {
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
        super({
            gpu,
            type: PostProcessPassType.Fragment,
            fragmentShader,
            uniforms,
            uniformBlockNames,
            name,
            renderTargetType,
            srcTextureEnabled,
            parameters,
        });
    }
}
