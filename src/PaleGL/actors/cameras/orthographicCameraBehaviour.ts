import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
import { createOrthographicMatrix } from '@/PaleGL/math/matrix4.ts';
import {
    addVector3Array,
    cloneVector3,
    createVector3,
    createVector3Back,
    createVector3Right,
    createVector3Up,
    negateVector3,
    scaleVector3ByScalar,
} from '@/PaleGL/math/vector3.ts';
import { createOrthographicCamera, OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import { setTranslation } from '@/PaleGL/core/transform.ts';
import { setCameraSize } from '@/PaleGL/actors/cameras/cameraBehaviours.ts';

export function setSizeOrthographicCamera(camera: Camera, width: number, height: number) {
    // if (!camera.autoResize) {
    //     return;
    // }
    // console.log("hogehoge - setSizeOrthographicCamera", camera, width, height);
    setCameraSize(camera, width, height);
    
    updateOrthographicCameraProjectionMatrix(camera);
}

export function updateOrthographicCameraProjectionMatrix(camera: Camera) {
    const orthographicCamera = camera as OrthographicCamera;
    const { left, right, bottom, top, near, far } = orthographicCamera;
    camera.projectionMatrix = createOrthographicMatrix(left, right, bottom, top, near, far);
}

// updateTransform() {
//     super.updateTransform();
// }

export function getOrthographicFrustumLocalPositions(camera: Camera) {
    const orthographicCamera = camera as OrthographicCamera;

    const localForward = createVector3Back();
    const localRight = createVector3Right();
    const localUp = createVector3Up();

    const halfWidth = (Math.abs(orthographicCamera.left) + Math.abs(orthographicCamera.right)) / 2;
    const halfHeight = (Math.abs(orthographicCamera.top) + Math.abs(orthographicCamera.right)) / 2;

    const nearClipCenter = scaleVector3ByScalar(cloneVector3(localForward), camera.near);
    const farClipCenter = scaleVector3ByScalar(cloneVector3(localForward), camera.far);

    const clipRightOffset = scaleVector3ByScalar(cloneVector3(localRight), halfWidth);
    const clipUpOffset = scaleVector3ByScalar(cloneVector3(localUp), halfHeight);

    const nearLeftTop = addVector3Array(nearClipCenter, negateVector3(cloneVector3(clipRightOffset)), clipUpOffset);
    const nearRightTop = addVector3Array(nearClipCenter, clipRightOffset, clipUpOffset);
    const nearLeftBottom = addVector3Array(
        nearClipCenter,
        negateVector3(cloneVector3(clipRightOffset)),
        negateVector3(cloneVector3(clipUpOffset))
    );
    const nearRightBottom = addVector3Array(nearClipCenter, clipRightOffset, negateVector3(cloneVector3(clipUpOffset)));

    const farLeftTop = addVector3Array(farClipCenter, negateVector3(cloneVector3(clipRightOffset)), clipUpOffset);
    const farRightTop = addVector3Array(farClipCenter, clipRightOffset, clipUpOffset);
    const farLeftBottom = addVector3Array(
        farClipCenter,
        negateVector3(cloneVector3(clipRightOffset)),
        negateVector3(cloneVector3(clipUpOffset))
    );
    const farRightBottom = addVector3Array(farClipCenter, clipRightOffset, negateVector3(cloneVector3(clipUpOffset)));

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

export const setOrthoSize = (
    camera: OrthographicCamera,
    width: number | null,
    height: number | null,
    left: number,
    right: number,
    bottom: number,
    top: number
) => {
    if (left && right && top && bottom) {
        camera.left = left;
        camera.right = right;
        camera.bottom = bottom;
        camera.top = top;
    }
    if (width !== null && height !== null) {
        setCameraSize(camera, width, height);
    }
    
    // console.log("hogehoge - setOrthoSize", width, height, left, right, bottom, top);

    camera.aspect = (right - left) / (top - bottom);

    updateOrthographicCameraProjectionMatrix(camera);
};

export const createFullQuadOrthographicCamera = (): Camera => {
    const camera = createOrthographicCamera(-1, 1, -1, 1, 0, 2);
    setTranslation(camera.transform, createVector3(0, 0, 1));
    return camera;
};

export const getOrthoSize = (camera: OrthographicCamera): [number, number] => {
    const { left, right, bottom, top } = camera;
    const width = Math.abs(left) + Math.abs(right);
    const height = Math.abs(bottom) + Math.abs(top);
    return [ width, height ];
}
