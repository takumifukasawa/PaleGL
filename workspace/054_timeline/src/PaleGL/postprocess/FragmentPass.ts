import { GPU } from '@/PaleGL/core/GPU';
import { PostProcessPassBase, PostProcessPassParametersBaseArgs } from '@/PaleGL/postprocess/PostProcessPassBase';
import { PostProcessPassType, RenderTargetType, UniformBlockName } from '@/PaleGL/constants';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';

export class FragmentPass extends PostProcessPassBase {
    constructor({
        gpu,
        fragmentShader,
        uniforms = [],
        uniformBlockNames = [],
        name,
        renderTargetType,
        srcTextureEnabled,
        parameters,
    }: {
        gpu: GPU;
        fragmentShader: string;
        uniforms?: UniformsData;
        uniformBlockNames?: UniformBlockName[];
        name?: string;
        renderTargetType?: RenderTargetType;
        srcTextureEnabled?: boolean;
        parameters?: PostProcessPassParametersBaseArgs;
    }) {
        super({
            gpu,
            fragmentShader,
            uniforms,
            uniformBlockNames,
            name,
            renderTargetType,
            srcTextureEnabled,
            parameters: { ...parameters, type: PostProcessPassType.Fragment },
        });
    }
}
