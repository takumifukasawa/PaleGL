import {Actor} from "../core/Actor.js";
import {ActorTypes} from "../constants.js";

export class Light extends Actor {
    intensity;
    color;
    constructor() {
        super(ActorTypes.Light);
    }
}