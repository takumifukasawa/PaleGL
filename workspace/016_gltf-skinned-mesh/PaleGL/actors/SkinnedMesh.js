import {Mesh} from "./Mesh.js";
import {ActorTypes} from "../constants.js";

export class SkinnedMesh extends Mesh {
    bones;

    constructor(options) {
        super({ ...options, actorType: ActorTypes.SkinnedMesh });
        this.bones = options.bones;
    }
}