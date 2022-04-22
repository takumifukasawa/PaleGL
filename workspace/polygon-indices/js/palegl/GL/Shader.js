import { GLObject } from "./GLObject.js";

export class Shader extends GLObject {
  #program;

  get glObject() {
    return this.#program;
  }

  constructor({ gpu, vertexShader, fragmentShader }) {
    super();
    const gl = gpu.gl;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);

    // compile vertex shader
    gl.shaderSource(vs, vertexShader);
    gl.compileShader(vs);
    const vsInfo = gl.getShaderInfoLog(vs);
    if (vsInfo.length > 0) {
      throw vsInfo;
    }

    // compile fragment shader
    gl.shaderSource(fs, fragmentShader);
    gl.compileShader(fs);
    const fsInfo = gl.getShaderInfoLog(fs);
    if (fsInfo.length > 0) {
      throw fsInfo;
    }

    this.#program = gl.createProgram();

    gl.attachShader(this.#program, vs);
    gl.attachShader(this.#program, fs);

    gl.linkProgram(this.#program);

    const programInfo = gl.getProgramInfoLog(this.#program);
    if (programInfo.length > 0) {
      throw programInfo;
    }
  }
}
