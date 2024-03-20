import { GPU } from '@/PaleGL/core/GPU';
import { PostProcessPassBase } from '@/PaleGL/postprocess/PostProcessPassBase';
import { RenderTargetType, UniformBlockName } from '@/PaleGL/constants';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';

export class FragmentPass extends PostProcessPassBase {
    constructor({
        gpu,
        fragmentShader,
        uniforms = [],
        uniformBlockNames = [],
        name,
        renderTargetType,
    }: {
        gpu: GPU;
        fragmentShader: string;
        uniforms?: UniformsData;
        uniformBlockNames?: UniformBlockName[];
        name?: string;
        renderTargetType?: RenderTargetType;
    }) {
        super({
            gpu,
            fragmentShader,
            uniforms,
            uniformBlockNames,
            name,
            renderTargetType,
        });
    }
}
