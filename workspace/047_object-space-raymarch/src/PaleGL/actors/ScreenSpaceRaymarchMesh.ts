import { GPU } from '@/PaleGL/core/GPU.ts';
import {ActorTypes, PrimitiveTypes, UniformNames, UniformTypes} from '@/PaleGL/constants.ts';
import { Mesh } from '@/PaleGL/actors/Mesh.ts';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry.ts';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
import { ScreenSpaceRaymarchMaterial } from '@/PaleGL/materials/ScreenSpaceRaymarchMaterial.ts';
import { PostProcessPassBase } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import {Vector3} from "@/PaleGL/math/Vector3.ts";

type ScreenSpaceRaymarchMeshArgs = {
    gpu: GPU;
    name?: string;
    fragmentShader: string;
    depthFragmentShader: string;
    uniforms?: UniformsData;
};

export class ScreenSpaceRaymarchMesh extends Mesh {
    name: string;

    constructor({ gpu, name = '', fragmentShader, depthFragmentShader, uniforms = [] }: ScreenSpaceRaymarchMeshArgs) {
        const mergedUniforms: UniformsData = [
            {
                name: UniformNames.ViewDirection,
                type: UniformTypes.Vector3,
                value: Vector3.zero
            },
            {
                name: "uAspect",
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: "uFov",
                type: UniformTypes.Float,
                value: 0,
            },
            ...uniforms,
            ...PostProcessPassBase.commonUniforms
        ];
        // NOTE: geometryは親から渡して使いまわしてもよい
        const geometry = new PlaneGeometry({ gpu });
        const material = new ScreenSpaceRaymarchMaterial({
            fragmentShader,
            depthFragmentShader,
            uniforms: mergedUniforms,
            // receiveShadow: !!receiveShadow,
            primitiveType: PrimitiveTypes.Triangles,
        });

        super({ geometry, material, actorType: ActorTypes.Mesh });

        this.name = name;
        this.castShadow = false;
    }
}
