import { Camera } from "./Camera.js";

export class PerspectiveCamera extends Camera {
  constructor() {
    super({ type: Camera.Types.Perspective });
  }
  updateProjectionMatrix() {}
}
