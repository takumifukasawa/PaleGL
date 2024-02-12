import { Light, LightArgs } from '@/PaleGL/actors/Light';
import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
import { Actor } from '@/PaleGL/actors/Actor';
// import { Vector3 } from '@/PaleGL/math/Vector3';
// import { Vector4 } from '@/PaleGL/math/Vector4';
import { LightTypes } from '@/PaleGL/constants.ts';
// import {Texture} from "@/PaleGL/core/Texture.ts";
// import {Matrix4} from "@/PaleGL/math/Matrix4.ts";
// import { Material } from '@/PaleGL/materials/Material.ts';
// import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
// import {PerspectiveCamera} from "./PerspectiveCamera";
// import {Vector3} from "@/PaleGL/math/Vector3";
// import {RenderTarget} from "@/PaleGL/core/RenderTarget";
// import {DoubleBuffer} from "@/PaleGL/core/DoubleBuffer";
// import {RenderTargetTypes} from "@/PaleGL/constants";

// type DirectionalLightStruct = {
//     direction: Vector3;
//     intensity: number;
//     color: Vector4;
//     shadowMap: Texture;
//     lightViewProjectionMatrix: Matrix4;
// };

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
     * @param targetMaterial
     */
    // applyUniformsValues(targetMaterial: Material) {
    //     targetMaterial.uniforms.setValue(UniformNames.DirectionalLight, [
    //         {
    //             name: UniformNames.LightDirection,
    //             type: UniformTypes.Vector3,
    //             // pattern1: そのまま渡す
    //             // value: light.transform.position,
    //             // pattern2: normalizeしてから渡す
    //             value: this.transform.position.clone().normalize(),
    //         },
    //         {
    //             name: UniformNames.LightIntensity,
    //             type: UniformTypes.Float,
    //             value: this.intensity,
    //         },
    //         {
    //             name: UniformNames.LightColor,
    //             type: UniformTypes.Color,
    //             value: this.color,
    //         },
    //     ]);
    //     
    //     this.applyShadowUniformValues(targetMaterial);
    // }
}
