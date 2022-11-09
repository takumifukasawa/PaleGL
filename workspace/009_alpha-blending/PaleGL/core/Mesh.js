import {Actor} from "./Actor.js";

export class Mesh extends Actor {
    geometry;
    material;
    constructor(geometry, material) {
        super();
        this.geometry = geometry;
        this.material = material;
    }
}