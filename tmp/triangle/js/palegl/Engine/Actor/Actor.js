export class Actor {
  static Types = {
    MeshActor: "MeshActor",
  };
  type;
  constructor({ type }) {
    this.type = type;
  }
}
