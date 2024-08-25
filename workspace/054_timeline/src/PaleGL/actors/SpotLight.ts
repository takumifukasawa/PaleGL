import { Light, LightArgs } from '@/PaleGL/actors/Light';
import { Actor, ActorUpdateArgs } from '@/PaleGL/actors/Actor';
import {DEG_TO_RAD, LightTypes} from '@/PaleGL/constants.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera.ts';
import { rad2Deg } from '@/PaleGL/utilities/mathUtilities.ts';

type SpotLightParams = {
    distance: number;
    attenuation: number;
    coneAngle: number;
    penumbraAngle: number;
};

type SpotLightArgs = LightArgs & SpotLightParams;

function angleToCos(deg: number) {
    return Math.cos(deg * DEG_TO_RAD);
}

export class SpotLight extends Light {
    distance: number;
    attenuation: number;
    coneAngle: number; // degree
    penumbraAngle: number; // degree

    get coneCos() {
        return angleToCos(this.coneAngle);
    }
    
    get penumbraCos() {
        return angleToCos(this.penumbraAngle);
    }

    constructor(options: SpotLightArgs) {
        super({ ...options, lightType: LightTypes.Spot });

        this.shadowCamera = new PerspectiveCamera(45, 1, 0.1, 20);
        this.shadowCamera.fixedAspect = true;
        // ライトが向いている方向と逆を向かせたいので(projectionの過程でz軸が逆になるから)
        this.shadowCamera.transform.setRotationY(180);
        // TODO: なぜunknownを噛ませる必要がある？
        this.addChild(this.shadowCamera as unknown as Actor);

        this.distance = options.distance;
        this.attenuation = options.attenuation;
        this.coneAngle = options.coneAngle;
        this.penumbraAngle = options.penumbraAngle;
    }

    update(args: ActorUpdateArgs) {
        super.update(args);
        // coneCosは直径、fovは半径なので2倍
        if (this.shadowCamera) {
            (this.shadowCamera as PerspectiveCamera).fov = rad2Deg(Math.acos(this.coneCos)) * 2;
            (this.shadowCamera as PerspectiveCamera).far = this.distance;
            
            this.shadowCamera.updateProjectionMatrix();
            
            this.updateShadowCamera();
        }
    }
}
