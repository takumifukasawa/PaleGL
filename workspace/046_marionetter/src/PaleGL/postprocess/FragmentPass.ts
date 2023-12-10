import { GPU } from '@/PaleGL/core/GPU';
import { PostProcessPassBase } from '@/PaleGL/postprocess/PostProcessPassBase';
import { RenderTargetType } from '@/PaleGL/constants';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';

export class FragmentPass extends PostProcessPassBase {
    constructor({
        gpu,
        fragmentShader,
        uniforms = [],
        name,
        renderTargetType,
    }: {
        gpu: GPU;
        fragmentShader: string;
        uniforms?: UniformsData;
        name?: string;
        renderTargetType?: RenderTargetType;
    }) {
        super({ gpu, fragmentShader, uniforms, name, renderTargetType });
    }
}
