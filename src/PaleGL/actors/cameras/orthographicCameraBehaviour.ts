import { SetSizeActorFunc } from '@/PaleGL/actors/actorBehaviours.ts';
import { Actor } from '@/PaleGL/actors/actor.ts';
import {
    Camera,
    FrustumVectors,
    GetFrustumVectorsFunc,
    setCameraSize,
    UpdateProjectionMatrixFunc,
} from '@/PaleGL/actors/cameras/camera.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { createOrthographicCamera, OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import {setTranslation} from "@/PaleGL/core/transform.ts";

export const setSizeOrthographicCamera: SetSizeActorFunc = (actor: Actor, width: number, height: number) => {
    const camera = actor as Camera;
    setCameraSize(camera, width, height);
    // if (left && right && top && bottom) {
    //     this.left = left;
    //     this.right = right;
    //     this.bottom = bottom;
    //     this.top = top;
    // }
    
    updateOrthographicCameraProjectionMatrix(camera);
};

export const updateOrthographicCameraProjectionMatrix: UpdateProjectionMatrixFunc = (camera: Camera) => {
    const orthographicCamera = camera as OrthographicCamera;
    camera.projectionMatrix = Matrix4.getOrthographicMatrix(
        orthographicCamera.left,
        orthographicCamera.right,
        orthographicCamera.bottom,
        orthographicCamera.top,
        orthographicCamera.near,
        orthographicCamera.far
    );
};

// updateTransform() {
//     super.updateTransform();
// }

export const getOrthographicFrustumLocalPositions: GetFrustumVectorsFunc = (camera: Camera): FrustumVectors | null => {
    const orthographicCamera = camera as OrthographicCamera;

    const localForward = Vector3.back;
    const localRight = Vector3.right;
    const localUp = Vector3.up;

    const halfWidth = (Math.abs(orthographicCamera.left) + Math.abs(orthographicCamera.right)) / 2;
    const halfHeight = (Math.abs(orthographicCamera.top) + Math.abs(orthographicCamera.right)) / 2;

    const nearClipCenter = localForward.clone().scale(camera.near);
    const farClipCenter = localForward.clone().scale(camera.far);

    const clipRightOffset = localRight.clone().scale(halfWidth);
    const clipUpOffset = localUp.clone().scale(halfHeight);

    const nearLeftTop = Vector3.addVectors(nearClipCenter, clipRightOffset.clone().negate(), clipUpOffset);
    const nearRightTop = Vector3.addVectors(nearClipCenter, clipRightOffset, clipUpOffset);
    const nearLeftBottom = Vector3.addVectors(
        nearClipCenter,
        clipRightOffset.clone().negate(),
        clipUpOffset.clone().negate()
    );
    const nearRightBottom = Vector3.addVectors(nearClipCenter, clipRightOffset, clipUpOffset.clone().negate());

    const farLeftTop = Vector3.addVectors(farClipCenter, clipRightOffset.clone().negate(), clipUpOffset);
    const farRightTop = Vector3.addVectors(farClipCenter, clipRightOffset, clipUpOffset);
    const farLeftBottom = Vector3.addVectors(
        farClipCenter,
        clipRightOffset.clone().negate(),
        clipUpOffset.clone().negate()
    );
    const farRightBottom = Vector3.addVectors(farClipCenter, clipRightOffset, clipUpOffset.clone().negate());

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
};

// const getFrustumWorldPositions: GetFrustumVectorsFunc = (cameras: Camera): FrustumVectors | null => {
//     const worldPositions: {
//         [key in FrustumDirectionType]: Vector3;
//     } = {
//         nlt: Vector3.zero,
//         nrt: Vector3.zero,
//         nlb: Vector3.zero,
//         nrb: Vector3.zero,
//         flt: Vector3.zero,
//         frt: Vector3.zero,
//         flb: Vector3.zero,
//         frb: Vector3.zero,
//     };
//     const localPositions = getFrustumLocalPositions(cameras);
//     if (localPositions) {
//         for (const d in FrustumDirection) {
//             const key = d as FrustumDirectionType;
//             const wp = localPositions[key].multiplyMatrix4(cameras.transform.getWorldMatrix());
//             worldPositions[key] = wp;
//         }
//         return worldPositions;
//     } else {
//         return null;
//     }
// };

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

    camera.aspect = (right - left) / (top - bottom);
};

export const createFullQuadOrthographicCamera = (): Camera => {
    const camera = createOrthographicCamera(-1, 1, -1, 1, 0, 2);
    setTranslation(camera.transform, new Vector3(0, 0, 1));
    return camera;
};
