import { Actor, ActorArgs, createActor } from '@/PaleGL/actors/actor.ts';
import { ActorTypes, LightType } from '@/PaleGL/constants.ts';
import { Color } from '@/PaleGL/math/color.ts';
import { RenderTarget } from '@/PaleGL/core/renderTarget.ts';
import { OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/cameras/perspectiveCamera.ts';
import { createMat4Identity, Matrix4 } from '@/PaleGL/math/Matrix4.ts';

export type LightArgs = ActorArgs & {
    intensity: number;
    color: Color;
};

// export interface ILight {
//     // applyUniformsValues(targetMaterial: Material): void;
// }

// // TODO: interfaceでいいかも
// export function createLight({ name, intensity, color, lightType }: LightArgs & { lightType: LightType }) {
//
//     intensity: number = 1;
//     color: Color = Color.white;
//     lightType: LightType;
//     castShadow: boolean = false; // bool
//     shadowCamera: OrthographicCamera | PerspectiveCamera | null = null;
//     shadowMap: RenderTarget | null = null; // TODO: shadow cameras に持たせたほうが良いような気もする
//     lightViewProjectionMatrix: Matrix4 = Matrix4.identity;
//     shadowMapProjectionMatrix: Matrix4 = Matrix4.identity;
//
//     // hasShadowMap() {
//     //     return !!this.shadowCamera && this.shadowMap;
//     // }
//
//     // hasShadowCamera() {
//     //     return !!this.shadowCamera;
//     // }
//
//     constructor() {
//         super({ name, type: ActorTypes.Light });
//         this.intensity = intensity;
//         this.color = color;
//         this.lightType = lightType;
//     }
//
//     /**
//      *
//      * @param width
//      * @param height
//      */
//     setSize(width: number, height: number) {
//         super.setSize(width, height);
//     }
//
//     /**
//      *
//      */
//     setShadowSize() {
//         console.error('should implementation');
//     }
//
//     updateShadowCamera() {
//         // coneCosは直径、fovは半径なので2倍
//         if (!this.shadowCamera) {
//             return;
//         }
//
//         // this.shadowCamera.updateProjectionMatrix();
//
//         // console.log(light, light.shadowCamera, light.shadowMap)
//         // clip coord (-1 ~ 1) to uv (0 ~ 1)
//         // prettier-ignore
//         const textureMatrix = new Matrix4(
//             0.5, 0, 0, 0.5,
//             0, 0.5, 0, 0.5,
//             0, 0, 0.5, 0.5,
//             0, 0, 0, 1
//         );
//         this.lightViewProjectionMatrix = Matrix4.multiplyMatrices(
//             this.shadowCamera.projectionMatrix.clone(),
//             this.shadowCamera.viewMatrix.clone()
//         );
//         this.shadowMapProjectionMatrix = Matrix4.multiplyMatrices(
//             textureMatrix,
//             this.lightViewProjectionMatrix.clone()
//         );
//     }
// }

export type Light = Actor & {
    intensity: number;
    color: Color;
    lightType: LightType;
    castShadow: boolean;
    shadowCamera: OrthographicCamera | PerspectiveCamera | null;
    shadowMap: RenderTarget | null;
    lightViewProjectionMatrix: Matrix4;
    shadowMapProjectionMatrix: Matrix4;
    // // methods
    // updateShadowCamera: (light: Light) => void;
};

// TODO: interfaceでいいかも
export function createLight({ name, intensity, color, lightType }: LightArgs & { lightType: LightType }): Light {
    const actor = createActor({ name, type: ActorTypes.Light });

    const castShadow: boolean = false; // bool
    const shadowCamera: OrthographicCamera | PerspectiveCamera | null = null;
    const shadowMap: RenderTarget | null = null; // TODO: shadow cameras に持たせたほうが良いような気もする
    const lightViewProjectionMatrix: Matrix4 = createMat4Identity();
    const shadowMapProjectionMatrix: Matrix4 = createMat4Identity();

    return {
        ...actor,
        intensity,
        color,
        lightType,
        castShadow,
        shadowCamera,
        shadowMap,
        lightViewProjectionMatrix,
        shadowMapProjectionMatrix,
        // // methods
        // updateShadowCamera
    };
}

// export type UpdateLightFunc = (light: Light, args: ActorUpdateArgs) => void;
// 
// export const updateLightBehaviour: Partial<Record<LightType, UpdateLightFunc>> = {
//     [LightTypes.Directional]: updateDirectionalLight,
//     [LightTypes.Spot]: updateSpotLight
// };
// 
// export const updateLight: UpdateActorFunc = (actor, args) => {
//     const light = actor as Light;
//     updateLightBehaviour[light.lightType]?.(light, args);
// }
// 
// // const setSize(width: number, height: number) {
// //     super.setSize(width, height);
// // }
// 
// export const setLightShadowSize = () => {
//     console.error('should implementation');
// };
// 
// export const setShadowCamera = (light: Light, camera: OrthographicCamera | PerspectiveCamera) => {
//     light.shadowCamera = camera;
// };
// 
// export const updateShadowCamera = (light: Light) => {
//     // coneCosは直径、fovは半径なので2倍
//     if (light.shadowCamera === null) {
//         return;
//     }
// 
//     // this.shadowCamera.updateProjectionMatrix();
// 
//     // console.log(light, light.shadowCamera, light.shadowMap)
//     // clip coord (-1 ~ 1) to uv (0 ~ 1)
//     // prettier-ignore
//     const textureMatrix = new Matrix4(
//         0.5, 0, 0, 0.5,
//         0, 0.5, 0, 0.5,
//         0, 0, 0.5, 0.5,
//         0, 0, 0, 1
//     );
//     light.lightViewProjectionMatrix = Matrix4.multiplyMatrices(
//         light.shadowCamera.projectionMatrix.clone(),
//         light.shadowCamera.viewMatrix.clone()
//     );
//     light.shadowMapProjectionMatrix = Matrix4.multiplyMatrices(textureMatrix, light.lightViewProjectionMatrix.clone());
// };
