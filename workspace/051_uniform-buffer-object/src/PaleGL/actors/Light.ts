import { Actor, ActorArgs } from '@/PaleGL/actors/Actor';
import { ActorTypes, LightType } from '@/PaleGL/constants';
import { Color } from '@/PaleGL/math/Color';
// import {Camera} from "./Camera";
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { OrthographicCamera } from './OrthographicCamera';
import { PerspectiveCamera } from './PerspectiveCamera';
// import { Material } from '@/PaleGL/materials/Material.ts';
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
        throw 'should implementation';
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
        this.shadowMapProjectionMatrix = Matrix4.multiplyMatrices(
            textureMatrix,
            this.shadowCamera.projectionMatrix.clone(),
            this.shadowCamera.viewMatrix.clone()
        );
    }

    // /**
    //  *
    //  * @param _targetMaterial
    //  */
    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // applyUniformsValues(_targetMaterial: Material) {
    //     throw '[Light.applyUniformsValues] should implementation';
    // }

    // /**
    //  *
    //  * @param targetMaterial
    //  */
    // applyShadowUniformValues(targetMaterial: Material) {
    //     // TODO: これはlightごとに共通化できる気がするかつ、分岐が甘い気がする（postprocessで使いたかったりする. getterが必要か？
    //     if (
    //         // targetMaterial.uniforms[UniformNames.ShadowMapProjectionMatrix] &&
    //         this.shadowCamera &&
    //         this.shadowMap
    //     ) {
    //         // clip coord (-1 ~ 1) to uv (0 ~ 1)
    //         const textureMatrix = new Matrix4(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    //         this.shadowMapProjectionMatrix = Matrix4.multiplyMatrices(
    //             textureMatrix,
    //             this.shadowCamera.projectionMatrix.clone(),
    //             this.shadowCamera.viewMatrix.clone()
    //         );
    //         targetMaterial.uniforms.setValue(UniformNames.ShadowMap, this.shadowMap.read.depthTexture);
    //         targetMaterial.uniforms.setValue(UniformNames.ShadowMapProjectionMatrix, this.shadowMapProjectionMatrix);
    //     }
    // }
}
