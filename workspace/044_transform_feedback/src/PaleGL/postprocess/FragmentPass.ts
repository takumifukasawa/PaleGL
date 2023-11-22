import { GPU } from '@/PaleGL/core/GPU';
import { Uniforms } from '@/PaleGL/materials/Material';
import {PostProcessPassBase} from "@/PaleGL/postprocess/PostProcessPassBase";
import {RenderTargetType} from "@/PaleGL/constants";

export class FragmentPass extends PostProcessPassBase {
    constructor({
        gpu,
        fragmentShader,
        uniforms,
        name,
        renderTargetType
    }: {
        gpu: GPU;
        fragmentShader: string;
        uniforms?: Uniforms;
        name?: string;
        renderTargetType?: RenderTargetType;
    }) {
        super({ gpu, fragmentShader, uniforms, name, renderTargetType });
    }
}
