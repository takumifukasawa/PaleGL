// import {
//     DEPTH_FUNC_TYPE_EQUAL,
//     MATERIAL_TYPE_UNLIT,
//     SHADING_MODEL_ID_UNLIT,
//     UNIFORM_BLOCK_NAME_COMMON,
//     UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
//     UNIFORM_BLOCK_NAME_CAMERA,
//     UNIFORM_NAME_BASE_COLOR,
//     UNIFORM_NAME_BASE_MAP,
//     UNIFORM_NAME_BASE_MAP_TILING,
//     UNIFORM_NAME_SHADING_MODEL_ID,
//     UNIFORM_TYPE_TEXTURE,
//     UNIFORM_TYPE_VECTOR4,
//     UNIFORM_TYPE_INT,
//     UNIFORM_TYPE_COLOR,
//     VertexShaderModifiers,
//     UNIFORM_TYPE_VECTOR2_ARRAY,
//     UNIFORM_NAME_DEPTH_TEXTURE,
//     BlendType,
//     FragmentShaderModifiers,
// } from '@/PaleGL/constants';
// import { Texture } from '@/PaleGL/core/texture.ts';
// import { createMaterial, Material, MaterialArgs } from '@/PaleGL/materials/material.ts';
// import { Color, createColorWhite } from '@/PaleGL/math/color.ts';
// 
// import { UniformsData } from '@/PaleGL/core/uniforms.ts';
// import { createVector4, Vector4 } from '@/PaleGL/math/vector4.ts';
// import gBufferDepthFrag from '@/PaleGL/shaders/gbuffer-depth-fragment.glsl';
// import gBufferVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
// import unlitFrag from '@/PaleGL/shaders/unlit-fragment.glsl';
// import { createVector2, Vector2 } from '@/PaleGL/math/vector2.ts';
// import { Gpu } from '@/PaleGL/core/gpu.ts';
// import { Vector3 } from '@/PaleGL/math/vector3.ts';
// 
// export type TransparentMaterialArgs = {
//     // baseMap?: Texture;
//     // baseMapTiling?: Vector4;
//     // baseColor?: Color;
//     // uniforms?: UniformsData;
//     gpu: Gpu;
//     vertexShader: string;
//     fragmentShader: string;
//     blendType?: BlendType;
// } & MaterialArgs;
// 
// export type TranslparentMaterial = Material;
// 
// 
// export const createTransparentMaterial = (args: TransparentMaterialArgs = {}): UnlitMaterial => {
//     const {
//         baseMap,
//         baseMapTiling, // vec4
//         baseColor,
//         // TODO: 外部化
//         vertexShaderModifiers = [],
//         uniforms = [],
//         uniformBlockNames = [],
//         ...options
//     } = args;
// 
//     const baseUniforms: UniformsData = [
//         [UNIFORM_NAME_BASE_MAP, UNIFORM_TYPE_TEXTURE, baseMap || null],
//         [UNIFORM_NAME_BASE_MAP_TILING, UNIFORM_TYPE_VECTOR4, baseMapTiling || createVector4(1, 1, 0, 0)],
//         [UNIFORM_NAME_BASE_COLOR, UNIFORM_TYPE_COLOR, baseColor || createColorWhite()],
//         [UNIFORM_NAME_SHADING_MODEL_ID, UNIFORM_TYPE_INT, SHADING_MODEL_ID_UNLIT],
//     ];
// 
//     const mergedUniforms: UniformsData = [...baseUniforms, ...uniforms];
// 
//     const depthUniforms: UniformsData = [
//         [UNIFORM_NAME_BASE_MAP, UNIFORM_TYPE_TEXTURE, baseMap || null],
//         [UNIFORM_NAME_BASE_MAP_TILING, UNIFORM_TYPE_VECTOR4, baseMapTiling || createVector4(1, 1, 0, 0)],
//         [UNIFORM_NAME_BASE_COLOR, UNIFORM_TYPE_COLOR, baseColor || createColorWhite()],
//         ...uniforms,
//     ];
//     
//     const material = createMaterial({
//         name: 'UnlitMaterial',
//         type: MATERIAL_TYPE_UNLIT,
//         vertexShaderModifiers,
//         vertexShader: gBufferVert,
//         fragmentShader: unlitFrag,
//         depthFragmentShader: gBufferDepthFrag,
//         uniforms: mergedUniforms,
//         depthUniforms,
//         useNormalMap: false,
//         depthTest: true,
//         depthWrite: false, // TODO: これはGBufferの場合. unlitはtransparentの場合も対処すべき??
//         depthFuncType: DEPTH_FUNC_TYPE_EQUAL, // NOTE: これはGBufferの場合
//         ...options, // overrides
//         uniformBlockNames: [
//             UNIFORM_BLOCK_NAME_COMMON,
//             UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
//             UNIFORM_BLOCK_NAME_CAMERA,
//             ...(uniformBlockNames ?? []), // merge
//         ],
//     });
// 
// 
//     const material = createMaterial({
//         // gpu,
//         vertexShader,
//         fragmentShader,
//         uniforms: [
//             ['uParticleMap', UNIFORM_TYPE_TEXTURE, particleMap],
//             ['uBillboardPositionConverters', UNIFORM_TYPE_VECTOR2_ARRAY, [
//                 // prettier-ignore
//                 createVector2(-1, 1),
//                 createVector2(-1, -1),
//                 createVector2(1, 1),
//                 createVector2(1, -1),
//             ]],
//             [UNIFORM_NAME_DEPTH_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
//         ],
//         uniformBlockNames: [UNIFORM_BLOCK_NAME_COMMON, UNIFORM_BLOCK_NAME_CAMERA],
//         // blendType: BlendTypes.Additive
//         vertexShaderModifiers,
//         fragmentShaderModifiers,
//         blendType,
//         depthWrite: false,
//     });
// 
//     return {
//         ...material,
//     };
// }
