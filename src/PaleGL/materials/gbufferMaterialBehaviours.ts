// import {Material, setMaterialUniformValue} from "@/PaleGL/materials/material.ts";
// import {UniformNames} from "@/PaleGL/constants.ts";
// import {GBufferMaterial} from "@/PaleGL/materials/gBufferMaterial.ts";

import {
    createGBufferMaterial,
    GBufferMaterial,
    // GBufferMaterialIndividualParameters,
} from '@/PaleGL/materials/gBufferMaterial.ts';
import { Material, MaterialArgs } from '@/PaleGL/materials/material.ts';

export const updateGBufferMaterialUniforms = (material: Material) => {
    // const m = material as GBufferMaterial;
    // console.log("hogehoge",m)
    // console.warn("updateGBufferMaterialUniforms is deprecated. Use setMaterialUniformValue instead.");
    return;
    // setMaterialUniformValue(material, UniformNames.RoughnessMap, m.roughnessMap);
    // setMaterialUniformValue(material, UniformNames.Roughness, m.roughnessMap ? 1 : m.roughness);
    // setMaterialUniformValue(material, UniformNames.RoughnessMapTiling, m.roughnessMapTiling);
    // setMaterialUniformValue(material, UniformNames.MetallicMap, m.metallicMap);
    // setMaterialUniformValue(material, UniformNames.Metallic, m.metallicMap ? 1 : m.metallic);
    // setMaterialUniformValue(material, UniformNames.MetallicMapTiling, m.metallicMapTiling);
};

// const getIndividualParameters = (m: GBufferMaterial): GBufferMaterialIndividualParameters => {
//     const {
//         baseColor,
//         baseMap,
//         baseMapTiling,
//         metallic,
//         metallicMap,
//         metallicMapTiling,
//         roughness,
//         roughnessMap,
//         roughnessMapTiling,
//         normalMap,
//         normalMapTiling,
//         emissiveColor,
//     } = m;
//     return {
//         baseColor,
//         baseMap,
//         baseMapTiling,
//         metallic,
//         metallicMap,
//         metallicMapTiling,
//         roughness,
//         roughnessMap,
//         roughnessMapTiling,
//         normalMap,
//         normalMapTiling,
//         emissiveColor,
//     };
// };

export const replaceGBufferMaterial = (srcMaterial: Material, overrideArgs: MaterialArgs): Material => {
    const m = srcMaterial as GBufferMaterial;
    const newMaterial = createGBufferMaterial({
        ...m.cachedGBufferArgs,
        // ...getIndividualParameters(srcMaterial),
        ...overrideArgs,
    });
    return newMaterial;
};
