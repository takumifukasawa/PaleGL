import {
    MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_BASE_COLOR_PROPERTY_NAME,
    MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_EMISSIVE_COLOR_PROPERTY_NAME,
    MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_METALLIC_PROPERTY_NAME,
    MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_ROUGHNESS_PROPERTY_NAME,
} from '@/Marionetter/types';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { createMaterialController, MaterialController } from '@/PaleGL/components/materialController.ts';
import {
    UNIFORM_NAME_BASE_COLOR,
    UNIFORM_NAME_EMISSIVE_COLOR,
    UNIFORM_NAME_METALLIC,
    UNIFORM_NAME_ROUGHNESS,
} from '@/PaleGL/constants';
import { Color } from '@/PaleGL/math/color.ts';

const bindings = new Map([
    // prettier-ignore
    [
        MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_BASE_COLOR_PROPERTY_NAME,
        UNIFORM_NAME_BASE_COLOR
    ],
    [MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_METALLIC_PROPERTY_NAME, UNIFORM_NAME_METALLIC],
    [MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_ROUGHNESS_PROPERTY_NAME, UNIFORM_NAME_ROUGHNESS],
    [MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_EMISSIVE_COLOR_PROPERTY_NAME, UNIFORM_NAME_EMISSIVE_COLOR],
]);

export type GBufferMaterialControllerInitialValues = {
    baseColor?: Color;
    metallic?: number;
    roughness?: number;
    emissiveColor?: Color;
};

// timeline から操作される
export const createGBufferMaterialController = (
    // initialValues?: GBufferMaterialControllerInitialValues
): MaterialController => {
    const controller = createMaterialController('GBufferMaterialController', bindings, {
        // onStartCallback: (actor, componentModel, gpu, scene) => {
        //     if (initialValues) {
        //         const mesh = actor as Mesh;
        //         if (initialValues.baseColor) {
        //             setUniformValueToAllMeshMaterials(mesh, UNIFORM_NAME_BASE_COLOR, initialValues.baseColor);
        //         }
        //         if (initialValues.metallic !== undefined) {
        //             setUniformValueToAllMeshMaterials(mesh, UNIFORM_NAME_METALLIC, initialValues.metallic);
        //         }
        //         if (initialValues.roughness !== undefined) {
        //             setUniformValueToAllMeshMaterials(mesh, UNIFORM_NAME_ROUGHNESS, initialValues.roughness);
        //         }
        //         if (initialValues.emissiveColor) {
        //             setUniformValueToAllMeshMaterials(mesh, UNIFORM_NAME_EMISSIVE_COLOR, initialValues.emissiveColor);
        //         }
        //     }
        // },
    });

    return controller;
};
