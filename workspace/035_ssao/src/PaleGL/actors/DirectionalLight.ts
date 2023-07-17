import { Light, LightArgs } from '@/PaleGL/actors/Light';
import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
import { Actor } from '@/PaleGL/actors/Actor';
import {Vector3} from "@/PaleGL/math/Vector3.ts";
import {Vector4} from "@/PaleGL/math/Vector4.ts";
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
        super(options);

        this.shadowCamera = new OrthographicCamera(-1, 1, -1, 1, 0.1, 1);
        // ライトが向いている方向と逆を向かせたいので(projectionの過程でz軸が逆になるから)
        this.shadowCamera.transform.setRotationY(180);
        // TODO: なぜunknownを噛ませる必要がある？
        this.addChild(this.shadowCamera as unknown as Actor);
    }
}
