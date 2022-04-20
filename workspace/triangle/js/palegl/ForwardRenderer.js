import { GPU } from "./GL/GPU.js";

export class ForwardRenderer {
  #canvas;
  #gpu;

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

  setSize(width, height) {}

  render(scene, camera) {
    const meshActors = scene.getMeshActors();
    // console.log(meshActors);
  }
}
