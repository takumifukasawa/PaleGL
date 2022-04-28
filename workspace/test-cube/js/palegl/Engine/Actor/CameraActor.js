import { Matrix4x4 } from "../../Math/Matrix4x4.js";
import { Vector3 } from "../../Math/Vector3.js";
import { Camera } from "../Camera.js";
import { Actor } from "./Actor.js";

export class CameraActor extends Actor {
  #camera;

  get camera() {
    return this.#camera;
  }

  constructor(args = {}) {
    super({ ...args, type: Actor.Types.CameraActor });
    const { camera } = args;
    this.#camera = camera;
  }

  setSize({ width, height }) {
    if (this.camera.type === Camera.Types.Orthographic) {
      const aspect = this.#camera.aspect || width / height;
      this.#camera.updateProjectionMatrix({
        left: this.#camera.left * aspect,
        right: this.#camera.right * aspect,
        bottom: this.#camera.bottom,
        top: this.#camera.top,
      });
    } else {
      const aspect = width / height;
      this.#camera.updateProjectionMatrix({ aspect });
    }
  }

  update() {
    super.update();
    this.#camera.cameraMatrix = this.transform.modelMatrix.clone().inverse();
  }
}
