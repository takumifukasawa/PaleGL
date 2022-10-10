import { Actor } from "./Actor/Actor.js";

export class Scene {
  actors;
  constructor() {
    this.actors = [];
  }
  add(actor) {
    this.actors.push(actor);
  }
  getMeshActors() {
    return this.actors.filter((actor) => (actor.type = Actor.Types.MeshActor));
  }
}
