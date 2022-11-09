import {Camera} from "./Camera.js";
import {Matrix4} from "../math/Matrix4.js";

export class OrthographicCamera extends Camera {
    
    constructor(left, right, bottom, top, near, far) {
        super();
        this.near = near;
        this.far = far;
        this.setSize(left, right, bottom, top);
    }
    
    setSize(left, right, top, bottom) {
        this.left = left;
        this.right = right;
        this.bottom = bottom;
        this.top = top;
        this.#updateProjectionMatrix();
    }
    
    #updateProjectionMatrix() {
        this.projectionMatrix = Matrix4.getOrthographicMatrix(this.left, this.right, this.top, this.bottom, this.near, this.far);
    }
  
    updateTransform() {
        super.updateTransform();
        this.viewMatrix = this.transform.worldMatrix.clone().invert();
    }
}