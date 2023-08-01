import {GPU} from '@/PaleGL/core/GPU';
import {Uniforms} from '@/PaleGL/materials/Material';
import {PostProcessPassBase} from "@/PaleGL/postprocess/PostProcessPassBase.ts";

export class DeferredShadingPass extends PostProcessPassBase {
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
        super({
            gpu,
            fragmentShader,
            uniforms,
            name,
            useEnvMap: true,
            receiveShadow: true,
        });
    }
}
