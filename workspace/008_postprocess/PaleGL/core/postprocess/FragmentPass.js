import {PostProcessPass} from "./PostProcessPass.js";

export class FragmentPass extends PostProcessPass {
    constructor({ gpu, fragmentShader }) {
        super({ gpu, fragmentShader });
    }
}