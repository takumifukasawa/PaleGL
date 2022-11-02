import {Actor} from "../core/Actor.js";
import {ActorTypes} from "../core/constants.js";

export class Light extends Actor {
    intensity;
    constructor() {
        super(ActorTypes.Light);
    }
}