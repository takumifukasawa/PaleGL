import { Matrix4x4 } from "../Math/Matrix4x4.js";
import { Vector3 } from "../Math/Vector3.js";

export class Transform {
  #position;
  #rotation;
  #scale;
  #modelMatrix = Matrix4x4.identity();

  get matrix() {}

  get position() {
    return this.#position;
  }

  get rotation() {
    return this.#rotation;
  }

  get scale() {
    return this.#scale;
  }

  get modelMatrix() {
    return this.#modelMatrix;
  }

  // TODO: quaternionのことを考えると rotation は rotator 的なクラスにしたほうがよい。
  constructor(args = {}) {
    const {
      position = Vector3.zero(),
      rotation = Vector3.zero(),
      scale = Vector3.one(),
    } = args;
    this.#position = position;
    this.#rotation = rotation;
    this.#scale = scale;
  }

  setPosition(position) {
    this.#position = position;
  }

  setRotation(rotation) {
    this.#rotation = rotation;
  }

  setRotationX(rad) {
    this.#rotation.x = rad;
  }

  setRotationY(rad) {
    this.#rotation.y = rad;
  }

  setRotationZ(rad) {
    this.#rotation.z = rad;
  }

  setScale(scale) {
    this.#scale = scale;
  }

  updateModelMatrix() {
    this.#modelMatrix = Matrix4x4.multiplyMatrices(
      Matrix4x4.createTranslationMatrix(this.#position),
      Matrix4x4.createRotationZMatrix(this.#rotation.z),
      Matrix4x4.createRotationXMatrix(this.#rotation.x),
      Matrix4x4.createRotationYMatrix(this.#rotation.y),
      Matrix4x4.createScalingMatrix(this.#scale)
    );
  }
}
