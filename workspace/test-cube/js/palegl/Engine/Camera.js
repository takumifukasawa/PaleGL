import { Matrix4x4 } from "../Math/Matrix4x4.js";

export class Camera {
  static Types = {
    Perspective: "Perspective",
    Orthographic: "Orthographic",
  };

  type;
  cameraMatrix;
  projectionMatrix;

  constructor({ type }) {
    this.type = type;
    this.cameraMatrix = Matrix4x4.identity();
    this.projectionMatrix = Matrix4x4.identity();
  }

  updateProjectionMatrix() {
    throw "should implementation update projection matrix method.";
  }
}
