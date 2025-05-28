import { createLight, Light, LightArgs } from '@/PaleGL/actors/lights/light.ts';
import {createOrthographicCamera, OrthographicCamera} from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import { addChildActor } from '@/PaleGL/actors/actor.ts';
import {LightTypes, RenderTargetTypes, TextureDepthPrecisionType} from '@/PaleGL/constants.ts';
import { UpdateLightFunc, updateShadowCamera } from '@/PaleGL/actors/lights/lightBehaviours.ts';
import {setRotationY} from "@/PaleGL/core/transform.ts";
import {setOrthoSize} from "@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts";
import {createRenderTarget} from "@/PaleGL/core/renderTarget.ts";
import {Gpu} from "@/PaleGL/core/gpu.ts";

export type DirectionalLight = Light;

export function createDirectionalLight(options: LightArgs): DirectionalLight {
    const light = createLight({ ...options, lightType: LightTypes.Directional });

    // light.shadowCamera = createOrthographicCamera(-1, 1, -1, 1, 0.1, 1);
    // // ライトが向いている方向と逆を向かせたいので(projectionの過程でz軸が逆になるから)
    // setRotationY(light.shadowCamera.transform, 180);

    // addChildActor(light, light.shadowCamera);

    return {
        ...light,
        // // overrides
        // update,
    };
}

export const updateDirectionalLight: UpdateLightFunc = (light: Light) => {
    updateShadowCamera(light);
};

export const createDirectionalLightShadow = (gpu: Gpu, directionalLight:DirectionalLight) => {
    directionalLight.shadowCamera = createOrthographicCamera(-1, 1, -1, 1, 0.1, 1);
    // ライトが向いている方向と逆を向かせたいので(projectionの過程でz軸が逆になるから)
    setRotationY(directionalLight.shadowCamera.transform, 180);

    addChildActor(directionalLight, directionalLight.shadowCamera);

    directionalLight.shadowCamera.visibleFrustum = true;
    directionalLight.castShadow = true;
    directionalLight.shadowCamera.near = 1;
    directionalLight.shadowCamera.far = 15;
    // (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -12, 12, -12, 12);
    // (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -5, 5, -5, 5);
    setOrthoSize(directionalLight.shadowCamera, null, null, -7, 7, -7, 7);
    directionalLight.shadowMap = createRenderTarget({
        gpu,
        width: 1024,
        height: 1024,
        type: RenderTargetTypes.Depth,
        depthPrecision: TextureDepthPrecisionType.High,
    });
}
