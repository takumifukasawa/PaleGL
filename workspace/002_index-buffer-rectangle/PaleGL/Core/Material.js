import {Shader} from "./Shader.js";

export class Material {
    shader;
    primitiveType;
    constructor({ gpu, vertexShader, fragmentShader, primitiveType }) {
        this.shader = new Shader({ gpu, vertexShader, fragmentShader})
        this.primitiveType = primitiveType;
    }
}