import {MaterialArgs, createMaterial } from '@/PaleGL/materials/material.ts';
import {
    DepthFuncTypes,
    ShadingModelIds,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
    VertexShaderModifier,
} from '@/PaleGL/constants';
import { Vector2 } from '@/PaleGL/math/Vector2';
import { Color } from '@/PaleGL/math/Color';
import { Texture } from '@/PaleGL/core/texture.ts';

import gBufferVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import litFrag from '@/PaleGL/shaders/lit-fragment.glsl';
import gBufferDepthFrag from '@/PaleGL/shaders/gbuffer-depth-fragment.glsl';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';

export type GBufferMaterialArgs = {
    diffuseColor?: Color;
    diffuseMap?: Texture | null;
    diffuseMapUvScale?: Vector2;
    diffuseMapUvOffset?: Vector2;
    metallic?: number;
    metallicMap?: Texture | null;
    metallicMapTiling?: Vector4;
    roughness?: number;
    roughnessMap?: Texture | null;
    roughnessMapTiling?: Vector4;
    emissiveColor?: Color;
    normalMap?: Texture | null;
    normalMapUvScale?: Vector2;
    normalMapUvOffset?: Vector2;
    vertexShaderModifier?: VertexShaderModifier;
    uniforms?: UniformsData;
    shadingModelId?: ShadingModelIds;
} & MaterialArgs;

// // TODO: 実質的にLitのMaterialなので、GBufferから命名剝がしたい
// export function createGBufferMaterial(
//     {
//         // diffuse
//         diffuseColor,
//         diffuseMap,
//         diffuseMapUvScale, // vec2
//         diffuseMapUvOffset, // vec2
//         // normal
//         normalMap,
//         normalMapUvScale, // vec2
//         normalMapUvOffset, // vec2,
//         // params
//         // specularAmount,
//         metallic,
//         metallicMap,
//         metallicMapTiling,
//         roughness,
//         roughnessMap,
//         roughnessMapTiling,
//         // emissive
//         emissiveColor,
//         // TODO: 外部化
//         vertexShaderModifier = {},
//         shadingModelId = ShadingModelIds.Lit,
//         uniforms = [],
//         ...options
//     }: GBufferMaterialArgs = {}
// ) {
//     const _roughness: number = roughness;
//     const _roughnessMap: Texture | null = roughnessMap || null;
//     const _roughnessMapTiling: Vector4 = roughnessMapTiling || new Vector4(1, 1, 0, 0);
//     const _metallic: number = metallic || 0;
//     const _metallicMap: Texture | null = metallicMap || null;
//     const _metallicMapTiling: Vector4 = metallicMapTiling || new Vector4(1, 1, 0, 0);
//
//     constructor() {
//         // this.specularAmount =
//
//         const roughnessMapValue = roughnessMap || null;
//         const roughnessMapTilingValue = roughnessMapTiling || new Vector4(1, 1, 0, 0);
//         const roughnessValue = roughness || 0;
//         const metallicMapTilingValue = metallicMapTiling || new Vector4(1, 1, 0, 0);
//         const metallicValue = metallic || 0;
//         const metallicMapValue = metallicMap || null;
//
//         const baseUniforms: UniformsData = [
//             {
//                 name: UniformNames.DiffuseColor,
//                 type: UniformTypes.Color,
//                 value: diffuseColor || Color.white,
//             },
//             {
//                 name: UniformNames.DiffuseMap,
//                 type: UniformTypes.Texture,
//                 value: diffuseMap || null,
//             },
//             {
//                 name: UniformNames.DiffuseMapUvScale,
//                 type: UniformTypes.Vector2,
//                 // value: Vector2.one,
//                 value: diffuseMapUvScale || Vector2.one,
//             },
//             {
//                 name: UniformNames.DiffuseMapUvOffset,
//                 type: UniformTypes.Vector2,
//                 // value: Vector2.one,
//                 value: diffuseMapUvOffset || Vector2.one,
//             },
//             // uSpecularAmount: {
//             //     type: UniformTypes.Float,
//             //     value: specularAmount || 1,
//             // },
//             {
//                 name: UniformNames.Metallic,
//                 type: UniformTypes.Float,
//                 value: metallicValue,
//             },
//             {
//                 name: UniformNames.MetallicMap,
//                 type: UniformTypes.Texture,
//                 value: metallicMapValue,
//             },
//             {
//                 name: UniformNames.MetallicMapTiling,
//                 type: UniformTypes.Vector4,
//                 value: metallicMapTilingValue,
//             },
//             {
//                 name: UniformNames.Roughness,
//                 type: UniformTypes.Float,
//                 value: roughnessValue,
//             },
//             {
//                 name: UniformNames.RoughnessMap,
//                 type: UniformTypes.Texture,
//                 value: roughnessMapValue,
//             },
//             {
//                 name: UniformNames.RoughnessMapTiling,
//                 type: UniformTypes.Vector4,
//                 value: roughnessMapTilingValue,
//             },
//             {
//                 name: UniformNames.MetallicMap,
//                 type: UniformTypes.Texture,
//                 value: metallicMapValue,
//             },
//             {
//                 name: UniformNames.MetallicMapTiling,
//                 type: UniformTypes.Vector4,
//                 value: metallicMapTilingValue,
//             },
//             {
//                 name: UniformNames.NormalMap,
//                 type: UniformTypes.Texture,
//                 value: normalMap || null,
//             },
//             {
//                 name: UniformNames.NormalMapUvScale,
//                 type: UniformTypes.Vector2,
//                 // value: Vector2.one,
//                 value: normalMapUvScale || Vector2.one,
//             },
//             {
//                 name: UniformNames.NormalMapUvOffset,
//                 type: UniformTypes.Vector2,
//                 // value: Vector2.one,
//                 value: normalMapUvOffset || Vector2.one,
//             },
//             {
//                 name: UniformNames.EmissiveColor,
//                 type: UniformTypes.Color,
//                 value: emissiveColor || Color.black,
//             },
//             {
//                 name: UniformNames.ShadingModelId,
//                 type: UniformTypes.Int, // float,intどちらでもいい
//                 // value: shadingModelId,
//                 value: shadingModelId,
//             },
//         ];
//
//         const mergedUniforms: UniformsData = [...baseUniforms, ...(uniforms ? uniforms : [])];
//
//         const depthUniforms: UniformsData = [
//             {
//                 name: 'uDiffuseMap',
//                 type: UniformTypes.Texture,
//                 value: diffuseMap || null,
//             },
//             {
//                 name: 'uDiffuseMapUvScale',
//                 type: UniformTypes.Vector2,
//                 value: Vector2.one,
//             },
//             {
//                 name: 'uDiffuseMapUvOffset',
//                 type: UniformTypes.Vector2,
//                 value: Vector2.one,
//             },
//         ];
//
//         // TODO: できるだけconstructorの直後に持っていきたい
//         super({
//             ...options,
//             name: 'GBufferMaterial',
//             vertexShaderModifier,
//             uniforms: mergedUniforms,
//             depthUniforms,
//             useNormalMap: !!normalMap,
//             depthTest: true,
//             depthWrite: false,
//             depthFuncType: DepthFuncTypes.Equal,
//             uniformBlockNames: [UniformBlockNames.Common, UniformBlockNames.Transformations, UniformBlockNames.Camera],
//         });
//
//         this.roughness = roughnessValue;
//         this.roughnessMap = roughnessMapValue;
//         this.roughnessMapTiling = roughnessMapTilingValue;
//         this.metallic = metallicValue;
//         this.metallicMap = metallicMapValue;
//         this.metallicMapTiling = metallicMapTilingValue;
//     }
//
//     start({ gpu, attributeDescriptors = [] }: { gpu: GPU; attributeDescriptors: AttributeDescriptor[] }) {
//         this.vertexShader = gBufferVert;
//         this.fragmentShader = litFrag;
//         this.depthFragmentShader = gBufferDepthFrag;
//
//         super.start({ gpu, attributeDescriptors });
//
//         // console.log(gBufferVert)
//         // console.log(this.rawFragmentShader)
//     }
//
//     updateUniforms() {
//         super.updateUniforms();
//         this.uniforms.setValue(UniformNames.RoughnessMap, this.roughnessMap);
//         this.uniforms.setValue(UniformNames.Roughness, this.roughnessMap ? 1 : this.roughness);
//         this.uniforms.setValue(UniformNames.RoughnessMapTiling, this.roughnessMapTiling);
//         this.uniforms.setValue(UniformNames.MetallicMap, this.metallicMap);
//         this.uniforms.setValue(UniformNames.Metallic, this.metallicMap ? 1 : this.metallic);
//         this.uniforms.setValue(UniformNames.MetallicMapTiling, this.metallicMapTiling);
//     }
// }

export type GBufferMaterial = ReturnType<typeof createGBufferMaterial>;

// TODO: 実質的にLitのMaterialなので、GBufferから命名剝がしたい
export function createGBufferMaterial(args: GBufferMaterialArgs) {
    const {
            // TODO: 外部化
            vertexShaderModifier = {},
            uniforms = [],
    ...options
    }: GBufferMaterialArgs = args;
    
    const diffuseColor: Color = args.diffuseColor || Color.white;
    const diffuseMap: Texture | null = args.diffuseMap || null;
    const diffuseMapUvScale: Vector2 = args.diffuseMapUvScale || Vector2.one;
    const diffuseMapUvOffset: Vector2 = args.diffuseMapUvOffset || Vector2.zero;
    const metallic: number = args.metallic || 0;
    const metallicMap: Texture | null = args.metallicMap || null;
    const metallicMapTiling: Vector4 = args.metallicMapTiling || new Vector4(1, 1, 0, 0);
    const roughness: number = args.roughness !== undefined ? args.roughness : 0;
    const roughnessMap: Texture | null = args.roughnessMap || null;
    const roughnessMapTiling: Vector4 = args.roughnessMapTiling || new Vector4(1, 1, 0, 0);
    const normalMap: Texture | null = args.normalMap || null;
    const normalMapUvScale: Vector2 = args.normalMapUvScale || Vector2.one;
    const normalMapUvOffset: Vector2 = args.normalMapUvOffset || Vector2.zero;
    const emissiveColor: Color = args.emissiveColor || Color.black;
    const shadingModelId: ShadingModelIds = args.shadingModelId || ShadingModelIds.Lit;
   
    const baseUniforms: UniformsData = [
        {
            name: UniformNames.DiffuseColor,
            type: UniformTypes.Color,
            value: diffuseColor || Color.white,
        },
        {
            name: UniformNames.DiffuseMap,
            type: UniformTypes.Texture,
            value: diffuseMap || null,
        },
        {
            name: UniformNames.DiffuseMapUvScale,
            type: UniformTypes.Vector2,
            // value: Vector2.one,
            value: diffuseMapUvScale || Vector2.one,
        },
        {
            name: UniformNames.DiffuseMapUvOffset,
            type: UniformTypes.Vector2,
            // value: Vector2.one,
            value: diffuseMapUvOffset || Vector2.one,
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
            name: UniformNames.NormalMapUvScale,
            type: UniformTypes.Vector2,
            value: normalMapUvScale,
        },
        {
            name: UniformNames.NormalMapUvOffset,
            type: UniformTypes.Vector2,
            value: normalMapUvOffset,
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
            name: 'uDiffuseMap',
            type: UniformTypes.Texture,
            value: diffuseMap,
        },
        {
            name: 'uDiffuseMapUvScale',
            type: UniformTypes.Vector2,
            value: diffuseMapUvScale,
        },
        {
            name: 'uDiffuseMapUvOffset',
            type: UniformTypes.Vector2,
            value: diffuseMapUvOffset,
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
        diffuseMapUvScale,
        diffuseMapUvOffset,
        metallic,
        metallicMap,
        metallicMapTiling,
        roughness,
        roughnessMap,
        roughnessMapTiling,
        normalMap,
        normalMapUvScale,
        normalMapUvOffset,
        emissiveColor,
        vertexShaderModifier,
    }
}
