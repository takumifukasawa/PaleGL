import {Camera} from "./Camera.js";
import {Matrix4} from "../math/Matrix4.js";

export class PerspectiveCamera extends Camera {
    fov;
    aspect;
    near;
    far;
    
    constructor(fov, aspect, near, far) {
        super();
        this.fov = fov;
        this.near = near;
        this.far = far;
        this.setSize(aspect);
    }
    
    setSize(aspect) {
        this.aspect = aspect;
        this.#updateProjectionMatrix();
    }
    
    #updateProjectionMatrix() {
        this.projectionMatrix = Matrix4.getPerspectiveMatrix(this.fov * Math.PI / 180, this.aspect, this.near, this.far);
    }
  
    updateTransform() {
        super.updateTransform();
        this.viewMatrix = this.transform.worldMatrix.clone().invert();
    }
}