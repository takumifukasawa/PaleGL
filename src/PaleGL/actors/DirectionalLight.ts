import { Light, LightArgs } from '@/PaleGL/actors/Light';
import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
import { Actor, ActorUpdateArgs } from '@/PaleGL/actors/Actor';
import { LightTypes } from '@/PaleGL/constants.ts';

/**
 * 
 */
export class DirectionalLight extends Light {
    constructor(options: LightArgs) {
        super({ ...options, lightType: LightTypes.Directional });

        this.shadowCamera = new OrthographicCamera(-1, 1, -1, 1, 0.1, 1);
        // ライトが向いている方向と逆を向かせたいので(projectionの過程でz軸が逆になるから)
        this.shadowCamera.transform.setRotationY(180);
        // TODO: なぜunknownを噛ませる必要がある？
        this.addChild(this.shadowCamera as unknown as Actor);
    }

    /**
     * 
     * @param args
     */
    update(args: ActorUpdateArgs) {
        super.update(args);
        this.updateShadowCamera();
    }
}
