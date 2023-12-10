import { Light, LightArgs } from '@/PaleGL/actors/Light';
import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
import { Actor } from '@/PaleGL/actors/Actor';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Vector4 } from '@/PaleGL/math/Vector4';
import { LightTypes, UniformNames, UniformTypes } from '@/PaleGL/constants.ts';
import { Material } from '@/PaleGL/materials/Material.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
// import {PerspectiveCamera} from "./PerspectiveCamera";
// import {Vector3} from "@/PaleGL/math/Vector3";
// import {RenderTarget} from "@/PaleGL/core/RenderTarget";
// import {DoubleBuffer} from "@/PaleGL/core/DoubleBuffer";
// import {RenderTargetTypes} from "@/PaleGL/constants";

export type DirectionalLightStruct = {
    direction: Vector3;
    intensity: number;
    color: Vector4;
};

export class DirectionalLight extends Light {
    constructor(options: LightArgs) {
        super({ ...options, lightType: LightTypes.Directional });

        this.shadowCamera = new OrthographicCamera(-1, 1, -1, 1, 0.1, 1);
        // ライトが向いている方向と逆を向かせたいので(projectionの過程でz軸が逆になるから)
        this.shadowCamera.transform.setRotationY(180);
        // TODO: なぜunknownを噛ませる必要がある？
        this.addChild(this.shadowCamera as unknown as Actor);
    }

    applyUniformsValues(targetMaterial: Material) {
        targetMaterial.uniforms.setValue(UniformNames.DirectionalLight, [
            {
                name: 'direction',
                type: UniformTypes.Vector3,
                // pattern1: そのまま渡す
                // value: light.transform.position,
                // pattern2: normalizeしてから渡す
                value: this.transform.position.clone().normalize(),
            },
            {
                name: 'intensity',
                type: UniformTypes.Float,
                value: this.intensity,
            },
            {
                name: 'color',
                type: UniformTypes.Color,
                value: this.color,
            },
        ]);

        // TODO: これはlightごとに共通化できる気がするかつ、分岐が甘い気がする（postprocessで使いたかったりする. getterが必要か？
        if (
            // targetMaterial.uniforms[UniformNames.ShadowMapProjectionMatrix] &&
            this.shadowCamera &&
            this.shadowMap
        ) {
            // clip coord (-1 ~ 1) to uv (0 ~ 1)
            const textureMatrix = new Matrix4(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
            this.shadowMapProjectionMatrix = Matrix4.multiplyMatrices(
                textureMatrix,
                this.shadowCamera.projectionMatrix.clone(),
                this.shadowCamera.viewMatrix.clone()
            );
            targetMaterial.uniforms.setValue(UniformNames.ShadowMap, this.shadowMap.read.depthTexture);
            targetMaterial.uniforms.setValue(UniformNames.ShadowMapProjectionMatrix, this.shadowMapProjectionMatrix);
        }
    }
}
