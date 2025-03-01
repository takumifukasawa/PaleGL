import {Material, setMaterialUniformValue} from "@/PaleGL/materials/material.ts";
import {UniformNames} from "@/PaleGL/constants.ts";
import {GBufferMaterial} from "@/PaleGL/materials/gBufferMaterial.ts";

export const updateGBufferMaterialUniforms = (material: Material) => {
    const m = material as GBufferMaterial;
    setMaterialUniformValue(material, UniformNames.RoughnessMap, m.roughnessMap);
    setMaterialUniformValue(material, UniformNames.Roughness, m.roughnessMap ? 1 : m.roughness);
    setMaterialUniformValue(material, UniformNames.RoughnessMapTiling, m.roughnessMapTiling);
    setMaterialUniformValue(material, UniformNames.MetallicMap, m.metallicMap);
    setMaterialUniformValue(material, UniformNames.Metallic, m.metallicMap ? 1 : m.metallic);
    setMaterialUniformValue(material, UniformNames.MetallicMapTiling, m.metallicMapTiling);
};
