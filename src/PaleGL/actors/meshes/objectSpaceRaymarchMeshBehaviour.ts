import { Actor } from '@/PaleGL/actors/actor.ts';
import { UpdateActorFunc } from '@/PaleGL/actors/actorBehaviours.ts';
import { isPerspectiveCamera } from '@/PaleGL/actors/cameras/cameraBehaviours.ts';
import { setUniformValueToAllMeshMaterials, UpdateMeshMaterial } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/meshes/objectSpaceRaymarchMesh.ts';
import { UniformNames } from '@/PaleGL/constants.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { updateMaterialSkyboxUniforms } from '@/PaleGL/postprocess/deferredShadingPass.ts';

const UNIFORM_NAME_PERSPECTIVE_FLAG = 'uIsPerspective';
const UNIFORM_NAME_USE_WORLD_FLAG = 'uUseWorld';

export const updateObjectSpaceRaymarchMesh: UpdateActorFunc = (actor: Actor) => {
    const mesh = actor as ObjectSpaceRaymarchMesh;

    // // for debug
    // console.log("============")
    // mesh.transform.getScale().log()
    // console.log("============")

    mesh.materials.forEach((material) => {
        // local
        setMaterialUniformValue(material, UniformNames.ObjectSpaceRaymarchBoundsScale, mesh.transform.scale);
        // wp
        // material.uniforms.setValue(UniformNames.ObjectSpaceRaymarchBoundsScale, this.transform.getWorldScale());
    });
    mesh.depthMaterials.forEach((material) => {
        // local
        setMaterialUniformValue(material, UniformNames.ObjectSpaceRaymarchBoundsScale, mesh.transform.scale);
        // wp
        // material.uniforms.setValue(UniformNames.ObjectSpaceRaymarchBoundsScale, this.transform.getWorldScale());
    });
};

export const updateObjectSpaceRaymarchMeshMaterial: UpdateMeshMaterial = (mesh, { camera, skybox }) => {
    mesh.materials.forEach((material) => {
        if (skybox) {
            updateMaterialSkyboxUniforms(material, skybox);
        }
        setMaterialUniformValue(material, UNIFORM_NAME_PERSPECTIVE_FLAG, isPerspectiveCamera(camera) ? 1 : 0);
    });
};

export const updateObjectSpaceRaymarchDepthMaterial: UpdateMeshMaterial = (mesh, { camera }) => {
    mesh.depthMaterials.forEach((material) => {
        setMaterialUniformValue(material, UNIFORM_NAME_PERSPECTIVE_FLAG, isPerspectiveCamera(camera) ? 1 : 0);
    });
};

export const setUseWorldSpaceToObjectSpaceRaymarchMesh = (mesh: ObjectSpaceRaymarchMesh, flag: boolean) => {
    setUniformValueToAllMeshMaterials(mesh, UNIFORM_NAME_USE_WORLD_FLAG, flag ? 1 : 0);
};
