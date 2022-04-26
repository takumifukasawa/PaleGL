import { Camera } from "./Camera.js";
import { Matrix4x4 } from "../Math/Matrix4x4.js";

export class PerspectiveCamera extends Camera {
  #fov;
  #nearClip;
  #farClip;
  #aspect;

  cameraMatrix;
  projectionMatrix;

  get fov() {
    return this.#fov;
  }

  get nearClip() {
    return this.#nearClip;
  }

  get farClip() {
    return this.#farClip;
  }

  get aspect() {
    return this.#aspect;
  }

  constructor(fov = 45, aspect = 1, nearClip = 0.1, farClip = 50) {
    super({ type: Camera.Types.Perspective });
    this.#fov = fov;
    this.#aspect = aspect;
    this.#nearClip = nearClip;
    this.#farClip = farClip;
    this.cameraMatrix = Matrix4x4.identity();
    this.projectionMatrix = Matrix4x4.identity();
    this.updateProjectionMatrix();
  }

  setParams({ fov, nearClip, farClip, aspect }) {
    if (fov) {
      this.#fov = fov;
    }
    if (nearClip) {
      this.#nearClip = nearClip;
    }
    if (farClip) {
      this.#farClip = farClip;
    }
    if (aspect) {
      this.#aspect = aspect;
    }
  }

  // aspect: w / h
  updateProjectionMatrix(args = {}) {
    if (args) {
      this.setParams(args);
    }
    this.projectionMatrix = Matrix4x4.getPerspectiveMatrix(
      this.#fov,
      this.#aspect,
      this.#nearClip,
      this.#farClip
    );
  }
}
