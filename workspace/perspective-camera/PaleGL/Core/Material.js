
import {Shader} from "./Shader.js";

export class Material {
  shader;
  primitiveType;
  uniforms;

  static UniformTypes = {
    Float: "Float",
    Matrix4fv: "Matrix4fv",
    Vector3f: "Vector3f",
  };

  constructor({ gpu, vertexShader, fragmentShader, primitiveType, uniforms }) {
    this.shader = new Shader({ gpu, vertexShader, fragmentShader });
    this.primitiveType = primitiveType;
    this.uniforms = uniforms;
  }
}
