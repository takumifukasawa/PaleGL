import { GPU } from '@/PaleGL/core/GPU.ts';
import { MeshTypes } from '@/PaleGL/constants.ts';
import { createMesh, Mesh, MeshOptionsArgs } from '@/PaleGL/actors/mesh.ts';
// import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import {
    createObjectSpaceRaymarchMaterial,
    ObjectSpaceRaymarchMaterial,
    ObjectSpaceRaymarchMaterialArgs,
} from '@/PaleGL/materials/objectSpaceRaymarchMaterial.ts';
import { createBoxGeometry } from '@/PaleGL/geometries/boxGeometry.ts';
// import {GBufferMaterial} from "@/PaleGL/materials/gBufferMaterial.ts";

type ObjectSpaceRaymarchMeshArgs = {
    name?: string;
    gpu: GPU;
    size?: number;
    // fragmentShader: string;
    // depthFragmentShader: string;
    // uniforms?: UniformsData;

    // 1: materialを渡す場合
    materials?: ObjectSpaceRaymarchMaterial[];

    // 2: templateとcontentを渡す場合
    fragmentShaderTemplate?: string;
    fragmentShaderContent?: string;
    depthFragmentShaderTemplate?: string;
    depthFragmentShaderContent?: string;
    materialArgs?: ObjectSpaceRaymarchMaterialArgs;
} & MeshOptionsArgs;

export type ObjectSpaceRaymarchMesh = Mesh;

// NOTE: 今はbox限定. sphereも対応したい
export function createObjectSpaceRaymarchMesh(args: ObjectSpaceRaymarchMeshArgs): ObjectSpaceRaymarchMesh {
    const { gpu, name, materialArgs, castShadow, size } = args;
    const geometry = createBoxGeometry({ gpu, size });

    const materials = args.materials
        ? args.materials
        : [
              createObjectSpaceRaymarchMaterial({
                  fragmentShaderContent: args.fragmentShaderContent!,
                  depthFragmentShaderContent: args.depthFragmentShaderContent!,
                  materialArgs: materialArgs!,
              }),
          ];

    // NOTE
    // const material = new GBufferMaterial({
    //     metallic: 0,
    //     roughness: 1,
    //     receiveShadow: true,
    //     isSkinning: false,
    //     gpuSkinning: false,
    //     isInstancing: true,
    //     useInstanceLookDirection: true,
    //     useVertexColor: true,
    //     faceSide: FaceSide.Double,
    //     primitiveType: PrimitiveTypes.Triangles,
    // });

    const mesh = createMesh({ name, geometry, materials, castShadow, meshType: MeshTypes.ObjectSpaceRaymarch });

    return { ...mesh };
}
