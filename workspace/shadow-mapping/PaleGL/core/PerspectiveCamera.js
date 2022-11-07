import {Camera} from "./Camera.js";
import {Matrix4} from "../math/Matrix4.js";
import {Vector3} from "../math/Vector3.js";

export class PerspectiveCamera extends Camera {
    fov;
    aspect;
    
    constructor(fov, aspect, near, far) {
        super();
        this.fov = fov;
        this.near = near;
        this.far = far;
        this.setSize(aspect);
    }
    
    setSize(width, height) {
        super.setSize(width, height);
        this.aspect = width / height;
        this.#updateProjectionMatrix();
    }
    
    #updateProjectionMatrix() {
        this.projectionMatrix = Matrix4.getPerspectiveMatrix(this.fov * Math.PI / 180, this.aspect, this.near, this.far);
    }
}