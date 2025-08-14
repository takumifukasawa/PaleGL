import { Actor, ActorArgs, createActor } from '@/PaleGL/actors/actor.ts';
import { ActorTypes, LightType } from '@/PaleGL/constants.ts';
import { Color } from '@/PaleGL/math/color.ts';
import { RenderTarget } from '@/PaleGL/core/renderTarget.ts';
import { OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/cameras/perspectiveCamera.ts';
import { createMat4Identity, Matrix4 } from '@/PaleGL/math/matrix4.ts';

export type LightArgs = ActorArgs & {
    intensity: number;
    color: Color;
};

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
