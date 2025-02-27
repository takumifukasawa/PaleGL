import { ActorUpdateArgs } from '@/PaleGL/actors/actor.ts';
import { LightType, LightTypes } from '@/PaleGL/constants.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
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
    const textureMatrix = new Matrix4(
        0.5, 0, 0, 0.5,
        0, 0.5, 0, 0.5,
        0, 0, 0.5, 0.5,
        0, 0, 0, 1,
    );
    light.lightViewProjectionMatrix = Matrix4.multiplyMatrices(
        light.shadowCamera.projectionMatrix.clone(),
        light.shadowCamera.viewMatrix.clone()
    );
    light.shadowMapProjectionMatrix = Matrix4.multiplyMatrices(textureMatrix, light.lightViewProjectionMatrix.clone());
};
