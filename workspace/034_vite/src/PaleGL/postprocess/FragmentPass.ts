import {PostProcessPass} from "@/PaleGL/postprocess/PostProcessPass";
import {GPU} from "@/PaleGL/core/GPU";

export class FragmentPass extends PostProcessPass {
    constructor({
                    gpu,
                    fragmentShader,
                    uniforms, name
                }: {
                    gpu: GPU,
                    fragmentShader: string,
                    uniforms?: any,
                    name?: string
                }
    ) {
        super({gpu, fragmentShader, uniforms, name});
    }
}
