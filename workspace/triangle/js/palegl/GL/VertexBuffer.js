import { GLObject } from "./GLObject.js";

export class VertexBuffer extends GLObject {
  #vbo;

  get glObject() {
    this.#vbo;
  }

  constructor({ gl, data }) {
    super();

    this.#vbo = gl.createBuffer();

    // bind buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.#vbo);
    // set data to buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    // unbind
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}
