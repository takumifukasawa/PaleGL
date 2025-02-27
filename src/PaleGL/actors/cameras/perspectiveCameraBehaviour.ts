import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/cameras/perspectiveCamera.ts';
import { setCameraSize } from '@/PaleGL/actors/cameras/cameraBehaviours.ts';

export function setSizePerspectiveCamera(camera: Camera, width: number, height: number) {
    const perspectiveCamera = camera as PerspectiveCamera;
    setCameraSize(camera, width, height);
    // this.aspect = width / height;
    if (!perspectiveCamera.fixedAspect) {
        perspectiveCamera.aspect = width / height;
        updatePerspectiveCameraProjectionMatrix(camera);
    }
    // this.#updateProjectionMatrix();
}

export function updatePerspectiveCameraProjectionMatrix(camera: Camera) {
    const perspectiveCamera = camera as PerspectiveCamera;
    perspectiveCamera.projectionMatrix = Matrix4.getPerspectiveMatrix(
        (perspectiveCamera.fov * Math.PI) / 180,
        perspectiveCamera.aspect,
        perspectiveCamera.near,
        perspectiveCamera.far
    );
}

export function getPerspectiveFrustumLocalPositions(camera: Camera) {
    const perspectiveCamera = camera as PerspectiveCamera;

    const localForward = Vector3.back;
    const localRight = Vector3.right;
    const localUp = Vector3.up;

    const tan = ((perspectiveCamera.fov / 2) * Math.PI) / 180;

    const nearHalfHeight = camera.near * tan;
    const nearHalfWidth = nearHalfHeight * perspectiveCamera.aspect;
    const farHalfHeight = camera.far * tan;
    const farHalfWidth = farHalfHeight * perspectiveCamera.aspect;

    const nearClipCenter = localForward.clone().scale(camera.near);
    const farClipCenter = localForward.clone().scale(camera.far);

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

    const nearRightBottom = Vector3.addVectors(nearClipCenter, nearClipRightOffset, nearClipUpOffset.clone().negate());

    const farLeftTop = Vector3.addVectors(farClipCenter, farClipRightOffset.clone().negate(), farClipUpOffset);

    const farRightTop = Vector3.addVectors(farClipCenter, farClipRightOffset, farClipUpOffset);
    // farRightTop = farLeftTop;

    const farLeftBottom = Vector3.addVectors(
        farClipCenter,
        farClipRightOffset.clone().negate(),
        farClipUpOffset.clone().negate()
    );

    const farRightBottom = Vector3.addVectors(farClipCenter, farClipRightOffset, farClipUpOffset.clone().negate());

    return {
        nlt: nearLeftTop,
        nrt: nearRightTop,
        nlb: nearLeftBottom,
        nrb: nearRightBottom,
        flt: farLeftTop,
        frt: farRightTop,
        flb: farLeftBottom,
        frb: farRightBottom,
    };
}

export const setPerspectiveSize = (perspectiveCamera: PerspectiveCamera, aspect: number) => {
    perspectiveCamera.aspect = aspect;
    updatePerspectiveCameraProjectionMatrix(perspectiveCamera);
};
// -------------------------------------------------------
