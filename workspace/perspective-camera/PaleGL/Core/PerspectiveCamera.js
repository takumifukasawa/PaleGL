import {Camera} from "./Camera.js";
import {Matrix4} from "../Math/Matrix4.js";

export class PerspectiveCamera extends Camera {
    fov;
    aspect;
    near;
    far;
    
    constructor(fov, aspect, near, far) {
        super();
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
    }
  
    updateTransform() {
        super.updateTransform();
        this.viewMatrix = this.transform.worldMatrix.clone().invert();
        this.projectionMatrix = Matrix4.getPerspectiveMatrix(60 * Math.PI / 180, 1, 0.1, 10);
    }
}