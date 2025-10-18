import { createGBufferMaterial, GBufferMaterial } from '@/PaleGL/materials/gBufferMaterial.ts';
import { Material, MaterialArgs } from '@/PaleGL/materials/material.ts';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const updateGBufferMaterialUniforms = (_: Material) => {
    return;
};

export const replaceGBufferMaterial = (srcMaterial: Material, overrideArgs: MaterialArgs): Material => {
    const m = srcMaterial as GBufferMaterial;
    const newMaterial = createGBufferMaterial({
        ...m.cachedGBufferArgs,
        ...overrideArgs,
    });
    return newMaterial;
};
