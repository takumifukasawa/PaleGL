import {Light} from "./Light.js";
import {OrthographicCamera} from "../core/OrthographicCamera.js";
import {PerspectiveCamera} from "../core/PerspectiveCamera.js";
import {Vector3} from "../math/Vector3.js";

export class DirectionalLight extends Light {
    constructor() {
        super();

        this.shadowCamera = new OrthographicCamera(-1, 1, -1, 1, 1, 2);
        this.shadowCamera.transform.lookAt(new Vector3(0, 0, 0));
        // this.shadowCamera = new PerspectiveCamera(60, 1, 1, 2);
        this.addChild(this.shadowCamera);
    }
  
    setSize(width, height) {
    }
   
    // TODO: shadow map のサイズに応じてorthoのサイズ調整すべき？
    setShadowSize(width, height, near, far) {
        this.shadowCamera.setSize(-width, width, -height, height);
        this.shadowCamera.near = near;
        this.shadowCamera.far = far;
    }
    
    afterUpdatedTransform() {
        super.afterUpdatedTransform();
        // this.shadowCamera.transform.setTranslation(new Vector3(0, 0, 0));
        // this.shadowCamera.transform.lookAt(Vector3.addVectors(this.transform.worldPosition, this.transform.worldForward));
        // this.shadowCamera.transform.lookAt(this.transform.worldForward);
        // this.shadowCamera.updateTransform()
        // console.log("========================")
        // this.shadowCamera.transform.parent.worldMatrix.log()
        // 合ってる
        // this.transform.worldForward.log()
        // 間違ってる
        // this.shadowCamera.cameraForward.log();
        // 合ってる
        // this.shadowCamera.transform.worldForward.log();
    }
}