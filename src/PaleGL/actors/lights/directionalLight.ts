import { createLight, Light, LightArgs } from '@/PaleGL/actors/lights/light.ts';
import { createOrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import { addChildActor } from '@/PaleGL/actors/actor.ts';
import { LightTypes } from '@/PaleGL/constants.ts';
import { UpdateLightFunc, updateShadowCamera } from '@/PaleGL/actors/lights/lightBehaviours.ts';
import {setRotationY} from "@/PaleGL/core/transform.ts";

export type DirectionalLight = Light;

export function createDirectionalLight(options: LightArgs): DirectionalLight {
    const light = createLight({ ...options, lightType: LightTypes.Directional });

    light.shadowCamera = createOrthographicCamera(-1, 1, -1, 1, 0.1, 1);
    // ライトが向いている方向と逆を向かせたいので(projectionの過程でz軸が逆になるから)
    setRotationY(light.shadowCamera.transform, 180);

    addChildActor(light, light.shadowCamera);

    return {
        ...light,
        // // overrides
        // update,
    };
}

export const updateDirectionalLight: UpdateLightFunc = (light: Light) => {
    updateShadowCamera(light);
};
