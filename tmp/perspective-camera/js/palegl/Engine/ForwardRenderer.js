import { GPU } from "../GL/GPU.js";

export class ForwardRenderer {
  #canvas;
  #gpu;
  #width;
  #height;
  #ratio = 1;

  get gl() {
    return this.#gpu.gl;
  }

  get gpu() {
    return this.#gpu;
  }

  constructor(canvas) {
    this.#canvas = canvas;
    const gl = this.#canvas.getContext("webgl2");
    this.#gpu = new GPU({ gl });
  }

  setPixelRatio(ratio) {
    this.#ratio = ratio;
  }

  /**
   * set canvas size
   * @param {*} width
   * @param {*} height
   * ratioに合わせる場合は、canvasのサイズとgl.viewportを大きなサイズで確保しておき、canvasのstyleで縮める
   */
  setSize(width, height) {
    this.#width = width;
    this.#height = height;
    this.#canvas.width = this.#width * this.#ratio;
    this.#canvas.height = this.#height * this.#ratio;
    this.#canvas.style.width = `${this.#width}px`;
    this.#canvas.style.height = `${this.#height}px`;
    this.#gpu.setSize(this.#width * this.#ratio, this.#height * this.#ratio);
  }

  clear() {
    this.#gpu.clear();
  }

  render(scene, cameraActor) {
    const meshActors = scene.getMeshActors();
    // TODO: manager sort order
    meshActors.forEach((meshActor) => {
      this.renderMeshActor(meshActor, cameraActor);
    });
  }

  renderMeshActor(meshActor, cameraActor) {
    const { geometry, material } = meshActor;
    // for debug
    // console.log(material, geometry);

    this.#gpu.setShader(material.shader);

    this.#gpu.setVertexArrayObject(geometry.vertexArrayObject);

    // send uniforms values
    if (material.uniforms.uViewMatrix) {
      // actorから引っ張ってくればいいはず
      material.uniforms.uViewMatrix.data = cameraActor.transform.modelMatrix
        .clone()
        .inverse();
      // material.uniforms.uViewMatrix.data =
      //   cameraActor.camera.cameraMatrix.clone();
    }
    if (material.uniforms.uProjectionMatrix) {
      // inverseしなくてよかったかも
      material.uniforms.uProjectionMatrix.data =
        cameraActor.camera.projectionMatrix.clone();
      // material.uniforms.uProjectionMatrix.data =
      //   cameraActor.camera.projectionMatrix.clone().inverse();
    }
    this.#gpu.setUniforms(material.uniforms);

    this.#gpu.setupRenderStates({ material });

    if (geometry.indices) {
      this.#gpu.setIndices(geometry.indices);
      this.#gpu.draw(geometry.indices.length, material.primitiveType);
    } else {
      this.#gpu.draw(geometry.vertexCount, material.primitiveType);
    }
    this.#gpu.flush();
    this.#gpu.resetData();
  }
}
