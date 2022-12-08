import {PostProcessPass} from "./PostProcessPass.js";

export class FragmentPass extends PostProcessPass {
    constructor({ gpu, fragmentShader, uniforms, name }) {
        super({ gpu, fragmentShader, uniforms, name });
    }
}