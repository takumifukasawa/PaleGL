import { Actor, ActorArgs } from '@/PaleGL/actors/Actor';
import { ActorTypes, LightType } from '@/PaleGL/constants';
import { Color } from '@/PaleGL/math/Color';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { OrthographicCamera } from './OrthographicCamera';
import { PerspectiveCamera } from './PerspectiveCamera';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';

export type LightArgs = ActorArgs & {
    intensity: number;
    color: Color;
};

export interface ILight {
    // applyUniformsValues(targetMaterial: Material): void;
}

// TODO: interfaceでいいかも
export class Light extends Actor implements ILight {
    intensity: number = 1;
    color: Color = Color.white;
    lightType: LightType;
    castShadow: boolean = false; // bool
    shadowCamera: OrthographicCamera | PerspectiveCamera | null = null;
    shadowMap: RenderTarget | null = null; // TODO: shadow camera に持たせたほうが良いような気もする
    lightViewProjectionMatrix: Matrix4 = Matrix4.identity;
    shadowMapProjectionMatrix: Matrix4 = Matrix4.identity;

    // hasShadowMap() {
    //     return !!this.shadowCamera && this.shadowMap;
    // }

    // hasShadowCamera() {
    //     return !!this.shadowCamera;
    // }

    constructor({ name, intensity, color, lightType }: LightArgs & { lightType: LightType }) {
        super({ name, type: ActorTypes.Light });
        this.intensity = intensity;
        this.color = color;
        this.lightType = lightType;
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        super.setSize(width, height);
    }

    /**
     *
     */
    setShadowSize() {
        console.error('should implementation');
    }

    updateShadowCamera() {
        // coneCosは直径、fovは半径なので2倍
        if (!this.shadowCamera) {
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
            0, 0, 0, 1
        );
        this.lightViewProjectionMatrix = Matrix4.multiplyMatrices(
            this.shadowCamera.projectionMatrix.clone(),
            this.shadowCamera.viewMatrix.clone()
        );
        this.shadowMapProjectionMatrix = Matrix4.multiplyMatrices(
            textureMatrix,
            this.lightViewProjectionMatrix.clone()
        );
    }
}
