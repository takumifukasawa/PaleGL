import {Actor} from "./Actor.js";
import {ActorTypes} from "./../constants.js";

export class Mesh extends Actor {
    geometry;
    material;
    constructor(geometry, material, actorType = ActorTypes.Mesh) {
        super(actorType);
        this.geometry = geometry;
        this.material = material;
    }
}