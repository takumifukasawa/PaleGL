import { Material } from "../Engine/Material.js";

export class GPU {
  #gl;
  #shader;
  #vao;
  #indices;
  #uniforms;

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

  setIndices(indices) {
    this.#indices = indices;
  }

  setUniforms(uniforms) {
    this.#uniforms = uniforms;
  }

  resetData() {
    this.#shader = null;
    this.#vao = null;
    this.#indices = null;
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

  draw(drawCount, primitiveType, startVertexOffset = 0) {
    const gl = this.gl;
    const program = this.#shader.glObject;

    // set shader
    gl.useProgram(program);

    // set vertex
    gl.bindVertexArray(this.#vao.glObject);

    // set uniform
    const uniformsKeys = Object.keys(this.#uniforms);
    for (let i = 0; i < uniformsKeys.length; i++) {
      const name = uniformsKeys[i];
      const { type, data } = this.#uniforms[name];
      const location = gl.getUniformLocation(program, name);
      switch (type) {
        case Material.UniformTypes.Float:
          gl.uniform1f(location, data);
          break;
        case Material.UniformTypes.Matrix4fv:
          // 第二引数はtransposeのフラグ。必ずfalseにする必要がある
          if (Array.isArray(data)) {
            // 配列をuniformで渡す場合は一次元にする必要があるのでflatなどで対処
            gl.uniformMatrix4fv(
              location,
              false,
              data.map((m) => m.getArray()).flat()
            );
          } else {
            gl.uniformMatrix4fv(location, false, data.getArray());
          }
          break;
        case Material.UniformTypes.Vector3f:
          gl.uniform3fv(location, data.getArray());
          break;
        default:
          throw "invalid uniform type";
      }
    }

    const primitives = {
      [GPU.PrimitiveTypes.Points]: gl.POINTS,
      [GPU.PrimitiveTypes.Lines]: gl.LINES,
      [GPU.PrimitiveTypes.Triangles]: gl.TRIANGLES,
    };

    if (this.#indices) {
      gl.drawElements(
        primitives[primitiveType],
        drawCount,
        gl.UNSIGNED_SHORT,
        startVertexOffset
      );
    } else {
      gl.drawArrays(primitives[primitiveType], startVertexOffset, drawCount);
    }
  }
}
