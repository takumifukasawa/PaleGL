import { MaterialType, MATERIAL_TYPE_G_BUFFER } from '@/PaleGL/constants.ts';
import { replaceGBufferMaterial, updateGBufferMaterialUniforms } from '@/PaleGL/materials/gbufferMaterialBehaviours.ts';
import { createMaterial, Material, MaterialArgs } from '@/PaleGL/materials/material.ts';

type UpdateMaterial = (material: Material) => void;

type ReplaceMaterial = (srcMaterial: Material, overrideArgs: MaterialArgs) => Material;

const updateMaterialBehaviour: Partial<Record<MaterialType, UpdateMaterial>> = {
    [MATERIAL_TYPE_G_BUFFER]: updateGBufferMaterialUniforms,
};

export const updateMaterial = (material: Material) => {
    updateMaterialBehaviour[material.type]?.(material);
};

const replaceMaterial: ReplaceMaterial = (srcMaterial, overrideArgs) => {
    return createMaterial({
        ...srcMaterial.cachedArgs,
        ...overrideArgs, // override
    });
};

export const replaceMaterialBehaviour: Partial<Record<MaterialType, ReplaceMaterial>> = {
    [MATERIAL_TYPE_G_BUFFER]: replaceGBufferMaterial,
};

export const cloneMaterial = (srcMaterial: Material, overrideArgs: MaterialArgs): Material => {
    const func = replaceMaterialBehaviour[srcMaterial.type];
    return func ? func(srcMaterial, overrideArgs) : replaceMaterial(srcMaterial, overrideArgs);
};
