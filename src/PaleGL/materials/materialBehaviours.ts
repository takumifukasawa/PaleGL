import {Material} from "@/PaleGL/materials/material.ts";
import {MaterialTypes} from "@/PaleGL/constants.ts";
import {updateGBufferMaterialUniforms} from "@/PaleGL/materials/gbufferMaterialBehaviours.ts";

type UpdateMaterial = (material: Material) => void;

const updateMaterialBehaviour: Partial<Record<MaterialTypes, UpdateMaterial>> = {
    [MaterialTypes.GBuffer]:updateGBufferMaterialUniforms,
};

export const updateMaterial = (material: Material) => {
    updateMaterialBehaviour[material.type]?.(material);
}
