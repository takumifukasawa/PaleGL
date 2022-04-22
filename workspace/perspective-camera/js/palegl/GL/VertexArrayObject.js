import { GLObject } from "./GLObject.js";

export class VertexArrayObject extends GLObject {
  #vao;

  get glObject() {
    return this.#vao;
  }

  constructor({ gl, attributes, indices }) {
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

    if (indices) {
      const ibo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Int16Array(indices),
        gl.STATIC_DRAW
      );
    }

    // unbind
    gl.bindVertexArray(null);
  }
}
