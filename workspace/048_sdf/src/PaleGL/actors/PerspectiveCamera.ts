import {Camera} from '@/PaleGL/actors/Camera';
import { Matrix4 } from '@/PaleGL/math/Matrix4.js';
import { CameraTypes } from '@/PaleGL/constants';
// import {Vector3} from "@/PaleGL/math/Vector3.ts";

export class PerspectiveCamera extends Camera {
    fov: number;
    aspect: number = 1;

    constructor(fov: number, aspect: number, near: number, far: number) {
        super({ cameraType: CameraTypes.Perspective });
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

    // getFrustumLocalPositions(): FrustumVectors {
    //     const localForward = Vector3.back;
    //     const localRight = Vector3.right;
    //     const localUp = Vector3.up;

    //     const halfWidth = (Math.abs(this.left) + Math.abs(this.right)) / 2;
    //     const halfHeight = (Math.abs(this.top) + Math.abs(this.right)) / 2;

    //     const nearClipCenter = localForward.clone().scale(this.near);
    //     const farClipCenter = localForward.clone().scale(this.far);

    //     const clipRightOffset = localRight.clone().scale(halfWidth);
    //     const clipUpOffset = localUp.clone().scale(halfHeight);

    //     const nearLeftTop = Vector3.addVectors(nearClipCenter, clipRightOffset.clone().negate(), clipUpOffset);
    //     const nearRightTop = Vector3.addVectors(nearClipCenter, clipRightOffset, clipUpOffset);
    //     const nearLeftBottom = Vector3.addVectors(
    //         nearClipCenter,
    //         clipRightOffset.clone().negate(),
    //         clipUpOffset.clone().negate()
    //     );
    //     const nearRightBottom = Vector3.addVectors(nearClipCenter, clipRightOffset, clipUpOffset.clone().negate());

    //     const farLeftTop = Vector3.addVectors(farClipCenter, clipRightOffset.clone().negate(), clipUpOffset);
    //     const farRightTop = Vector3.addVectors(farClipCenter, clipRightOffset, clipUpOffset);
    //     const farLeftBottom = Vector3.addVectors(
    //         farClipCenter,
    //         clipRightOffset.clone().negate(),
    //         clipUpOffset.clone().negate()
    //     );
    //     const farRightBottom = Vector3.addVectors(farClipCenter, clipRightOffset, clipUpOffset.clone().negate());

    //     return {
    //         nearLeftTop,
    //         nearRightTop,
    //         nearLeftBottom,
    //         nearRightBottom,
    //         farLeftTop,
    //         farRightTop,
    //         farLeftBottom,
    //         farRightBottom,
    //     };
    // }

    // getFrustumWorldPositions(): FrustumVectors {
    //     const worldPositions: {
    //         [key in FrustumDirectionType]: Vector3;
    //     } = {
    //         nearLeftTop: Vector3.zero,
    //         nearRightTop: Vector3.zero,
    //         nearLeftBottom: Vector3.zero,
    //         nearRightBottom: Vector3.zero,
    //         farLeftTop: Vector3.zero,
    //         farRightTop: Vector3.zero,
    //         farLeftBottom: Vector3.zero,
    //         farRightBottom: Vector3.zero,
    //     };
    //     const localPositions = this.getFrustumLocalPositions();
    //     for (const d in FrustumDirection) {
    //         const key = d as FrustumDirectionType;
    //         const wp = localPositions[key].multiplyMatrix4(this.transform.worldMatrix);
    //         worldPositions[key] = wp;
    //     }
    //     return worldPositions;
    // }

    // afterUpdatedTransform() {
    //     super.afterUpdatedTransform();
    // }
}
