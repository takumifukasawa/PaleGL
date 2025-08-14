import {
    PostProcessPassParametersBaseArgs,
    createPostProcessSinglePass,
    PostProcessSinglePass,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { PostProcessPassType, RenderTargetType, UniformBlockName } from '@/PaleGL/constants';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';

type FragmentPassParameters = {
    fragmentShader: string;
    uniforms?: UniformsData;
    uniformBlockNames?: UniformBlockName[];
    name?: string;
    renderTargetType?: RenderTargetType;
    srcTextureEnabled?: boolean;
    parameters?: PostProcessPassParametersBaseArgs;
    enabled?: boolean;
};

export type FragmentPassParametersArgs = PostProcessPassParametersBaseArgs & FragmentPassParameters;

export type FragmentPass = PostProcessSinglePass;

export function createFragmentPass(args: FragmentPassParametersArgs): FragmentPass {
    const {
        gpu,
        fragmentShader,
        uniforms = [],
        uniformBlockNames = [],
        name,
        renderTargetType,
        srcTextureEnabled,
        enabled
    } = args;

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
            enabled
        }),
    };
}
