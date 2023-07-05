import {Actor} from "@/PaleGL/actors/Actor";
import {ActorTypes} from "@/PaleGL/constants";
import {Color} from "@/PaleGL/math/Color";
// import {Camera} from "./Camera";
import {RenderTarget} from "@/PaleGL/core/RenderTarget";
import {OrthographicCamera} from "./OrthographicCamera";
import {PerspectiveCamera} from "./PerspectiveCamera";

export type LightArgs = {
};

// TODO: interfaceでいいかも
export class Light extends Actor {
    intensity: number = 1;
    color: Color = Color.white();
    castShadow: boolean = false; // bool
    shadowCamera: OrthographicCamera | PerspectiveCamera | null = null;
    shadowMap: RenderTarget | null = null; // TODO: shadow camera に持たせたほうが良いような気もする

    hasShadowCamera() {
        return !!this.shadowCamera;
    }

    constructor({}: LightArgs = {}) {
        super(ActorTypes.Light);
    }

    setSize(width: number, height: number) {
        super.setSize(width, height);
    }

    setShadowSize() {
        throw "should implementation";
    }
}
