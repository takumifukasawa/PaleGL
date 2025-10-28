import { createLight, Light, LightArgs } from '@/PaleGL/actors/lights/light.ts';
import { LIGHT_TYPE_POINT } from '@/PaleGL/constants.ts';

type PointLightParams = {
    distance: number;
    attenuation: number;
};

type PointLightArgs = LightArgs & PointLightParams;

export type PointLight = Light & {
    distance: number;
    attenuation: number;
};

export const createPointLight = (options: PointLightArgs) => {
    const light = createLight({ ...options, lightType: LIGHT_TYPE_POINT });

    const distance: number = options.distance;
    const attenuation: number = options.attenuation;

    return {
        ...light,
        distance,
        attenuation,
    };
}
