import { MaterialArgs, createMaterial } from '@/PaleGL/materials/material.ts';
import {
    DepthFuncTypes,
    ShadingModelIds,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
    VertexShaderModifier,
} from '@/PaleGL/constants';
import { Color, createColorBlack, createColorWhite } from '@/PaleGL/math/color.ts';
import { Texture } from '@/PaleGL/core/texture.ts';

import gBufferVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import litFrag from '@/PaleGL/shaders/lit-fragment.glsl';
import gBufferDepthFrag from '@/PaleGL/shaders/gbuffer-depth-fragment.glsl';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createVector4, Vector4 } from '@/PaleGL/math/vector4.ts';

export type GBufferMaterialArgs = {
    diffuseColor?: Color;
    diffuseMap?: Texture | null;
    diffuseMapTiling?: Vector4;
    metallic?: number;
    metallicMap?: Texture | null;
    metallicMapTiling?: Vector4;
    roughness?: number;
    roughnessMap?: Texture | null;
    roughnessMapTiling?: Vector4;
    emissiveColor?: Color;
    normalMap?: Texture | null;
    normalMapTiling?: Vector4;
    vertexShaderModifier?: VertexShaderModifier;
    uniforms?: UniformsData;
    shadingModelId?: ShadingModelIds;
} & MaterialArgs;

export type GBufferMaterial = ReturnType<typeof createGBufferMaterial>;

// TODO: 実質的にLitのMaterialなので、GBufferから命名剝がしたい
export function createGBufferMaterial(args: GBufferMaterialArgs) {
    const {
        // TODO: 外部化
        vertexShaderModifier = {},
        uniforms = [],
        ...options
    }: GBufferMaterialArgs = args;

    const diffuseColor: Color = args.diffuseColor || createColorWhite();
    const diffuseMap: Texture | null = args.diffuseMap || null;
    const diffuseMapTiling: Vector4 = args.diffuseMapTiling || createVector4(1, 1, 0, 0);
    const metallic: number = args.metallic || 0;
    const metallicMap: Texture | null = args.metallicMap || null;
    const metallicMapTiling: Vector4 = args.metallicMapTiling || createVector4(1, 1, 0, 0);
    const roughness: number = args.roughness !== undefined ? args.roughness : 0;
    const roughnessMap: Texture | null = args.roughnessMap || null;
    const roughnessMapTiling: Vector4 = args.roughnessMapTiling || createVector4(1, 1, 0, 0);
    const normalMap: Texture | null = args.normalMap || null;
    const normalMapTiling: Vector4 = args.normalMapTiling || createVector4(1, 1, 0, 0);
    const emissiveColor: Color = args.emissiveColor || createColorBlack();
    const shadingModelId: ShadingModelIds = args.shadingModelId || ShadingModelIds.Lit;

    const baseUniforms: UniformsData = [
        {
            name: UniformNames.DiffuseColor,
            type: UniformTypes.Color,
            value: diffuseColor || createColorWhite(),
        },
        {
            name: UniformNames.DiffuseMap,
            type: UniformTypes.Texture,
            value: diffuseMap || null,
        },
        {
            name: UniformNames.DiffuseMapTiling,
            type: UniformTypes.Vector4,
            value: diffuseMapTiling,
        },
        // uSpecularAmount: {
        //     type: UniformTypes.Float,
        //     value: specularAmount || 1,
        // },
        {
            name: UniformNames.Metallic,
            type: UniformTypes.Float,
            value: metallic,
        },
        {
            name: UniformNames.MetallicMap,
            type: UniformTypes.Texture,
            value: metallicMap,
        },
        {
            name: UniformNames.MetallicMapTiling,
            type: UniformTypes.Vector4,
            value: metallicMapTiling,
        },
        {
            name: UniformNames.Roughness,
            type: UniformTypes.Float,
            value: roughness,
        },
        {
            name: UniformNames.RoughnessMap,
            type: UniformTypes.Texture,
            value: roughnessMap,
        },
        {
            name: UniformNames.RoughnessMapTiling,
            type: UniformTypes.Vector4,
            value: roughnessMapTiling,
        },
        {
            name: UniformNames.MetallicMap,
            type: UniformTypes.Texture,
            value: metallicMap,
        },
        {
            name: UniformNames.MetallicMapTiling,
            type: UniformTypes.Vector4,
            value: metallicMapTiling,
        },
        {
            name: UniformNames.NormalMap,
            type: UniformTypes.Texture,
            value: normalMap,
        },
        {
            name: UniformNames.NormalMapTiling,
            type: UniformTypes.Vector4,
            value: normalMapTiling,
        },
        {
            name: UniformNames.EmissiveColor,
            type: UniformTypes.Color,
            value: emissiveColor,
        },
        {
            name: UniformNames.ShadingModelId,
            type: UniformTypes.Int, // float,intどちらでもいい
            value: shadingModelId,
        },
    ];

    const mergedUniforms: UniformsData = [...baseUniforms, ...(uniforms ? uniforms : [])];

    const depthUniforms: UniformsData = [
        {
            name: UniformNames.DiffuseMap,
            type: UniformTypes.Texture,
            value: diffuseMap,
        },
        {
            name: UniformNames.DiffuseMapTiling,
            type: UniformTypes.Vector4,
            value: diffuseMapTiling,
        },
    ];

    const material = createMaterial({
        ...options,
        name: 'GBufferMaterial',
        vertexShader: gBufferVert,
        fragmentShader: litFrag,
        depthFragmentShader: gBufferDepthFrag,
        vertexShaderModifier,
        uniforms: mergedUniforms,
        depthUniforms,
        useNormalMap: !!normalMap,
        depthTest: true,
        depthWrite: false,
        depthFuncType: DepthFuncTypes.Equal,
        uniformBlockNames: [UniformBlockNames.Common, UniformBlockNames.Transformations, UniformBlockNames.Camera],
    });

    // const updateUniforms = () => {
    //     setMaterialUniformValue(material, UniformNames.RoughnessMap, _roughnessMap);
    //     setMaterialUniformValue(material, UniformNames.Roughness, _roughnessMap ? 1 : _roughness);
    //     setMaterialUniformValue(material, UniformNames.RoughnessMapTiling, _roughnessMapTiling);
    //     setMaterialUniformValue(material, UniformNames.MetallicMap, _metallicMap);
    //     setMaterialUniformValue(material, UniformNames.Metallic, _metallicMap ? 1 : _metallic);
    //     setMaterialUniformValue(material, UniformNames.MetallicMapTiling, _metallicMapTiling);
    // };

    return {
        ...material,
        diffuseColor,
        diffuseMap,
        diffuseMapTiling,
        metallic,
        metallicMap,
        metallicMapTiling,
        roughness,
        roughnessMap,
        roughnessMapTiling,
        normalMap,
        normalMapTiling,
        emissiveColor,
        vertexShaderModifier,
    };
}
