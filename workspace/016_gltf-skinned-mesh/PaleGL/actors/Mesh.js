import {Actor} from "./Actor.js";
import {ActorTypes} from "./../constants.js";

export class Mesh extends Actor {
    geometry;
    material;
    castShadow;
    
    constructor({ geometry, material, actorType = ActorTypes.Mesh, castShadow = false }) {
        super(actorType);
        this.geometry = geometry;
        this.material = material;
        this.castShadow = !!castShadow;
    }
}