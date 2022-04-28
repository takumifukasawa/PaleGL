import { Actor } from "./Actor.js";

export class MeshActor extends Actor {
  geometry;
  material;
  constructor({ geometry, material }) {
    super({ type: Actor.Types.MeshActor });
    this.geometry = geometry;
    this.material = material;
  }
}
