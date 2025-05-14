import { setV3x, setV3y, setV3z, Vector3 } from '@/PaleGL/math/vector3.ts';
import { OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
// import { getOrthoSize } from '@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts';
import { UIActor } from '@/PaleGL/actors/meshes/UIActor.ts';
import { UIAnchorTypes } from '@/PaleGL/constants.ts';

export const setUITranslation = (uiActor: UIActor, uiCamera: OrthographicCamera | null, position: Vector3) => {
    if (!uiCamera) {
        console.warn('uiCamera is null');
        return;
    }
    // wip
    // const [, orthoH] = getOrthoSize(uiCamera);
    switch (uiActor.anchor) {
        case UIAnchorTypes.Center:
            setV3x(uiActor.transform.position, position.x);
            setV3y(uiActor.transform.position, -position.y);
            setV3z(uiActor.transform.position, position.z);
            break;
        default:
            console.error(`Unknown anchor type: ${uiActor.anchor as unknown as string}`);
            break;
    }
};
