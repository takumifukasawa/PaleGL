import { setV3x, setV3y, setV3z, v3x, v3y, v3z, Vector3 } from '@/PaleGL/math/vector3.ts';
import { OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
// import { getOrthoSize } from '@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts';
import { UIActor } from '@/PaleGL/actors/meshes/uiActor.ts';
import { UI_ANCHOR_TYPE_CENTER } from '@/PaleGL/constants.ts';

export const setUITranslation = (uiActor: UIActor, uiCamera: OrthographicCamera | null, position: Vector3) => {
    // console.log(uiActor)
    if (!uiCamera) {
        console.warn('uiCamera is null');
        return;
    }
    // wip
    // const [, orthoH] = getOrthoSize(uiCamera);
    switch (uiActor.anchor) {
        case UI_ANCHOR_TYPE_CENTER:
            setV3x(uiActor.transform.position, v3x(position));
            setV3y(uiActor.transform.position, -v3y(position));
            setV3z(uiActor.transform.position, v3z(position));
            break;
        default:
            console.error(`Unknown anchor type: ${uiActor.anchor as unknown as string}`);
            break;
    }
};
