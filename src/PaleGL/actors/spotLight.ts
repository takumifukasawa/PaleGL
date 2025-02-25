import { createLight, Light, LightArgs, UpdateLightFunc, updateShadowCamera } from '@/PaleGL/actors/light.ts';
import { addChildActor } from '@/PaleGL/actors/actor.ts';
import { DEG_TO_RAD, LightTypes } from '@/PaleGL/constants.ts';
import { createPerspectiveCamera, PerspectiveCamera } from '@/PaleGL/actors/perspectiveCamera.ts';
import { rad2Deg } from '@/PaleGL/utilities/mathUtilities.ts';
import { updateProjectionMatrix } from '@/PaleGL/actors/cameraBehaviours.ts';

type SpotLightParams = {
    distance: number;
    attenuation?: number;
    coneAngle: number;
    penumbraAngle: number;
};

type SpotLightArgs = LightArgs & SpotLightParams;

function angleToCos(deg: number) {
    return Math.cos(deg * DEG_TO_RAD);
}

export type SpotLight = Light & {
    distance: number;
    attenuation: number;
    coneAngle: number;
    penumbraAngle: number;
};

export function createSpotLight(options: SpotLightArgs): SpotLight {
    const light = createLight({ ...options, lightType: LightTypes.Spot });

    light.shadowCamera = createPerspectiveCamera(45, 1, 0.1, 20);
    light.shadowCamera.fixedAspect = true;
    // ライトが向いている方向と逆を向かせたいので(projectionの過程でz軸が逆になるから)
    light.shadowCamera.transform.setRotationY(180);
    // TODO: なぜunknownを噛ませる必要がある？

    addChildActor(light, light.shadowCamera);

    const distance = options.distance;
    const attenuation = options.attenuation ?? 1.06; // TODO: 1.06でよい？
    const coneAngle = options.coneAngle; // degree
    const penumbraAngle = options.penumbraAngle; // degree

    return {
        ...light,
        distance,
        attenuation,
        coneAngle,
        penumbraAngle,
        // // overrides
        // update
    };
}

export const updateSpotLight: UpdateLightFunc = (light) => {
    const spotLight = light as SpotLight;
    // coneCosは直径、fovは半径なので2倍
    if (spotLight.shadowCamera) {
        (spotLight.shadowCamera as PerspectiveCamera).fov = rad2Deg(Math.acos(getSpotLightConeCos(spotLight))) * 2;
        (spotLight.shadowCamera as PerspectiveCamera).far = spotLight.distance;

        updateProjectionMatrix(spotLight.shadowCamera);

        updateShadowCamera(spotLight);
    }
};

export function getSpotLightConeCos(light: SpotLight) {
    return angleToCos(light.coneAngle);
}

export function getSpotLightPenumbraCos(light: SpotLight) {
    return angleToCos(light.penumbraAngle);
}
