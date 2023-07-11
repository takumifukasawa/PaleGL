import { PostProcessPass } from '@/PaleGL/postprocess/PostProcessPass';
import { GPU } from '@/PaleGL/core/GPU';
import {Uniforms} from "@/PaleGL/materials/Material.ts";

export class FragmentPass extends PostProcessPass {
    constructor({
        gpu,
        fragmentShader,
        uniforms,
        name,
    }: {
        gpu: GPU;
        fragmentShader: string;
        uniforms?: Uniforms;
        name?: string;
    }) {
        super({ gpu, fragmentShader, uniforms, name });
    }
}
