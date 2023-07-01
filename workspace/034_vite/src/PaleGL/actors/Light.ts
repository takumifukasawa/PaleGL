import {Actor} from "./Actor.ts";
import {ActorTypes} from "../constants.ts";
import {Color} from "../math/Color.ts";
// import {Camera} from "./Camera.ts";
import {RenderTarget} from "../core/RenderTarget.ts";
import {OrthographicCamera} from "./OrthographicCamera.ts";
import {PerspectiveCamera} from "./PerspectiveCamera.ts";

// TODO: interfaceでいいかも
export class Light extends Actor {
    intensity: number = 1;
    color: Color = Color.white();
    castShadow: boolean = false; // bool
    shadowCamera: OrthographicCamera | PerspectiveCamera | null = null;
    shadowMap: RenderTarget | null = null; // TODO: shadow camera に持たせたほうが良いような気もする

    constructor() {
        super(ActorTypes.Light);
    }

    setShadowSize() {
        throw "should implementation";
    }
}