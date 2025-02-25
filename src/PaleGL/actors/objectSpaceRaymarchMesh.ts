import { GPU } from '@/PaleGL/core/GPU.ts';
import { ActorTypes, UniformNames } from '@/PaleGL/constants.ts';
import {
    createMesh,
    Mesh,
    MeshOptionsArgs,
    setUniformValueToAllMeshMaterials,
    UpdateMeshMaterial,
} from '@/PaleGL/actors/mesh.ts';
// import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import {
    createObjectSpaceRaymarchMaterial,
    ObjectSpaceRaymarchMaterial,
    ObjectSpaceRaymarchMaterialArgs,
} from '@/PaleGL/materials/objectSpaceRaymarchMaterial.ts';
import { createBoxGeometry } from '@/PaleGL/geometries/boxGeometry.ts';
import { isPerspectiveCamera } from '@/PaleGL/actors/camera.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { UpdateActorFunc } from '@/PaleGL/actors/actorBehaviours.ts';
// import {GBufferMaterial} from "@/PaleGL/materials/gBufferMaterial.ts";

const UNIFORM_NAME_PERSPECTIVE_FLAG = 'uIsPerspective';

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

    const mesh = createMesh({ name, geometry, materials, castShadow, type: ActorTypes.ObjectSpaceRaymarchMesh });

    return { ...mesh };
}

export const updateObjectSpaceRaymarchMesh: UpdateActorFunc = (actor) => {
    const mesh = actor as ObjectSpaceRaymarchMesh;

    // for debug
    // console.log("============")
    // console.log(this.name)
    // this.transform.scale.log()
    // this.parent?.transform.scale.log()
    // this.transform.getWorldScale().log();
    // console.log("============")

    mesh.materials.forEach((material) => {
        // local
        setMaterialUniformValue(material, UniformNames.ObjectSpaceRaymarchBoundsScale, mesh.transform.getScale());
        // wp
        // material.uniforms.setValue(UniformNames.ObjectSpaceRaymarchBoundsScale, this.transform.getWorldScale());
    });
    mesh.depthMaterials.forEach((material) => {
        // local
        setMaterialUniformValue(material, UniformNames.ObjectSpaceRaymarchBoundsScale, mesh.transform.getScale());
        // wp
        // material.uniforms.setValue(UniformNames.ObjectSpaceRaymarchBoundsScale, this.transform.getWorldScale());
    });
};

export const updateObjectSpaceRaymarchMeshMaterial: UpdateMeshMaterial = (mesh, { camera }) => {
    mesh.materials.forEach((material) => {
        setMaterialUniformValue(material, UNIFORM_NAME_PERSPECTIVE_FLAG, isPerspectiveCamera(camera) ? 1 : 0);
    });
};

export const updateObjectSpaceRaymarchDepthMaterial: UpdateMeshMaterial = (mesh, { camera }) => {
    mesh.depthMaterials.forEach((material) => {
        setMaterialUniformValue(material, UNIFORM_NAME_PERSPECTIVE_FLAG, isPerspectiveCamera(camera) ? 1 : 0);
    });
};

export const setUseWorldSpaceToObjectSpaceRaymarchMesh = (mesh: Mesh, flag: boolean) => {
    setUniformValueToAllMeshMaterials(mesh, 'uUseWorld', flag ? 1 : 0);
};
