import {Transform} from "./Transform.js";

export class Mesh {
    transform;
    geometry;
    material;
    constructor(geometry, material) {
        this.transform = new Transform();
        this.geometry = geometry;
        this.material = material;
    }
}