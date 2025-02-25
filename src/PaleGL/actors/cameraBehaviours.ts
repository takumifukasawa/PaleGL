import {
    Camera,
    FrustumDirection,
    FrustumDirectionType,
    FrustumVectors,
    GetFrustumVectorsFunc,
    UpdateProjectionMatrixFunc,
} from '@/PaleGL/actors/camera.ts';
import { CameraType, CameraTypes } from '@/PaleGL/constants.ts';
import {
    getPerspectiveFrustumLocalPositions,
    updatePerspectiveCameraProjectionMatrix,
} from '@/PaleGL/actors/perspectiveCamera.ts';
import {
    getOrthographicFrustumLocalPositions,
    updateOrthographicCameraProjectionMatrix,
} from '@/PaleGL/actors/orthographicCameraBehaviour';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';

// update projection matrix behaviour -----------------------------------------

const updateProjectionMatrixBehaviour: Partial<Record<CameraType, UpdateProjectionMatrixFunc>> = {
    [CameraTypes.Orthographic]: updatePerspectiveCameraProjectionMatrix,
    [CameraTypes.Perspective]: updateOrthographicCameraProjectionMatrix,
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
            const wp = localPositions[key].multiplyMatrix4(camera.transform.getWorldMatrix());
            worldPositions[key] = wp;
        }
        return worldPositions;
    } else {
        return null;
    }
};
