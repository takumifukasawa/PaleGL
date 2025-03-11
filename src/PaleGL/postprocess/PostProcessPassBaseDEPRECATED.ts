// import { createRenderTarget, RenderTarget, setRenderTargetSize } from '@/PaleGL/core/renderTarget.ts';
// import {
//     createMaterial,
//     isCompiledMaterialShader,
//     Material,
//     setMaterialUniformValue, startMaterial
// } from '@/PaleGL/materials/material.ts';
// import {
//     checkNeedsBindUniformBufferObjectToMaterial,
//     LightActors,
//     Renderer,
//     renderMesh, setRendererRenderTarget
// } from '@/PaleGL/core/renderer.ts';
// import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
// import { Gpu } from '@/PaleGL/core/gpu.ts';
// import { GBufferRenderTargets } from '@/PaleGL/core/gBufferRenderTargets.ts';
// import {
//     PostProcessPassType,
//     PrimitiveTypes,
//     RenderTargetType,
//     RenderTargetTypes,
//     TextureFilterType,
//     TextureFilterTypes,
//     TextureWrapType,
//     TextureWrapTypes,
//     UniformBlockName,
//     // UniformBlockNames,
//     UniformNames,
//     UniformTypes,
// } from '@/PaleGL/constants.ts';
// import {createMesh, Mesh} from '@/PaleGL/actors/meshes/mesh.ts';
// import { createPlaneGeometry, PlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
// import postProcessPassVertexShader from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';
// import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass.ts';
// // import { Vector3 } from '@/PaleGL/math/Vector3.ts';
// // import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
// // import { Light } from '@/PaleGL/actors/light.ts';
// import { UniformsData } from '@/PaleGL/core/uniforms.ts';
// import {updateActorTransform} from "@/PaleGL/actors/actorBehaviours.ts";
// import { getGeometryAttributeDescriptors } from '@/PaleGL/geometries/geometryBehaviours.ts';
// 
// 
// export type PostProcessPassParametersTemplate = {
//     enabled: boolean;
// };
// 
// // export type PostProcessPassParametersBase = PostProcessPassParametersTemplate & IPostProcessPassParameters<PostProcessPassParametersBase>;
// export type PostProcessPassParametersBase = PostProcessPassParametersTemplate;
// 
// // export interface IPostProcessPassParameters<T extends PostProcessPassParametersBase> {
// //     update?: (parameter: T) => T;
// //     updateKey?: (key: keyof T, value: T[keyof T]) => T;
// // }
// 
// export type PostProcessPassParametersBaseArgs = {
//     enabled?: boolean;
// };
// 
// export type PostProcessPassRenderArgs = {
//     gpu: Gpu;
//     camera: Camera;
//     renderer: Renderer;
//     prevRenderTarget: RenderTarget | null;
//     isLastPass: boolean;
//     gBufferRenderTargets?: GBufferRenderTargets | null;
//     targetCamera: Camera;
//     time: number;
//     lightActors?: LightActors;
// };
