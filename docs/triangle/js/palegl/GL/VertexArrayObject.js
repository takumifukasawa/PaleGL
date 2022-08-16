import { GLObject } from "./GLObject.js";

export class VertexArrayObject extends GLObject {
  #vao;

  get glObject() {
    return this.#vao;
  }

  constructor({ gl, attributes }) {
    super();

    this.#vao = gl.createVertexArray();

    gl.bindVertexArray(this.#vao);

    attributes.forEach((attribute, i) => {
      const { data, stride, location } = attribute;
      const vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, stride, gl.FLOAT, false, 0, 0);
    });

    // TODO: set index

    // unbind
    gl.bindVertexArray(null);
  }
}
