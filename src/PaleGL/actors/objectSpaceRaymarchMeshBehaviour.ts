import { UniformNames } from '@/PaleGL/constants.ts';
import { Mesh, setUniformValueToAllMeshMaterials, UpdateMeshMaterial } from '@/PaleGL/actors/mesh.ts';
import { isPerspectiveCamera } from '@/PaleGL/actors/camera/camera.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/objectSpaceRaymarchMesh.ts';
import { Actor } from '@/PaleGL/actors/actor.ts';

const UNIFORM_NAME_PERSPECTIVE_FLAG = 'uIsPerspective';

export function updateObjectSpaceRaymarchMesh (actor: Actor) {
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
