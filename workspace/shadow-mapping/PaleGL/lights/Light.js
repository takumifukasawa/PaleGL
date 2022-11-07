import {Actor} from "../core/Actor.js";
import {ActorTypes} from "../constants.js";

export class Light extends Actor {
    intensity;
    color;
    castShadow; // bool
    shadowCamera;
    shadowMap;
    
    constructor() {
        super(ActorTypes.Light);
    }

    setShadowSize() {
        throw "should implementation";
    }
}