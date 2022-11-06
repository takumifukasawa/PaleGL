import {Actor} from "./Actor.js";
import {Matrix4} from "../math/Matrix4.js";
import {Vector4} from "../math/Vector4.js";
import {RenderTarget} from "./RenderTarget.js";
import {ActorTypes} from "../constants.js";

export class Camera extends Actor {
    viewMatrix = Matrix4.identity();
    projectionMatrix = Matrix4.identity();
    renderTarget;
    clearColor; // TODO: color class
    #postProcess;
    near;
    far;
    
    get postProcess() {
        return this.#postProcess;
    }
    
    get enabledPostProcess() {
        if(!this.postProcess) {
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
        if(this.renderTarget) {
            return this.renderTarget;
        }
        return null;
    }
    
    constructor({ clearColor, postProcess } = {}) {
        super(ActorTypes.Camera);
        this.clearColor = clearColor || new Vector4(0, 0, 0, 1);
        this.#postProcess = postProcess;
    }
    
    setSize(width, height) {
        if(!this.#postProcess) {
            return;
        }
        if(this.renderTarget) {
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
    }
    
    setRenderTarget(renderTarget) {
        this.renderTarget = renderTarget;
    }
}