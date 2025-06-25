import {
    Camera,
    createCamera,
} from '@/PaleGL/actors/cameras/camera.ts';
import { CameraTypes } from '@/PaleGL/constants.ts';
import {setOrthoSize} from "@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts";

export type OrthographicCamera = Camera & {
    left: number;
    right: number;
    bottom: number;
    top: number;
    aspect: number;
};

export function createOrthographicCamera(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number
) {
    const aspect: number = 1;

    const camera = createCamera({ cameraType: CameraTypes.Orthographic });

    const orthographicCamera = {
        ...camera,
        left,
        right,
        bottom,
        top,
        near,
        far,
        aspect,
        // // overrides
        // setSize,
        // getFrustumLocalPositions,
        // getFrustumWorldPositions
    };

    setOrthoSize(orthographicCamera, 1, 1, left, right, bottom, top);

    return orthographicCamera;
}
