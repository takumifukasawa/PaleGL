import {Actor} from "./Actor.js";
import {Matrix4} from "../math/Matrix4.js";
import {Vector4} from "../math/Vector4.js";

export class Camera extends Actor {
    viewMatrix = Matrix4.identity();
    projectionMatrix = Matrix4.identity();
    renderTarget;
    clearColor = new Vector4(0, 0, 0, 1); // TODO: color class
    
    constructor() {
        super();
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