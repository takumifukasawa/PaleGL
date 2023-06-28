import {Light} from "./Light.js";
import {OrthographicCamera} from "./OrthographicCamera.js";
import {PerspectiveCamera} from "./PerspectiveCamera.js";
import {Vector3} from "../math/Vector3.js";
import {RenderTarget} from "../core/RenderTarget.js";
import {DoubleBuffer} from "../core/DoubleBuffer.js";
import {RenderTargetTypes} from "../constants.js";

export class DirectionalLight extends Light {
    constructor() {
        super();

        this.shadowCamera = new OrthographicCamera(-1, 1, -1, 1, 0.1, 1);
        // ライトが向いている方向と逆を向かせたいので(projectionの過程でz軸が逆になるから)
        this.shadowCamera.transform.setRotationY(180);
        this.addChild(this.shadowCamera);
    }
}