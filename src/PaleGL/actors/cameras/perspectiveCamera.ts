import {
    Camera,
    createCamera,
} from '@/PaleGL/actors/cameras/camera.ts';
import { CameraTypes } from '@/PaleGL/constants.ts';
import { updateProjectionMatrix } from '@/PaleGL/actors/cameras/cameraBehaviours.ts';

export type PerspectiveCamera = Camera & {
    fov: number; // degree
    aspect: number; // w  /h
    fixedAspect: boolean;
};

export function createPerspectiveCamera(fov: number, aspect: number, near: number, far: number, name?: string) {
    const camera = createCamera({ name, cameraType: CameraTypes.Perspective });

    const fixedAspect: boolean = false;

    // setCameraPerspectiveSize(cameras, aspect);

    const perspectiveCamera: PerspectiveCamera = {
        ...camera,
        fov,
        aspect, // w  /h
        fixedAspect,
        near,
        far,
        // // overrides
        // setSize,
        // updateProjectionMatrix,
        // getFrustumLocalPositions,
        // getFrustumWorldPositions,
    };

    updateProjectionMatrix(perspectiveCamera);

    return perspectiveCamera;
}
