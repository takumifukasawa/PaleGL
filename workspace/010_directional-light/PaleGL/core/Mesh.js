import {Actor} from "./Actor.js";
import {ActorTypes} from "./../constants.js";

export class Mesh extends Actor {
    geometry;
    material;
    constructor(geometry, material) {
        super(ActorTypes.Mesh);
        this.geometry = geometry;
        this.material = material;
    }
}