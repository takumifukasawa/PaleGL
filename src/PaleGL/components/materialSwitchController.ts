import { NeedsShorten } from '@/Marionetter/types';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import {
    Component,
    ComponentBehaviour,
    ComponentModel,
    createComponent,
    OnProcessPropertyBinderCallback,
} from '@/PaleGL/components/component.ts';
import { COMPONENT_TYPE_MATERIAL_SWITCH } from '@/PaleGL/constants.ts';

const Property = {
    materialIndex: NeedsShorten ? 'ms_mi' : 'materialIndex',
} as const;

export type MaterialSwitchControllerBehaviour = ComponentBehaviour & {
    switchMaterial: (index: number) => void;
};

export type MaterialSwitchController = Component<ComponentModel, MaterialSwitchControllerBehaviour>;

export const createMaterialSwitchController = (mesh: Mesh): MaterialSwitchController => {
    const switchMaterial = (index: number) => {
        for (let i = 0; i < mesh.materials.length; i++) {
            mesh.materials[i].canRender = i === index;
        }
        for (let i = 0; i < mesh.depthMaterials.length; i++) {
            mesh.depthMaterials[i].canRender = i === index;
        }
    };

    const onProcessPropertyBinder: OnProcessPropertyBinderCallback = (actor, componentModel, key, value) => {
        if (key === Property.materialIndex) {
            const materialIndex=  Math.floor((value as number) + .001); // 念のためちょっとオフセット
            switchMaterial(materialIndex);
        }
    };

    return createComponent({ type: COMPONENT_TYPE_MATERIAL_SWITCH, onProcessPropertyBinder }, { switchMaterial });
};
