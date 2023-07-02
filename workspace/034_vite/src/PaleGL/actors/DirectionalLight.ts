import {Light} from "./Light";
import {OrthographicCamera} from "./OrthographicCamera";
import {Actor} from "./Actor";
// import {PerspectiveCamera} from "./PerspectiveCamera";
// import {Vector3} from "../math/Vector3";
// import {RenderTarget} from "../core/RenderTarget";
// import {DoubleBuffer} from "../core/DoubleBuffer";
// import {RenderTargetTypes} from "../constants";

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
