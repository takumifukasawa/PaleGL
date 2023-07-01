import {Light} from "./Light.ts";
import {OrthographicCamera} from "./OrthographicCamera.ts";
import {Actor} from "./Actor.ts";
// import {PerspectiveCamera} from "./PerspectiveCamera.ts";
// import {Vector3} from "../math/Vector3.ts";
// import {RenderTarget} from "../core/RenderTarget.ts";
// import {DoubleBuffer} from "../core/DoubleBuffer.ts";
// import {RenderTargetTypes} from "../constants.ts";

export class DirectionalLight extends Light {
    constructor() {
        super();

        this.shadowCamera = new OrthographicCamera(-1, 1, -1, 1, 0.1, 1);
        // ライトが向いている方向と逆を向かせたいので(projectionの過程でz軸が逆になるから)
        this.shadowCamera.transform.setRotationY(180);
        // TODO: なぜunknownを噛ませる必要がある？
        this.addChild(this.shadowCamera as unknown as Actor);
    }
}