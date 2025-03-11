import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import {
    addVector3Array,
    cloneVector3,
    createVector3Back,
    createVector3Right,
    createVector3Up,
    negateVector3,
    scaleVector3ByScalar,
} from '@/PaleGL/math/vector3.ts';
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

    const localForward = createVector3Back();
    const localRight = createVector3Right();
    const localUp = createVector3Up();

    const tan = ((perspectiveCamera.fov / 2) * Math.PI) / 180;

    const nearHalfHeight = camera.near * tan;
    const nearHalfWidth = nearHalfHeight * perspectiveCamera.aspect;
    const farHalfHeight = camera.far * tan;
    const farHalfWidth = farHalfHeight * perspectiveCamera.aspect;

    const nearClipCenter = scaleVector3ByScalar(cloneVector3(localForward), camera.near);
    const farClipCenter = scaleVector3ByScalar(cloneVector3(localForward), camera.far);

    const nearClipRightOffset = scaleVector3ByScalar(cloneVector3(localRight), nearHalfWidth);
    const nearClipUpOffset = scaleVector3ByScalar(cloneVector3(localUp), nearHalfHeight);

    const farClipRightOffset = scaleVector3ByScalar(cloneVector3(localRight), farHalfWidth);
    const farClipUpOffset = scaleVector3ByScalar(cloneVector3(localUp), farHalfHeight);

    const nearLeftTop = addVector3Array(
        nearClipCenter,
        negateVector3(cloneVector3(nearClipRightOffset)),
        nearClipUpOffset
    );
    const nearRightTop = addVector3Array(nearClipCenter, nearClipRightOffset, nearClipUpOffset);

    const nearLeftBottom = addVector3Array(
        nearClipCenter,
        negateVector3(cloneVector3(nearClipRightOffset)),
        negateVector3(cloneVector3(nearClipUpOffset))
    );

    const nearRightBottom = addVector3Array(
        nearClipCenter,
        nearClipRightOffset,
        negateVector3(cloneVector3(nearClipUpOffset))
    );

    const farLeftTop = addVector3Array(farClipCenter, negateVector3(cloneVector3(farClipRightOffset)), farClipUpOffset);

    const farRightTop = addVector3Array(farClipCenter, farClipRightOffset, farClipUpOffset);
    // farRightTop = farLeftTop;

    const farLeftBottom = addVector3Array(
        farClipCenter,
        negateVector3(cloneVector3(farClipRightOffset)),
        negateVector3(cloneVector3(farClipUpOffset))
    );

    const farRightBottom = addVector3Array(
        farClipCenter,
        farClipRightOffset,
        negateVector3(cloneVector3(farClipUpOffset))
    );

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
