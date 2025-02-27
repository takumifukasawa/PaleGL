import {
    Camera,
    FrustumDirection,
    FrustumDirectionType,
    FrustumVectors,
    GetFrustumVectorsFunc,
    UpdateProjectionMatrixFunc,
} from '@/PaleGL/actors/cameras/camera.ts';
import { CameraType, CameraTypes } from '@/PaleGL/constants.ts';
import {
    getPerspectiveFrustumLocalPositions,
    setSizePerspectiveCamera,
    updatePerspectiveCameraProjectionMatrix,
} from '@/PaleGL/actors/cameras/perspectiveCameraBehaviour.ts';
import {
    getOrthographicFrustumLocalPositions,
    setSizeOrthographicCamera,
    updateOrthographicCameraProjectionMatrix,
} from '@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import {
    defaultUpdateActorTransform,
    SetSizeActorFunc,
    UpdateActorTransformFunc,
} from '@/PaleGL/actors/actorBehaviours.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';

// set size behaviour ---------------------------------------------------------

const setSizeCameraBehaviour: Partial<Record<CameraType, (camera: Camera, width: number, height: number) => void>> = {
    [CameraTypes.Perspective]: setSizePerspectiveCamera,
    [CameraTypes.Orthographic]: setSizeOrthographicCamera,
};

export const setSizeCamera: SetSizeActorFunc = (actor, width, height) => {
    const camera = actor as Camera;
    setSizeCameraBehaviour[camera.cameraType]?.(camera, width, height);
};

// update behaviours -------------------------------------------------------

export const updateCameraTransform: UpdateActorTransformFunc = (actor) => {
    const camera = actor as Camera;
    defaultUpdateActorTransform(actor);
    camera.viewMatrix = camera.transform.worldMatrix.clone().invert();
    camera.inverseProjectionMatrix = camera.projectionMatrix.clone().invert();
    camera.inverseViewMatrix = camera.viewMatrix.clone().invert();
    camera.viewProjectionMatrix = Matrix4.multiplyMatrices(camera.projectionMatrix, camera.viewMatrix);
    camera.inverseViewProjectionMatrix = camera.viewProjectionMatrix.clone().invert();
};

// -------------------------------------------------------


// update projection matrix behaviour -----------------------------------------

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// export const defaultUpdateProjectionMatrix = (cameras: Camera) => {
//     updateProjectionMatrix()
// }

const updateProjectionMatrixBehaviour: Partial<Record<CameraType, UpdateProjectionMatrixFunc>> = {
    [CameraTypes.Orthographic]: updateOrthographicCameraProjectionMatrix,
    [CameraTypes.Perspective]: updatePerspectiveCameraProjectionMatrix,
};

export const updateProjectionMatrix: UpdateProjectionMatrixFunc = (camera) => {
    updateProjectionMatrixBehaviour[camera.cameraType]?.(camera);
};

// get frustum local ---------------------------------------------------------

export const getFrustumLocalPositionBehaviour: Partial<Record<CameraType, GetFrustumVectorsFunc>> = {
    [CameraTypes.Perspective]: getPerspectiveFrustumLocalPositions,
    [CameraTypes.Orthographic]: getOrthographicFrustumLocalPositions,
};

export const getFrustumLocalPositions: GetFrustumVectorsFunc = (camera: Camera) => {
    return getFrustumLocalPositionBehaviour[camera.cameraType]?.(camera) || null;
};

// get frustum world ---------------------------------------------------------

export const getFrustumWorldPositions: GetFrustumVectorsFunc = (camera: Camera): FrustumVectors | null => {
    const worldPositions: {
        [key in FrustumDirectionType]: Vector3;
    } = {
        nlt: Vector3.zero,
        nrt: Vector3.zero,
        nlb: Vector3.zero,
        nrb: Vector3.zero,
        flt: Vector3.zero,
        frt: Vector3.zero,
        flb: Vector3.zero,
        frb: Vector3.zero,
    };
    const localPositions = getFrustumLocalPositions(camera);
    if (localPositions) {
        for (const d in FrustumDirection) {
            const key = d as FrustumDirectionType;
            const wp = localPositions[key].multiplyMatrix4(camera.transform.worldMatrix);
            worldPositions[key] = wp;
        }
        return worldPositions;
    } else {
        return null;
    }
};
