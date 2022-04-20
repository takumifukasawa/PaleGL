export class GPU {
  #gl;
  #shader;
  #vao;

  static PrimitiveTypes = {
    Points: "Points",
    Lines: "Lines",
    Triangles: "Triangles",
  };

  get gl() {
    return this.#gl;
  }

  constructor({ gl }) {
    this.#gl = gl;
  }

  setShader(shader) {
    this.#shader = shader;
  }

  setVertexArrayObject(vao) {
    this.#vao = vao;
  }

  resetData() {
    this.#shader = null;
    this.#vao = null;
  }

  setSize(width, height) {
    this.#gl.viewport(0, 0, width, height);
  }

  clear(r = 0, g = 0, b = 0, a = 1) {
    const gl = this.#gl;
    gl.clearColor(r, g, b, a);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const e = gl.getError();
    if (e !== gl.NO_ERROR) {
      throw "has gl error";
    }
  }

  setupRenderStates({ material }) {
    const gl = this.#gl;

    gl.depthMask(true);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ZERO);
  }

  flush() {
    this.#gl.flush();
  }

  draw(vertexCount, primitiveType, startVertexOffset = 0) {
    const gl = this.gl;
    const program = this.#shader.glObject;

    gl.useProgram(program);

    const primitives = {
      [GPU.PrimitiveTypes.Points]: gl.POINTS,
      [GPU.PrimitiveTypes.Lines]: gl.LINES,
      [GPU.PrimitiveTypes.Triangles]: gl.TRIANGLES,
    };

    gl.bindVertexArray(this.#vao.glObject);

    gl.drawArrays(primitives[primitiveType], startVertexOffset, vertexCount);
  }
}
