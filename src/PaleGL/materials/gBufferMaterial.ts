import {
    DEPTH_FUNC_TYPE_EQUAL,
    MATERIAL_TYPE_G_BUFFER,
    ShadingModelIds,
    SHADING_MODEL_ID_LIT,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_NAME_BASE_COLOR,
    UNIFORM_NAME_BASE_MAP,
    UNIFORM_NAME_BASE_MAP_TILING,
    UNIFORM_NAME_EMISSIVE_COLOR,
    UNIFORM_NAME_HEIGHT_MAP,
    UNIFORM_NAME_HEIGHT_MAP_TILING,
    UNIFORM_NAME_HEIGHT_SCALE,
    UNIFORM_NAME_METALLIC,
    UNIFORM_NAME_METALLIC_MAP,
    UNIFORM_NAME_METALLIC_MAP_TILING,
    UNIFORM_NAME_NORMAL_MAP,
    UNIFORM_NAME_NORMAL_MAP_TILING,
    UNIFORM_NAME_ROUGHNESS,
    UNIFORM_NAME_ROUGHNESS_MAP,
    UNIFORM_NAME_ROUGHNESS_MAP_TILING,
    UNIFORM_NAME_SHADING_MODEL_ID,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_VECTOR4,
    UNIFORM_TYPE_INT,
    UNIFORM_TYPE_COLOR,

} from '@/PaleGL/constants';
import { Texture } from '@/PaleGL/core/texture.ts';
import { createMaterial, Material, MaterialArgs } from '@/PaleGL/materials/material.ts';
import { Color, createColorBlack, createColorWhite } from '@/PaleGL/math/color.ts';

import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createVector4, Vector4 } from '@/PaleGL/math/vector4.ts';
import gBufferDepthFrag from '@/PaleGL/shaders/gbuffer-depth-fragment.glsl';
import gBufferVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import litFrag from '@/PaleGL/shaders/lit-fragment.glsl';

export type GBufferMaterialIndividualParameters = {
    baseColor?: Color;
    baseMap?: Texture | null;
    baseMapTiling?: Vector4;
    metallic?: number;
    metallicMap?: Texture | null;
    metallicMapTiling?: Vector4;
    roughness?: number;
    roughnessMap?: Texture | null;
    roughnessMapTiling?: Vector4;
    emissiveColor?: Color;
    normalMap?: Texture | null;
    normalMapTiling?: Vector4;
    heightMap?: Texture | null;
    heightMapTiling?: Vector4;
    heightScale?: number;
};

export type GBufferMaterialArgs = MaterialArgs &
    GBufferMaterialIndividualParameters & {
        shadingModelId?: ShadingModelIds;
    };

// export type GBufferMaterial = ReturnType<typeof createGBufferMaterial>;
// export type GBufferMaterial = Material & GBufferMaterialIndividualParameters & {
export type GBufferMaterial = Material & {
    cachedGBufferArgs: GBufferMaterialArgs;
}

// TODO: 実質的にLitのMaterialなので、GBufferから命名剝がしたい
export const createGBufferMaterial = (args: GBufferMaterialArgs): GBufferMaterial => {
    const {
        // TODO: 外部化
        // vertexShaderModifiers = [],
        uniforms = [],
        uniformBlockNames = [],
        ...options
    }: GBufferMaterialArgs = args;

    const baseColor: Color = args.baseColor || createColorWhite();
    const baseMap: Texture | null = args.baseMap || null;
    const baseMapTiling: Vector4 = args.baseMapTiling || createVector4(1, 1, 0, 0);
    const metallic: number = args.metallic || 0;
    const metallicMap: Texture | null = args.metallicMap || null;
    const metallicMapTiling: Vector4 = args.metallicMapTiling || createVector4(1, 1, 0, 0);
    const roughness: number = args.roughness !== undefined ? args.roughness : 0;
    const roughnessMap: Texture | null = args.roughnessMap || null;
    const roughnessMapTiling: Vector4 = args.roughnessMapTiling || createVector4(1, 1, 0, 0);
    const normalMap: Texture | null = args.normalMap || null;
    const normalMapTiling: Vector4 = args.normalMapTiling || createVector4(1, 1, 0, 0);
    const heightMap: Texture | null = args.heightMap || null;
    const heightScale: number = args.heightScale || 1.0;
    const heightMapTiling: Vector4 = args.heightMapTiling || createVector4(1, 1, 0, 0);
    const emissiveColor: Color = args.emissiveColor || createColorBlack();
    const shadingModelId: ShadingModelIds = args.shadingModelId || SHADING_MODEL_ID_LIT;

    const commonUniforms: UniformsData = [
        [UNIFORM_NAME_BASE_MAP, UNIFORM_TYPE_TEXTURE, baseMap || null],
        [UNIFORM_NAME_BASE_MAP_TILING, UNIFORM_TYPE_VECTOR4, baseMapTiling],
        [UNIFORM_NAME_HEIGHT_MAP, UNIFORM_TYPE_TEXTURE, heightMap],
        [UNIFORM_NAME_HEIGHT_MAP_TILING, UNIFORM_TYPE_VECTOR4, heightMapTiling],
        [UNIFORM_NAME_HEIGHT_SCALE, UNIFORM_TYPE_FLOAT, heightScale],
    ];

    const gbufferUniforms: UniformsData = [
        [UNIFORM_NAME_BASE_COLOR, UNIFORM_TYPE_COLOR, baseColor || createColorWhite()],

        [UNIFORM_NAME_METALLIC, UNIFORM_TYPE_FLOAT, metallic],
        [UNIFORM_NAME_METALLIC_MAP, UNIFORM_TYPE_TEXTURE, metallicMap],
        [UNIFORM_NAME_METALLIC_MAP_TILING, UNIFORM_TYPE_VECTOR4, metallicMapTiling],
        [UNIFORM_NAME_ROUGHNESS, UNIFORM_TYPE_FLOAT, roughness],
        [UNIFORM_NAME_ROUGHNESS_MAP, UNIFORM_TYPE_TEXTURE, roughnessMap],
        [UNIFORM_NAME_ROUGHNESS_MAP_TILING, UNIFORM_TYPE_VECTOR4, roughnessMapTiling],
        [UNIFORM_NAME_METALLIC_MAP, UNIFORM_TYPE_TEXTURE, metallicMap],
        [UNIFORM_NAME_METALLIC_MAP_TILING, UNIFORM_TYPE_VECTOR4, metallicMapTiling],
        [UNIFORM_NAME_NORMAL_MAP, UNIFORM_TYPE_TEXTURE, normalMap],
        [UNIFORM_NAME_NORMAL_MAP_TILING, UNIFORM_TYPE_VECTOR4, normalMapTiling],
        [UNIFORM_NAME_EMISSIVE_COLOR, UNIFORM_TYPE_COLOR, emissiveColor],
        [UNIFORM_NAME_SHADING_MODEL_ID, UNIFORM_TYPE_INT, shadingModelId],
        // float,intどちらでもいい
    ];

    const mergedUniforms: UniformsData = [...commonUniforms, ...gbufferUniforms, ...uniforms];

    const depthUniforms: UniformsData = [...commonUniforms, ...uniforms];

    const material = createMaterial({
        name: 'GBufferMaterial',
        type: MATERIAL_TYPE_G_BUFFER,
        vertexShader: gBufferVert,
        fragmentShader: args.fragmentShader || litFrag,
        depthFragmentShader: args.depthFragmentShader || gBufferDepthFrag,
        // vertexShaderModifiers,
        uniforms: mergedUniforms,
        depthUniforms,
        useNormalMap: !!normalMap,
        depthTest: true,
        depthWrite: false,
        depthFuncType: DEPTH_FUNC_TYPE_EQUAL,
        ...options, // override
        uniformBlockNames: [
            UNIFORM_BLOCK_NAME_COMMON,
            UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
            UNIFORM_BLOCK_NAME_CAMERA,
            ...(uniformBlockNames || []), // merge
        ],
    });

    // const updateUniforms = () => {
    //     setMaterialUniformValue(material, UNIFORM_NAME_ROUGHNESS_MAP, _roughnessMap);
    //     setMaterialUniformValue(material, UNIFORM_NAME_ROUGHNESS, _roughnessMap ? 1 : _roughness);
    //     setMaterialUniformValue(material, UNIFORM_NAME_ROUGHNESS_MAP_TILING, _roughnessMapTiling);
    //     setMaterialUniformValue(material, UNIFORM_NAME_METALLIC_MAP, _metallicMap);
    //     setMaterialUniformValue(material, UNIFORM_NAME_METALLIC, _metallicMap ? 1 : _metallic);
    //     setMaterialUniformValue(material, UNIFORM_NAME_METALLIC_MAP_TILING, _metallicMapTiling);
    // };
    
    // const gBufferIndividualParameters: GBufferMaterialIndividualParameters = {
    //     baseColor,
    //     baseMap,
    //     baseMapTiling,
    //     metallic,
    //     metallicMap,
    //     metallicMapTiling,
    //     roughness,
    //     roughnessMap,
    //     roughnessMapTiling,
    //     normalMap,
    //     normalMapTiling,
    //     heightMap,
    //     heightMapTiling,
    //     heightScale,
    //     emissiveColor,
    // };
    
    return {
        cachedGBufferArgs: args,
        // ...gBufferIndividualParameters,
        ...material,
        // vertexShaderModifiers,
    };
}
