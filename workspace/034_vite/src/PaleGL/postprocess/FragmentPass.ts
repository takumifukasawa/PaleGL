import {PostProcessPass} from "./PostProcessPass";
import {GPU} from "../core/GPU";

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
