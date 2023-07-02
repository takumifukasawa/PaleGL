import {Camera} from "./Camera.js";
import {Matrix4} from "../math/Matrix4.js";
import {CameraTypes} from "../constants";

export class PerspectiveCamera extends Camera {
    fov: number;
    aspect: number = 1;

    constructor(fov: number, aspect: number, near: number, far: number) {
        super({cameraType: CameraTypes.Perspective});
        this.fov = fov;
        this.aspect = aspect; // TODO: setSizeを呼ぶ必要がある
        this.near = near;
        this.far = far;
        // TODO: いらないはず
        // this.setSize(aspect);
        this.setPerspectiveSize(aspect);
        // TODO: set width
    }
    
    setPerspectiveSize(aspect: number) {
        this.aspect = aspect;
        this.#updateProjectionMatrix();
        // this.setSize(width, height);
    }

    setSize(width: number, height: number) {
        super.setSize(width, height);
        // this.aspect = width / height;
        this.setPerspectiveSize(width / height);
        // this.#updateProjectionMatrix();
    }

    #updateProjectionMatrix() {
        this.projectionMatrix = Matrix4.getPerspectiveMatrix(this.fov * Math.PI / 180, this.aspect, this.near, this.far);
    }

    // afterUpdatedTransform() {
    //     super.afterUpdatedTransform();
    // }
}
