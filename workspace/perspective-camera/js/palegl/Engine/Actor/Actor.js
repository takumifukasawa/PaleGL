export class Actor {
  static Types = {
    MeshActor: "MeshActor",
    CameraActor: "CameraActor",
  };
  type;
  constructor({ type }) {
    this.type = type;
  }
}
