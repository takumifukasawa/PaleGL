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
  
    setSize(width, height) {
    }

    // TODO: shadow map のサイズに応じてorthoのサイズ調整すべき？
    // setShadowSize(width, height, near, far) {
    //     this.shadowCamera.setSize(-width, width, -height, height);
    //     this.shadowCamera.near = near;
    //     this.shadowCamera.far = far;
    // }
 
    update({ gpu }) {
        // TODO:
        // - cast shadow が有効な時だけ生成したい
        // - 外側からshadowmap渡してもよい
        // - ShadowMap class があってもよいかもしれない
        if(this.castShadow && !this.shadowMap) {
            this.shadowMap = new RenderTarget({ gpu, width: 1, height: 1, type: RenderTargetTypes.Depth });
        }
    }
    
    // afterUpdatedTransform() {
    //     super.afterUpdatedTransform();
    // }
}