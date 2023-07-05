import {Camera, FrustumDirection, FrustumDirectionType, FrustumVectors} from "@/PaleGL/actors/Camera";
import {Matrix4} from "@/PaleGL/math/Matrix4.js";
import {Vector3} from "@/PaleGL/math/Vector3.js";
import {CameraTypes} from "@/PaleGL/constants";

export class OrthographicCamera extends Camera {
    left: number = 0;
    right: number = 0;
    bottom: number = 0;
    top: number = 0;
    near: number = 0;
    far: number = 0;

    constructor(left: number, right: number, bottom: number, top: number, near: number, far: number) {
        super({cameraType: CameraTypes.Orthographic});
        this.left = left;
        this.right = right;
        this.bottom = bottom;
        this.top = top;
        this.near = near;
        this.far = far;
        // this.setSize(1, 1, left, right, bottom, top);
        this.setOrthoSize(1, 1, left, right, bottom, top);
    }

    setOrthoSize(width: number | null, height: number | null, left: number, right: number, bottom: number, top: number) {
        if (left && right && top && bottom) {
            this.left = left;
            this.right = right;
            this.bottom = bottom;
            this.top = top;
        }
        if (width !== null && height !== null) {
            this.setSize(width, height);
        }
    }

    setSize(width: number, height: number) {
        super.setSize(width, height);
        // if (left && right && top && bottom) {
        //     this.left = left;
        //     this.right = right;
        //     this.bottom = bottom;
        //     this.top = top;
        // }
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        this.projectionMatrix = Matrix4.getOrthographicMatrix(this.left, this.right, this.bottom, this.top, this.near, this.far);
    }

    updateTransform() {
        super.updateTransform();
    }

    getFrustumLocalPositions(): FrustumVectors {
        const localForward = Vector3.back;
        const localRight = Vector3.right;
        const localUp = Vector3.up;

        const halfWidth = (Math.abs(this.left) + Math.abs(this.right)) / 2;
        const halfHeight = (Math.abs(this.top) + Math.abs(this.right)) / 2;

        const nearClipCenter = localForward.clone().scale(this.near);
        const farClipCenter = localForward.clone().scale(this.far);

        const clipRightOffset = localRight.clone().scale(halfWidth);
        const clipUpOffset = localUp.clone().scale(halfHeight);

        const nearLeftTop = Vector3.addVectors(
            nearClipCenter,
            clipRightOffset.clone().negate(),
            clipUpOffset
        );
        const nearRightTop = Vector3.addVectors(
            nearClipCenter,
            clipRightOffset,
            clipUpOffset
        );
        const nearLeftBottom = Vector3.addVectors(
            nearClipCenter,
            clipRightOffset.clone().negate(),
            clipUpOffset.clone().negate()
        );
        const nearRightBottom = Vector3.addVectors(
            nearClipCenter,
            clipRightOffset,
            clipUpOffset.clone().negate()
        );

        const farLeftTop = Vector3.addVectors(
            farClipCenter,
            clipRightOffset.clone().negate(),
            clipUpOffset
        );
        const farRightTop = Vector3.addVectors(
            farClipCenter,
            clipRightOffset,
            clipUpOffset
        );
        const farLeftBottom = Vector3.addVectors(
            farClipCenter,
            clipRightOffset.clone().negate(),
            clipUpOffset.clone().negate()
        );
        const farRightBottom = Vector3.addVectors(
            farClipCenter,
            clipRightOffset,
            clipUpOffset.clone().negate()
        );

        return {
            nearLeftTop,
            nearRightTop,
            nearLeftBottom,
            nearRightBottom,
            farLeftTop,
            farRightTop,
            farLeftBottom,
            farRightBottom,
        }
    }

    getFrustumWorldPositions(): FrustumVectors {
        const worldPositions: {
            [key in FrustumDirectionType]: Vector3;
        } = {
            nearLeftTop: Vector3.zero,
            nearRightTop: Vector3.zero,
            nearLeftBottom: Vector3.zero,
            nearRightBottom: Vector3.zero,
            farLeftTop: Vector3.zero,
            farRightTop: Vector3.zero,
            farLeftBottom: Vector3.zero,
            farRightBottom: Vector3.zero,
        };
        const localPositions = this.getFrustumLocalPositions();
        for (let d in FrustumDirection) {
            const key = d as FrustumDirectionType;
            const wp = localPositions[key].multiplyMatrix4(this.transform.worldMatrix);
            worldPositions[key] = wp;
        }
        // Object.keys(localPositions).forEach((key) => {
        //     const wp = localPositions[key].multiplyMatrix4(this.transform.worldMatrix);
        //     worldPositions[key] = wp;
        // });
        return worldPositions;
    }
}
