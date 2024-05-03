import { Camera, FrustumVectors } from '@/PaleGL/actors/Camera';
import { Matrix4 } from '@/PaleGL/math/Matrix4.js';
import { CameraTypes } from '@/PaleGL/constants';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';

// import {Vector3} from "@/PaleGL/math/Vector3.ts";

export class PerspectiveCamera extends Camera {
    fov: number; // degree
    aspect: number = 1; // w / h
    fixedAspect: boolean = false;

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

    /**
     * 
     * @param aspect
     */
    setPerspectiveSize(aspect: number) {
        this.aspect = aspect;
        this.updateProjectionMatrix();
        // this.setSize(width, height);
    }

    /**
     * 
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        super.setSize(width, height);
        // this.aspect = width / height;
        if (!this.fixedAspect) {
            this.setPerspectiveSize(width / height);
        }
        // this.#updateProjectionMatrix();
    }

    /**
     * 
     */
    updateProjectionMatrix() {
        this.projectionMatrix = Matrix4.getPerspectiveMatrix(
            (this.fov * Math.PI) / 180,
            this.aspect,
            this.near,
            this.far
        );
    }

    /**
     * 
     */
    getFrustumLocalPositions(): FrustumVectors {
        const localForward = Vector3.back;
        const localRight = Vector3.right;
        const localUp = Vector3.up;

        const tan = ((this.fov / 2) * Math.PI) / 180;

        const nearHalfHeight = this.near * tan;
        const nearHalfWidth = nearHalfHeight * this.aspect;
        const farHalfHeight = this.far * tan;
        const farHalfWidth = farHalfHeight * this.aspect;

        const nearClipCenter = localForward.clone().scale(this.near);
        const farClipCenter = localForward.clone().scale(this.far);

        const nearClipRightOffset = localRight.clone().scale(nearHalfWidth);
        const nearClipUpOffset = localUp.clone().scale(nearHalfHeight);

        const farClipRightOffset = localRight.clone().scale(farHalfWidth);
        const farClipUpOffset = localUp.clone().scale(farHalfHeight);

        const nearLeftTop = Vector3.addVectors(nearClipCenter, nearClipRightOffset.clone().negate(), nearClipUpOffset);
        const nearRightTop = Vector3.addVectors(nearClipCenter, nearClipRightOffset, nearClipUpOffset);

        const nearLeftBottom = Vector3.addVectors(
            nearClipCenter,
            nearClipRightOffset.clone().negate(),
            nearClipUpOffset.clone().negate()
        );

        const nearRightBottom = Vector3.addVectors(
            nearClipCenter,
            nearClipRightOffset,
            nearClipUpOffset.clone().negate()
        );

        const farLeftTop = Vector3.addVectors(farClipCenter, farClipRightOffset.clone().negate(), farClipUpOffset);

        const farRightTop = Vector3.addVectors(farClipCenter, farClipRightOffset, farClipUpOffset);

        const farLeftBottom = Vector3.addVectors(
            farClipCenter,
            farClipRightOffset.clone().negate(),
            farClipUpOffset.clone().negate()
        );

        const farRightBottom = Vector3.addVectors(farClipCenter, farClipRightOffset, farClipUpOffset.clone().negate());

        return {
            nearLeftTop,
            nearRightTop,
            nearLeftBottom,
            nearRightBottom,
            farLeftTop,
            farRightTop,
            farLeftBottom,
            farRightBottom,
        };
    }

    // /**
    //  * TODO: なにかがバグってる
    //  * @param horizontal
    //  * @param vertical
    //  */
    // getWorldForwardInFrustum(horizontal: number, vertical: number) {
    //     const frustum = this.getFrustumLocalPositions();
    //     const frustumWorldFarLeftTop = frustum.farLeftTop.multiplyMatrix4(this.transform.worldMatrix);
    //     const frustumWorldRightTop = frustum.farRightTop.multiplyMatrix4(this.transform.worldMatrix);
    //     const frustumWorldLeftBottom = frustum.farLeftBottom.multiplyMatrix4(this.transform.worldMatrix);
    //     const frustumWorldRightBottom = frustum.farRightBottom.multiplyMatrix4(this.transform.worldMatrix);
    //     const leftTopDir = Vector3.subVectors(frustumWorldFarLeftTop, frustum.nearLeftTop).normalize();
    //     const rightTopDir = Vector3.subVectors(frustumWorldRightTop, frustum.nearRightTop).normalize();
    //     const leftBottomDir = Vector3.subVectors(frustumWorldLeftBottom, frustum.nearLeftBottom).normalize();
    //     const rightBottomDir = Vector3.subVectors(frustumWorldRightBottom, frustum.nearRightBottom).normalize();
    //     const topDir = Vector3.lerpVectors(leftTopDir, rightTopDir, horizontal).normalize();
    //     const bottomDir = Vector3.lerpVectors(leftBottomDir, rightBottomDir, horizontal).normalize();
    //     const localDir =  Vector3.lerpVectors(topDir, bottomDir, vertical).normalize();
    //     const worldDir = localDir.multiplyMatrix4(this.transform.worldMatrix).normalize();
    //     return worldDir.negate();
    // }
}
