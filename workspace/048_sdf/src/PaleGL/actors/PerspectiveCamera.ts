import {Camera} from '@/PaleGL/actors/Camera';
import { Matrix4 } from '@/PaleGL/math/Matrix4.js';
import { CameraTypes } from '@/PaleGL/constants';
// import {Vector3} from "@/PaleGL/math/Vector3.ts";

export class PerspectiveCamera extends Camera {
    fov: number;
    aspect: number = 1;

    constructor(fov: number, aspect: number, near: number, far: number, name?: string) {
        super({ name, cameraType: CameraTypes.Perspective });
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
        this.updateProjectionMatrix();
        // this.setSize(width, height);
    }

    setSize(width: number, height: number) {
        super.setSize(width, height);
        // this.aspect = width / height;
        this.setPerspectiveSize(width / height);
        // this.#updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        this.projectionMatrix = Matrix4.getPerspectiveMatrix(
            (this.fov * Math.PI) / 180,
            this.aspect,
            this.near,
            this.far
        );
    }
}
