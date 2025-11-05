import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { Component, ComponentBehaviour, ComponentModel, createComponent } from '@/PaleGL/components/component.ts';
import { COMPONENT_TYPE_MATERIAL_SWITCH } from '@/PaleGL/constants.ts';

export type MaterialSwitchControllerBehaviour = ComponentBehaviour & {
    switchMaterial: (index: number) => void;
};

export type MaterialSwitchController = Component<ComponentModel, MaterialSwitchControllerBehaviour>;

export const createMaterialSwitchController = (mesh: Mesh): MaterialSwitchController => {
    const switchMaterial = (index: number) => {
        for (let i = 0; i < mesh.materials.length; i++) {
            mesh.materials[i].renderEnabled = i === index;
        }
        for (let i = 0; i < mesh.depthMaterials.length; i++) {
            mesh.depthMaterials[i].renderEnabled = i === index;
        }
    };

    return createComponent({ type: COMPONENT_TYPE_MATERIAL_SWITCH }, { switchMaterial });
};
