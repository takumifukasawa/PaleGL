import { Transform } from "../Transform.js";

export class Actor {
  static Types = {
    MeshActor: "MeshActor",
    CameraActor: "CameraActor",
  };

  type;
  #transform = new Transform();

  get transform() {
    return this.#transform;
  }

  constructor({ type }) {
    this.type = type;
  }

  setPosition(position) {
    this.#transform.setPosition(position);
  }

  update() {
    this.#transform.updateModelMatrix();
  }
}
