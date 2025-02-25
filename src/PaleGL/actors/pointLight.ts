import { createLight, Light, LightArgs } from '@/PaleGL/actors/light.ts';
import { LightTypes } from '@/PaleGL/constants.ts';

type PointLightParams = {
    distance: number;
    attenuation: number;
};

type PointLightArgs = LightArgs & PointLightParams;

export type PointLight = Light & {
    distance: number;
    attenuation: number;
};

export function createPointLight(options: PointLightArgs) {
    const light = createLight({ ...options, lightType: LightTypes.Point });

    const distance: number = options.distance;
    const attenuation: number = options.attenuation;

    return {
        ...light,
        distance,
        attenuation,
    };
}
