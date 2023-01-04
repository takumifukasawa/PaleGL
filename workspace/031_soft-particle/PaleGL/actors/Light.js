import {Actor} from "./Actor.js";
import {ActorTypes} from "../constants.js";

export class Light extends Actor {
    intensity;
    color;
    castShadow; // bool
    shadowCamera;
    shadowMap; // TODO: shadow camera に持たせたほうが良いような気もする
    
    constructor() {
        super(ActorTypes.Light);
    }

    setShadowSize() {
        throw "should implementation";
    }
}