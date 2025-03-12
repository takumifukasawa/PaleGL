import { ActorUpdateArgs } from '@/PaleGL/actors/actor.ts';
import { LightType, LightTypes } from '@/PaleGL/constants.ts';
import { cloneMat4, createMatrix4, multiplyMat4Array } from '@/PaleGL/math/Matrix4.ts';
import { UpdateActorFunc } from '@/PaleGL/actors/actorBehaviours.ts';
import { updateDirectionalLight } from '@/PaleGL/actors/lights/directionalLight.ts';
import { updateSpotLight } from '@/PaleGL/actors/lights/spotLight.ts';
import { Light } from '@/PaleGL/actors/lights/light.ts';

export type UpdateLightFunc = (light: Light, args: ActorUpdateArgs) => void;

export const updateLightBehaviour: Partial<Record<LightType, UpdateLightFunc>> = {
    [LightTypes.Directional]: updateDirectionalLight,
    [LightTypes.Spot]: updateSpotLight,
};

export const updateLight: UpdateActorFunc = (actor, args) => {
    const light = actor as Light;
    updateLightBehaviour[light.lightType]?.(light, args);
};

export const updateShadowCamera = (light: Light) => {
    // coneCosは直径、fovは半径なので2倍
    if (light.shadowCamera === null) {
        return;
    }

    // this.shadowCamera.updateProjectionMatrix();

    // console.log(light, light.shadowCamera, light.shadowMap)
    // clip coord (-1 ~ 1) to uv (0 ~ 1)
    // prettier-ignore
    const textureMatrix = createMatrix4(
        0.5, 0, 0, 0.5,
        0, 0.5, 0, 0.5,
        0, 0, 0.5, 0.5,
        0, 0, 0, 1,
    );
    light.lightViewProjectionMatrix = multiplyMat4Array(
        cloneMat4(light.shadowCamera.projectionMatrix),
        cloneMat4(light.shadowCamera.viewMatrix)
    );
    light.shadowMapProjectionMatrix = multiplyMat4Array(textureMatrix, cloneMat4(light.lightViewProjectionMatrix));
};
