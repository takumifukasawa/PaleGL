import { Light, LightArgs } from '@/PaleGL/actors/Light';
import { ActorUpdateArgs } from '@/PaleGL/actors/Actor';
import { LightTypes } from '@/PaleGL/constants.ts';

type PointLightParams = {
    distance: number;
    attenuation: number;
};

type PointLightArgs = LightArgs & PointLightParams;

export class PointLight extends Light {
    distance: number;
    attenuation: number;
    
    constructor(options: PointLightArgs) {
        super({ ...options, lightType: LightTypes.Point });
        this.distance = options.distance;
        this.attenuation = options.attenuation;

    }

    update(args: ActorUpdateArgs) {
        super.update(args);
    }
}
