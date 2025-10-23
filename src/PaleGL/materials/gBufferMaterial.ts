import {
    DEPTH_FUNC_TYPE_EQUAL,
    MATERIAL_TYPE_G_BUFFER,
    ShadingModelIds,
    SHADING_MODEL_ID_LIT,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_BLOCK_NAME_CAMERA,
    UniformNames,
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
export function createGBufferMaterial(args: GBufferMaterialArgs): GBufferMaterial {
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
        {
            name: UniformNames.BaseMap,
            type: UNIFORM_TYPE_TEXTURE,
            value: baseMap || null,
        },
        {
            name: UniformNames.BaseMapTiling,
            type: UNIFORM_TYPE_VECTOR4,
            value: baseMapTiling,
        },
        {
            name: UniformNames.HeightMap,
            type: UNIFORM_TYPE_TEXTURE,
            value: heightMap,
        },
        {
            name: UniformNames.HeightMapTiling,
            type: UNIFORM_TYPE_VECTOR4,
            value: heightMapTiling,
        },
        {
            name: UniformNames.HeightScale,
            type: UNIFORM_TYPE_FLOAT,
            value: heightScale,
        },
    ];

    const gbufferUniforms: UniformsData = [
        {
            name: UniformNames.BaseColor,
            type: UNIFORM_TYPE_COLOR,
            value: baseColor || createColorWhite(),
        },

        {
            name: UniformNames.Metallic,
            type: UNIFORM_TYPE_FLOAT,
            value: metallic,
        },
        {
            name: UniformNames.MetallicMap,
            type: UNIFORM_TYPE_TEXTURE,
            value: metallicMap,
        },
        {
            name: UniformNames.MetallicMapTiling,
            type: UNIFORM_TYPE_VECTOR4,
            value: metallicMapTiling,
        },
        {
            name: UniformNames.Roughness,
            type: UNIFORM_TYPE_FLOAT,
            value: roughness,
        },
        {
            name: UniformNames.RoughnessMap,
            type: UNIFORM_TYPE_TEXTURE,
            value: roughnessMap,
        },
        {
            name: UniformNames.RoughnessMapTiling,
            type: UNIFORM_TYPE_VECTOR4,
            value: roughnessMapTiling,
        },
        {
            name: UniformNames.MetallicMap,
            type: UNIFORM_TYPE_TEXTURE,
            value: metallicMap,
        },
        {
            name: UniformNames.MetallicMapTiling,
            type: UNIFORM_TYPE_VECTOR4,
            value: metallicMapTiling,
        },
        {
            name: UniformNames.NormalMap,
            type: UNIFORM_TYPE_TEXTURE,
            value: normalMap,
        },
        {
            name: UniformNames.NormalMapTiling,
            type: UNIFORM_TYPE_VECTOR4,
            value: normalMapTiling,
        },
        {
            name: UniformNames.EmissiveColor,
            type: UNIFORM_TYPE_COLOR,
            value: emissiveColor,
        },
        {
            name: UniformNames.ShadingModelId,
            type: UNIFORM_TYPE_INT, // float,intどちらでもいい
            value: shadingModelId,
        },
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
    //     setMaterialUniformValue(material, UniformNames.RoughnessMap, _roughnessMap);
    //     setMaterialUniformValue(material, UniformNames.Roughness, _roughnessMap ? 1 : _roughness);
    //     setMaterialUniformValue(material, UniformNames.RoughnessMapTiling, _roughnessMapTiling);
    //     setMaterialUniformValue(material, UniformNames.MetallicMap, _metallicMap);
    //     setMaterialUniformValue(material, UniformNames.Metallic, _metallicMap ? 1 : _metallic);
    //     setMaterialUniformValue(material, UniformNames.MetallicMapTiling, _metallicMapTiling);
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
