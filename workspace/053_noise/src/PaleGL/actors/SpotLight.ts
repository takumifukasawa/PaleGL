import { Light, LightArgs } from '@/PaleGL/actors/Light';
import { Actor, ActorUpdateArgs } from '@/PaleGL/actors/Actor';
// import { Vector3 } from '@/PaleGL/math/Vector3';
// import { Vector4 } from '@/PaleGL/math/Vector4';
import { LightTypes } from '@/PaleGL/constants.ts';
// import { Material } from '@/PaleGL/materials/Material.ts';
// import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera.ts';
import { rad2Deg } from '@/PaleGL/utilities/mathUtilities.ts';
// import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
// import {PerspectiveCamera} from "./PerspectiveCamera";
// import {Vector3} from "@/PaleGL/math/Vector3";
// import {RenderTarget} from "@/PaleGL/core/RenderTarget";
// import {DoubleBuffer} from "@/PaleGL/core/DoubleBuffer";
// import {RenderTargetTypes} from "@/PaleGL/constants";

type SpotLightParams = {
    distance: number;
    attenuation: number;
    coneCos: number;
    penumbraCos: number;
};

type SpotLightArgs = LightArgs & SpotLightParams;

// export type SpotLightStruct = {
//     direction: Vector3;
//     intensity: number;
//     color: Vector4;
// } & SpotLightParams;

export class SpotLight extends Light {
    distance: number;
    attenuation: number;
    coneCos: number;
    penumbraCos: number;

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
        this.coneCos = options.coneCos;
        this.penumbraCos = options.penumbraCos;
    }

    // /**
    //  *
    //  * @param targetMaterial
    //  */
    // applyUniformsValues(targetMaterial: Material, index: number) {
    //     targetMaterial.uniforms.setValue(UniformNames.SpotLight, [
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
    //         {
    //             name: "distance",
    //             type: UniformTypes.Float,
    //             value: this.distance
    //         },
    //         {
    //             name: "attenuation",
    //             type: UniformTypes.Float,
    //             value: this.attenuation
    //         },
    //         {
    //             name: "coneCos",
    //             type: UniformTypes.Float,
    //             value: this.coneCos
    //         },
    //         {
    //             name: "penumbraCos",
    //             type: UniformTypes.Float,
    //             value: this.penumbraCos
    //         },
    //     ]);

    //     this.applyShadowUniformValues(targetMaterial);
    // }

    update(args: ActorUpdateArgs) {
        super.update(args);
        // coneCosは直径、fovは半径なので2倍
        if (this.shadowCamera) {
            (this.shadowCamera as PerspectiveCamera).fov = rad2Deg(Math.acos(this.coneCos)) * 2;
            (this.shadowCamera as PerspectiveCamera).far = this.distance;
            
            this.shadowCamera.updateProjectionMatrix();
            
            this.updateShadowCamera();

            // // console.log(light, light.shadowCamera, light.shadowMap)
            // // clip coord (-1 ~ 1) to uv (0 ~ 1)
            // // prettier-ignore
            // const textureMatrix = new Matrix4(
            //     0.5, 0, 0, 0.5,
            //     0, 0.5, 0, 0.5,
            //     0, 0, 0.5, 0.5,
            //     0, 0, 0, 1
            // );
            // this.shadowMapProjectionMatrix = Matrix4.multiplyMatrices(
            //     textureMatrix,
            //     this.shadowCamera?.projectionMatrix.clone(),
            //     this.shadowCamera?.viewMatrix.clone()
            // );
        }
    }
}
