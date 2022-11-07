import {Actor} from "./Actor.js";
import {Matrix4} from "../math/Matrix4.js";
import {Vector4} from "../math/Vector4.js";
import {RenderTarget} from "./RenderTarget.js";
import {ActorTypes} from "../constants.js";
import {Vector3} from "../math/Vector3.js";

export class Camera extends Actor {
    viewMatrix = Matrix4.identity();
    projectionMatrix = Matrix4.identity();
    renderTarget;
    clearColor; // TODO: color class
    #postProcess;
    near;
    far;

    get cameraForward() {
        // 見た目のforwardと逆になる値で正しい
        // ex) (0, 0, 5) -> (0, 0, 0) をみている時、カメラ的には (0, 0, -1) が正しいが (0, 0, 1) が返ってくる
        // なぜなら、projection行列でzを反転させるため
        return new Vector3(this.viewMatrix.m20, this.viewMatrix.m21, this.viewMatrix.m22).negate().normalize();
    }

    get postProcess() {
        return this.#postProcess;
    }

    get enabledPostProcess() {
        if (!this.postProcess) {
            return false;
        }
        return this.postProcess.enabled;
    }

    // get postProcessRenderTarget() {
    //     if(!this.postProcess) {
    //         return null;
    //     }
    //     return this.postProcess.renderTarget;
    // }

    get renderTarget() {
        if (this.renderTarget) {
            return this.renderTarget;
        }
        return null;
    }

    constructor({clearColor, postProcess} = {}) {
        super(ActorTypes.Camera);
        this.clearColor = clearColor || new Vector4(0, 0, 0, 1);
        this.#postProcess = postProcess;
    }

    setSize(width, height) {
        if (!this.#postProcess) {
            return;
        }
        if (this.renderTarget) {
            this.#postProcess.setSize(this.renderTarget.width, this.renderTarget.height);
        } else {
            this.#postProcess.setSize(width, height);
        }
    }

    setPostProcess(postProcess) {
        this.#postProcess = postProcess;
    }

    setClearColor(clearColor) {
        this.clearColor = clearColor;
    }

    updateTransform() {
        super.updateTransform();
        this.viewMatrix = this.transform.worldMatrix.clone().invert();
    }

    setRenderTarget(renderTarget) {
        this.renderTarget = renderTarget;
    }

    #updateProjectionMatrix() {
        throw "should implementation";
    }
}