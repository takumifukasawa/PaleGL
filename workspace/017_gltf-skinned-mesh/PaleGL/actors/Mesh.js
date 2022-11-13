import {Actor} from "./Actor.js";
import {ActorTypes} from "./../constants.js";

export class Mesh extends Actor {
    geometry;
    material;
    depthMaterial;
    castShadow;
    
    constructor({
        geometry,
        material,
        depthMaterial = null,
        actorType = ActorTypes.Mesh,
        castShadow = false
    }) {
        super(actorType);
        this.geometry = geometry;
        this.material = material;
        this.depthMaterial = depthMaterial;
        this.castShadow = !!castShadow;
    }
}