// import { PostProcessPassType, UniformTypes } from '@/PaleGL/constants';
// import {
//     PostProcessPassBase,
//     PostProcessPassParametersBase,
//     PostProcessPassRenderArgs,
// } from '@/PaleGL/postprocess/PostProcessPassBase';
// import { Matrix4 } from '@/PaleGL/math/Matrix4';
// import {GPU, setGPUViewport} from '@/PaleGL/core/GPU.ts';
// import { Vector2 } from '@/PaleGL/math/Vector2.ts';
// import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass.ts';
// import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass.ts';
// import { Renderer } from '@/PaleGL/core/renderer.ts';
// import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
// import { addMaterialUniformValue, Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
// import bufferVisualizerRow0PassFragmentShader from '@/PaleGL/shaders/buffer-visualizer-row-0-pass-fragment.glsl';
// import bufferVisualizerRowBasePassFragmentShader from '@/PaleGL/shaders/buffer-visualizer-row-base-pass-fragment.glsl';
// import bufferVisualizerCompositePassFragmentShader from '@/PaleGL/shaders/buffer-visualizer-composite-pass-fragment.glsl';
// import { createPlaneGeometry, PlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
// import { maton } from '@/PaleGL/utilities/maton.ts';
// 
// // ------------------------------------------------------------------------------
// // constants
// // ------------------------------------------------------------------------------
// 
// const COL_NUM = 7;
// const ROW_NUM = 7;
// 
// const DEPTH_TEXTURE_KEY = 'depthTexture';
// const GBUFFER_A_TEXTURE_KEY = 'gBufferATexture';
// const GBUFFER_B_TEXTURE_KEY = 'gBufferBTexture';
// const GBUFFER_C_TEXTURE_KEY = 'gBufferCTexture';
// const GBUFFER_D_TEXTURE_KEY = 'gBufferDTexture';
// const DIRECTIONAL_LIGHT_SHADOW_MAP_KEY = 'directionalLightShadowMap';
// const SPOT_LIGHT_SHADOW_MAP_KEY = 'spotLightShadowMap';
// const SCREEN_SPACE_SHADOW_TEXTURE_KEY = 'screenSpaceShadowTexture';
// const AMBIENT_OCCLUSION_TEXTURE_KEY = 'ambientOcclusionTexture';
// const DEFERRED_SHADING_TEXTURE_KEY = 'deferredShadingTexture';
// const SSR_TEXTURE_KEY = 'ssrTexture';
// const LIGHT_SHAFT_TEXTURE_KEY = 'lightShaftTexture';
// const VOLUMETRIC_LIGHT_TEXTURE_KEY = 'volumetricLightTexture';
// const FOG_TEXTURE_KEY = 'fogTexture';
// const DEPTH_OF_FIELD_TEXTURE_KEY = 'depthOfFieldTexture';
// const BLOOM_BLUR_MIP4_TEXTURE_KEY = 'bloomBlurMip4Texture';
// const BLOOM_BLUR_MIP8_TEXTURE_KEY = 'bloomBlurMip8Texture';
// const BLOOM_BLUR_MIP16_TEXTURE_KEY = 'bloomBlurMip16Texture';
// const BLOOM_BLUR_MIP32_TEXTURE_KEY = 'bloomBlurMip32Texture';
// const BLOOM_BLUR_MIP64_TEXTURE_KEY = 'bloomBlurMip64Texture';
// const BLOOM_TEXTURE_KEY = 'bloomTexture';
// const STREAK_PREFILTER_TEXTURE_KEY = 'streakPrefilterTexture';
// const STREAK_DOWN_SAMPLE_MIP_2_TEXTURE_KEY = 'streakDownSampleMip2Texture';
// const STREAK_DOWN_SAMPLE_MIP_4_TEXTURE_KEY = 'streakDownSampleMip4Texture';
// const STREAK_DOWN_SAMPLE_MIP_8_TEXTURE_KEY = 'streakDownSampleMip8Texture';
// const STREAK_DOWN_SAMPLE_MIP_16_TEXTURE_KEY = 'streakDownSampleMip16Texture';
// const STREAK_DOWN_SAMPLE_MIP_32_TEXTURE_KEY = 'streakDownSampleMip32Texture';
// const STREAK_UP_SAMPLE_0_TEXTURE_KEY = 'streakUpSample0Texture';
// const STREAK_UP_SAMPLE_1_TEXTURE_KEY = 'streakUpSample1Texture';
// const STREAK_UP_SAMPLE_2_TEXTURE_KEY = 'streakUpSample2Texture';
// const STREAK_UP_SAMPLE_3_TEXTURE_KEY = 'streakUpSample3Texture';
// const STREAK_UP_SAMPLE_4_TEXTURE_KEY = 'streakUpSample4Texture';
// const STREAK_TEXTURE_KEY = 'streakTexture';
// 
// // ------------------------------------------------------------------------------
// 
// type RowPass = {
//     pass: FragmentPass;
//     tiles: Map<
//         string,
//         {
//             label?: string;
//             type?: 'Texture' | 'Other';
//             uniformNamePrefix?: string;
//             // uniformName?: string;
//             uniformNameTexture?: string;
//             uniformNameUvOffset?: string;
//         }
//     >;
// };
// 
// type BufferVisualizerPassParametersBase = {
//     fullViewTextureEnabled: boolean;
// };
// 
// type BufferVisualizerPassParameters = PostProcessPassParametersBase & BufferVisualizerPassParametersBase;
// 
// type BufferVisualizerPassParametersArgs = Partial<BufferVisualizerPassParameters>;
// 
// function generateBufferVisualizerPassParameters(
//     args: BufferVisualizerPassParametersArgs = {}
// ): BufferVisualizerPassParameters {
//     return {
//         enabled: args.enabled || false,
//         fullViewTextureEnabled: args.fullViewTextureEnabled || false,
//     };
// }
// 
// export class BufferVisualizerPass implements IPostProcessPass {
//     name: string = 'BufferVisualizerPass';
//     type: PostProcessPassType = PostProcessPassType.BufferVisualizer;
// 
//     dom: HTMLDivElement;
//     rowPasses: RowPass[] = [];
//     compositePass: FragmentPass;
//     // enabled: boolean = true;
//     width: number = 1;
//     height: number = 1;
// 
//     materials: Material[] = [];
// 
//     geometry: PlaneGeometry;
// 
//     parameters: BufferVisualizerPassParameters;
// 
//     // fullViewTextureEnabled: boolean = false;
// 
//     get renderTarget() {
//         return this.compositePass.renderTarget;
//     }
// 
//     constructor({ gpu, parameters }: { gpu: GPU; parameters?: BufferVisualizerPassParametersArgs }) {
//         window.addEventListener('keydown', (e) => {
//             if (e.key === 'b') {
//                 this.toggleR = !this.toggleR;
//             }
//         });
//         window.addEventListener('keydown', (e) => {
//             if (e.key === 'f') {
//                 this.parameters.fullViewTextureEnabled = !this.parameters.fullViewTextureEnabled;
//             }
//         });
// 
//         this.parameters = generateBufferVisualizerPassParameters(parameters);
// 
//         // NOTE: geometryは親から渡して使いまわしてもよい
//         this.geometry = createPlaneGeometry({ gpu });
// 
//         // row 0
//         this.rowPasses.push({
//             pass: new FragmentPass({
//                 gpu,
//                 fragmentShader: bufferVisualizerRow0PassFragmentShader,
//                 uniforms: [
//                     {
//                         name: 'uNearClip',
//                         type: UniformTypes.Float,
//                         value: 0.1,
//                     },
//                     {
//                         name: 'uFarClip',
//                         type: UniformTypes.Float,
//                         value: 1,
//                     },
//                     {
//                         name: 'uInverseViewProjectionMatrix',
//                         type: UniformTypes.Matrix4,
//                         value: Matrix4.identity,
//                     },
//                     // {
//                     //     name: 'uDepthTexture',
//                     //     type: UniformTypes.Texture,
//                     //     value: gpu.dummyTextureBlack,
//                     // },
//                 ],
//             }),
//             tiles: new Map([
//                 [
//                     DEPTH_TEXTURE_KEY,
//                     {
//                         label: 'depth',
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     'worldPosition',
//                     {
//                         type: 'Other',
//                         uniformPrefix: 'uWorldPosition',
//                     },
//                 ],
//                 [
//                     GBUFFER_A_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     GBUFFER_B_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     GBUFFER_C_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     GBUFFER_D_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//             ]),
//         });
//         // row 1
//         this.rowPasses.push({
//             pass: new FragmentPass({
//                 gpu,
//                 fragmentShader: bufferVisualizerRowBasePassFragmentShader,
//                 srcTextureEnabled: false,
//             }),
//             tiles: new Map([
//                 [
//                     DIRECTIONAL_LIGHT_SHADOW_MAP_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
// 
//                 [
//                     `${SPOT_LIGHT_SHADOW_MAP_KEY}0`,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     `${SPOT_LIGHT_SHADOW_MAP_KEY}1`,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     `${SPOT_LIGHT_SHADOW_MAP_KEY}2`,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     `${SPOT_LIGHT_SHADOW_MAP_KEY}3`,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//             ]),
//         });
//         // row 2
//         this.rowPasses.push({
//             pass: new FragmentPass({
//                 gpu,
//                 fragmentShader: bufferVisualizerRowBasePassFragmentShader,
//                 srcTextureEnabled: false,
//             }),
//             tiles: new Map([
//                 [
//                     SCREEN_SPACE_SHADOW_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     AMBIENT_OCCLUSION_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     DEFERRED_SHADING_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     SSR_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                         label: 'combine ssr',
//                     },
//                 ],
//             ]),
//         });
//         // row 3
//         this.rowPasses.push({
//             pass: new FragmentPass({
//                 gpu,
//                 fragmentShader: bufferVisualizerRowBasePassFragmentShader,
//                 srcTextureEnabled: false,
//             }),
//             tiles: new Map([
//                 [
//                     LIGHT_SHAFT_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     VOLUMETRIC_LIGHT_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     FOG_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                         label: 'combine fog',
//                     },
//                 ],
//                 [
//                     DEPTH_OF_FIELD_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                         label: 'dof',
//                     },
//                 ],
//             ]),
//         });
//         // row 4
//         this.rowPasses.push({
//             pass: new FragmentPass({
//                 gpu,
//                 fragmentShader: bufferVisualizerRowBasePassFragmentShader,
//                 srcTextureEnabled: false,
//             }),
//             tiles: new Map([
//                 [
//                     BLOOM_BLUR_MIP4_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                         label: 'bloom blur mip4',
//                     },
//                 ],
//                 [
//                     BLOOM_BLUR_MIP8_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                         label: 'bloom blur mip8',
//                     },
//                 ],
//                 [
//                     BLOOM_BLUR_MIP16_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                         label: 'bloom blur mip16',
//                     },
//                 ],
//                 [
//                     BLOOM_BLUR_MIP32_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                         label: 'bloom blur mip32',
//                     },
//                 ],
//                 [
//                     BLOOM_BLUR_MIP64_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                         label: 'bloom blur mip64',
//                     },
//                 ],
//                 [
//                     BLOOM_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                         label: 'bloom',
//                     },
//                 ],
//             ]),
//         });
//         // row 5
//         this.rowPasses.push({
//             pass: new FragmentPass({
//                 gpu,
//                 fragmentShader: bufferVisualizerRowBasePassFragmentShader,
//                 srcTextureEnabled: false,
//             }),
//             tiles: new Map([
//                 [
//                     STREAK_PREFILTER_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     STREAK_DOWN_SAMPLE_MIP_2_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     STREAK_DOWN_SAMPLE_MIP_4_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     STREAK_DOWN_SAMPLE_MIP_8_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     STREAK_DOWN_SAMPLE_MIP_16_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     STREAK_DOWN_SAMPLE_MIP_32_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//             ]),
//         });
//         // row 6
//         this.rowPasses.push({
//             pass: new FragmentPass({
//                 gpu,
//                 fragmentShader: bufferVisualizerRowBasePassFragmentShader,
//                 srcTextureEnabled: false,
//             }),
//             tiles: new Map([
//                 [
//                     STREAK_UP_SAMPLE_0_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     STREAK_UP_SAMPLE_1_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     STREAK_UP_SAMPLE_2_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     STREAK_UP_SAMPLE_3_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     STREAK_UP_SAMPLE_4_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//                 [
//                     STREAK_TEXTURE_KEY,
//                     {
//                         type: 'Texture',
//                     },
//                 ],
//             ]),
//         });
// 
//         this.compositePass = new FragmentPass({
//             gpu,
//             name: 'BufferVisualizerPass',
//             fragmentShader: bufferVisualizerCompositePassFragmentShader,
//             srcTextureEnabled: false,
//             uniforms: [
//                 {
//                     name: 'uFullViewTexture',
//                     type: UniformTypes.Texture,
//                     value: gpu.dummyTextureBlack,
//                 },
//                 {
//                     name: 'uFullViewTextureEnabled',
//                     type: UniformTypes.Float,
//                     value: 0,
//                 },
//                 ...maton
//                     .range(ROW_NUM)
//                     .map((_, i) => {
//                         return [
//                             {
//                                 name: `uRow${i}Texture`,
//                                 type: UniformTypes.Texture,
//                                 value: gpu.dummyTextureBlack,
//                             },
//                         ];
//                     })
//                     .flat(),
//                 ...PostProcessPassBase.commonUniforms,
//             ],
//         });
// 
//         // initialize materials
//         this.rowPasses.forEach(({ pass }) => this.materials.push(pass.material));
//         this.materials.push(this.compositePass.material);
// 
//         // this.rowPasses.forEach(({ pass, tiles }, rowIndex) => {
//         this.rowPasses.forEach(({ pass, tiles }, i) => {
//             let colIndex = 0;
//             // pass.material.uniforms.addValue('uTiling', UniformTypes.Vector2, new Vector2(COL_NUM, ROW_NUM));
//             addMaterialUniformValue(pass.material, 'uTiling', UniformTypes.Vector2, new Vector2(COL_NUM, 1));
//             for (const [key, tile] of tiles) {
//                 const uniformNamePrefix = tile.uniformNamePrefix || 'uTextureCol';
//                 const uniformNameTexture = `${uniformNamePrefix}${colIndex}`;
//                 const uniformNameUvOffset = `${uniformNameTexture}UvOffset`;
//                 const colOffset = -colIndex;
// 
//                 if (!tile.uniformNamePrefix) {
//                     tiles.get(key)!.uniformNamePrefix = uniformNamePrefix;
//                 }
// 
//                 if (tile.type === 'Texture') {
//                     tiles.get(key)!.uniformNameTexture = uniformNameTexture;
//                 }
//                 tiles.get(key)!.uniformNameUvOffset = uniformNameUvOffset;
// 
//                 if (i === 0) {
//                     addMaterialUniformValue(
//                         pass.material,
//                         uniformNameUvOffset,
//                         UniformTypes.Vector2,
//                         new Vector2(colOffset, 0)
//                     );
//                     if (tile.type === 'Texture') {
//                         addMaterialUniformValue(
//                             pass.material,
//                             uniformNameTexture,
//                             UniformTypes.Texture,
//                             gpu.dummyTextureBlack
//                         );
//                     }
//                 } else {
//                     addMaterialUniformValue(
//                         pass.material,
//                         uniformNameUvOffset,
//                         UniformTypes.Vector2,
//                         new Vector2(colOffset, 0)
//                     );
//                     // console.log('hogehoge', pass, key, uniformNameTexture, UniformTypes.Texture, gpu.dummyTextureBlack);
//                     addMaterialUniformValue(
//                         pass.material,
//                         uniformNameTexture,
//                         UniformTypes.Texture,
//                         gpu.dummyTextureBlack
//                     );
//                 }
// 
//                 colIndex++;
//             }
//         });
// 
//         addMaterialUniformValue(this.compositePass.material, 'uTiling', UniformTypes.Vector2, new Vector2(1, ROW_NUM));
// 
//         const styleHeader = document.createElement('style');
//         styleHeader.textContent = `
// .buffer-visualizer-pass {
//     position: absolute;
//     top: 0;
//     left: 0;
//     width: 100%;
//     height: 100%;
//     pointer-events: none;
//     display: grid;
//     grid-template-rows: repeat(${ROW_NUM}, 1fr);
// }
// .buffer-visualizer-pass.hidden {
//     display: none;
// }
// .buffer-visualizer-pass-tile {
//     display: flex;
//     justify-content: flex-start;
//     align-items: flex-end;
//     font-size: 9px;
//     line-height: 1em;
//     font-weight: bold;
//     text-shadow: 1px 1px #333;
//     padding: 4px;
// }
// 
// .buffer-visualizer-pass-row {
//     // display: flex;
//     display: grid;
//     grid-template-columns: repeat(${COL_NUM}, 1fr);
// }
//         `;
//         document.head.appendChild(styleHeader);
// 
//         this.dom = document.createElement('div');
//         this.dom.classList.add('buffer-visualizer-pass');
//         const frag = document.createDocumentFragment();
// 
//         // for debug
//         // console.log(this.rowPasses);
// 
//         this.rowPasses.forEach(({ tiles }, rowIndex) => {
//             let colIndex = 0;
//             const rowContent = document.createElement('div');
//             rowContent.classList.add('buffer-visualizer-pass-row');
//             for (const [key, tile] of tiles) {
//                 const newLabel = `[${colIndex}, ${rowIndex}] ${tile.label || key}`;
//                 const elem = document.createElement('div');
//                 elem.classList.add('buffer-visualizer-pass-tile');
//                 const p = document.createElement('p');
//                 p.textContent = newLabel;
//                 elem.appendChild(p);
//                 rowContent.appendChild(elem);
//                 colIndex++;
//             }
//             frag.appendChild(rowContent);
//         });
//         this.dom.appendChild(frag);
//         document.body.appendChild(this.dom);
// 
//         this.hideDom();
//     }
// 
//     setSize(width: number, height: number) {
//         this.width = width;
//         this.height = height;
// 
//         this.rowPasses.forEach(({ pass }) => {
//             pass.setSize(this.width, this.height / ROW_NUM);
//         });
//         this.compositePass.setSize(this.width, this.height);
//     }
// 
//     // TODO: 空メソッド書かなくていいようにしたい
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     setRenderTarget(renderer: Renderer, camera: Camera, isLastPass: boolean) {}
// 
//     update() {
//         // if (this.enabled) {
//         //     this.showDom();
//         // } else {
//         //     this.hideDom();
//         // }
//     }
// 
//     showDom() {
//         this.dom.classList.remove('hidden');
//     }
// 
//     hideDom() {
//         this.dom.classList.add('hidden');
//     }
// 
//     render(args: PostProcessPassRenderArgs) {
//         const { gpu, renderer, lightActors } = args;
// 
//         const tmpRealWidth = renderer.realWidth;
//         const tmpRealHeight = renderer.realHeight;
// 
//         // this.geometry.start();
// 
//         this.rowPasses.forEach(({ pass, tiles }) => {
//             if (lightActors?.directionalLight) {
//                 if (tiles.has(DIRECTIONAL_LIGHT_SHADOW_MAP_KEY)) {
//                     setMaterialUniformValue(
//                         pass.material,
//                         tiles.get(DIRECTIONAL_LIGHT_SHADOW_MAP_KEY)!.uniformNameTexture!,
//                         // 'uDirectionalLightShadowMap',
//                         lightActors.directionalLight.shadowMap!.depthTexture
//                     );
//                 }
//             }
//             if (lightActors?.spotLights) {
//                 lightActors.spotLights.forEach((spotLight, i) => {
//                     const key = `${SPOT_LIGHT_SHADOW_MAP_KEY}${i}`;
//                     if (tiles.has(key)) {
//                         if (spotLight.shadowMap) {
//                             setMaterialUniformValue(
//                                 pass.material,
//                                 tiles.get(key)!.uniformNameTexture!,
//                                 spotLight.shadowMap.depthTexture
//                             );
//                         }
//                     }
//                 });
//             }
// 
//             if (tiles.has(DEPTH_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(DEPTH_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.depthPrePassRenderTarget.depthTexture
//                 );
//             }
// 
//             if (tiles.has(GBUFFER_A_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(GBUFFER_A_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.gBufferRenderTargets.gBufferATexture
//                 );
//             }
// 
//             if (tiles.has(GBUFFER_B_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(GBUFFER_B_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.gBufferRenderTargets.gBufferBTexture
//                 );
//             }
// 
//             if (tiles.has(GBUFFER_C_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(GBUFFER_C_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.gBufferRenderTargets.gBufferCTexture
//                 );
//             }
// 
//             if (tiles.has(GBUFFER_D_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(GBUFFER_D_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.gBufferRenderTargets.gBufferDTexture
//                 );
//             }
// 
//             if (tiles.has(SCREEN_SPACE_SHADOW_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(SCREEN_SPACE_SHADOW_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.screenSpaceShadowPass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(AMBIENT_OCCLUSION_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(AMBIENT_OCCLUSION_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.ambientOcclusionPass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(DEFERRED_SHADING_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(DEFERRED_SHADING_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.deferredShadingPass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(SSR_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(SSR_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.ssrPass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(LIGHT_SHAFT_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(LIGHT_SHAFT_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.lightShaftPass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(VOLUMETRIC_LIGHT_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(VOLUMETRIC_LIGHT_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.volumetricLightPass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(DEPTH_OF_FIELD_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(DEPTH_OF_FIELD_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.depthOfFieldPass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(FOG_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(FOG_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.fogPass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(STREAK_PREFILTER_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(STREAK_PREFILTER_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.streakPass.prefilterPass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(STREAK_DOWN_SAMPLE_MIP_2_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(STREAK_DOWN_SAMPLE_MIP_2_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.streakPass.downSamplePasses[0].pass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(STREAK_DOWN_SAMPLE_MIP_4_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(STREAK_DOWN_SAMPLE_MIP_4_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.streakPass.downSamplePasses[1].pass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(STREAK_DOWN_SAMPLE_MIP_8_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(STREAK_DOWN_SAMPLE_MIP_8_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.streakPass.downSamplePasses[2].pass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(STREAK_DOWN_SAMPLE_MIP_16_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(STREAK_DOWN_SAMPLE_MIP_16_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.streakPass.downSamplePasses[3].pass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(STREAK_DOWN_SAMPLE_MIP_32_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(STREAK_DOWN_SAMPLE_MIP_32_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.streakPass.downSamplePasses[4].pass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(STREAK_UP_SAMPLE_0_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(STREAK_UP_SAMPLE_0_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.streakPass.upSamplePasses[0].pass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(STREAK_UP_SAMPLE_1_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(STREAK_UP_SAMPLE_1_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.streakPass.upSamplePasses[1].pass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(STREAK_UP_SAMPLE_2_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(STREAK_UP_SAMPLE_2_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.streakPass.upSamplePasses[2].pass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(STREAK_UP_SAMPLE_3_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(STREAK_UP_SAMPLE_3_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.streakPass.upSamplePasses[3].pass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(STREAK_UP_SAMPLE_4_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(STREAK_UP_SAMPLE_4_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.streakPass.upSamplePasses[4].pass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(STREAK_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(STREAK_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.streakPass.renderTarget.texture
//                 );
//             }
// 
//             if (tiles.has(BLOOM_BLUR_MIP4_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(BLOOM_BLUR_MIP4_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.bloomPass.renderTargetBlurMip4.texture
//                 );
//             }
// 
//             if (tiles.has(BLOOM_BLUR_MIP8_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(BLOOM_BLUR_MIP8_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.bloomPass.renderTargetBlurMip8.texture
//                 );
//             }
// 
//             if (tiles.has(BLOOM_BLUR_MIP16_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(BLOOM_BLUR_MIP16_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.bloomPass.renderTargetBlurMip16.texture
//                 );
//             }
// 
//             if (tiles.has(BLOOM_BLUR_MIP32_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(BLOOM_BLUR_MIP32_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.bloomPass.renderTargetBlurMip32.texture
//                 );
//             }
// 
//             if (tiles.has(BLOOM_BLUR_MIP64_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     tiles.get(BLOOM_BLUR_MIP64_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.bloomPass.renderTargetBlurMip64.texture
//                 );
//             }
// 
//             if (tiles.has(BLOOM_TEXTURE_KEY)) {
//                 setMaterialUniformValue(
//                     pass.material,
//                     // 'uBloomTexture',
//                     tiles.get(BLOOM_TEXTURE_KEY)!.uniformNameTexture!,
//                     renderer.bloomPass.renderTarget.texture
//                 );
//             }
//         });
// 
//         setMaterialUniformValue(
//             this.rowPasses[0].pass.material,
//             'uInverseViewProjectionMatrix',
//             args.targetCamera.inverseViewProjectionMatrix
//         );
// 
//         setGPUViewport(gpu, 0, 0, this.width, this.height / ROW_NUM);
// 
//         this.rowPasses.forEach(({ pass, tiles }, i) => {
//             if (tiles.size > 0) {
//                 pass.render({ ...args, isLastPass: false });
//                 setMaterialUniformValue(
//                     this.compositePass.material,
//                     `uRow${i}Texture`,
//                     pass.renderTarget.texture
//                 );
//             }
//         });
// 
//         setMaterialUniformValue(
//             this.compositePass.material,
//             'uFullViewTexture',
//             // renderer.depthOfFieldPass.renderTarget.read.$getTexture()
//             // renderer.depthOfFieldPass.circleOfConfusionPass.renderTarget.read.$getTexture()
//             this.toggleR
//                 ? renderer.depthOfFieldPass.preFilterPass.renderTarget.texture
//                 : renderer.depthOfFieldPass.circleOfConfusionPass.renderTarget.texture
//             // renderer.depthOfFieldPass.dofBokehPass.renderTarget.read.$getTexture()
//             // renderer.depthOfFieldPass.preFilterPass.renderTarget.read.$getTexture()
//         );
// 
//         setMaterialUniformValue(
//             this.compositePass.material,
//             'uFullViewTextureEnabled',
//             this.parameters.fullViewTextureEnabled ? 1 : 0
//         );
//         // for debug
//         // this.compositePass.material.uniforms.setValue('uFullViewTextureEnabled', 1);
// 
//         setGPUViewport(gpu, 0, 0, tmpRealWidth, tmpRealHeight);
// 
//         this.compositePass.render({ ...args });
// 
//         // for debug
//         // console.log(this.rowPasses)
//     }
// 
//     toggleR: boolean = true;
// }




import { PostProcessPassType, UniformTypes } from '@/PaleGL/constants';
import {
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/PostProcessPassBase';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import {GPU, setGPUViewport} from '@/PaleGL/core/GPU.ts';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import {createFragmentPass, FragmentPass} from '@/PaleGL/postprocess/FragmentPass.ts';
import { addMaterialUniformValue, Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import bufferVisualizerRow0PassFragmentShader from '@/PaleGL/shaders/buffer-visualizer-row-0-pass-fragment.glsl';
import bufferVisualizerRowBasePassFragmentShader from '@/PaleGL/shaders/buffer-visualizer-row-base-pass-fragment.glsl';
import bufferVisualizerCompositePassFragmentShader from '@/PaleGL/shaders/buffer-visualizer-composite-pass-fragment.glsl';
import { createPlaneGeometry  } from '@/PaleGL/geometries/planeGeometry.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import {
    PostProcessPassBase,
    createPostProcessPassBase, getPostProcessCommonUniforms,
} from "@/PaleGL/postprocess/postProcessPassBaseWIP.ts";
import {
    getPostProcessPassRenderTarget,
    renderPostProcessPass,
    setPostProcessPassSize
} from "@/PaleGL/postprocess/postProcessPassBehaviours.ts";

// ------------------------------------------------------------------------------
// constants
// ------------------------------------------------------------------------------

const COL_NUM = 7;
const ROW_NUM = 7;

const DEPTH_TEXTURE_KEY = 'depthTexture';
const GBUFFER_A_TEXTURE_KEY = 'gBufferATexture';
const GBUFFER_B_TEXTURE_KEY = 'gBufferBTexture';
const GBUFFER_C_TEXTURE_KEY = 'gBufferCTexture';
const GBUFFER_D_TEXTURE_KEY = 'gBufferDTexture';
const DIRECTIONAL_LIGHT_SHADOW_MAP_KEY = 'directionalLightShadowMap';
const SPOT_LIGHT_SHADOW_MAP_KEY = 'spotLightShadowMap';
const SCREEN_SPACE_SHADOW_TEXTURE_KEY = 'screenSpaceShadowTexture';
const AMBIENT_OCCLUSION_TEXTURE_KEY = 'ambientOcclusionTexture';
const DEFERRED_SHADING_TEXTURE_KEY = 'deferredShadingTexture';
const SSR_TEXTURE_KEY = 'ssrTexture';
const LIGHT_SHAFT_TEXTURE_KEY = 'lightShaftTexture';
const VOLUMETRIC_LIGHT_TEXTURE_KEY = 'volumetricLightTexture';
const FOG_TEXTURE_KEY = 'fogTexture';
const DEPTH_OF_FIELD_TEXTURE_KEY = 'depthOfFieldTexture';
const BLOOM_BLUR_MIP4_TEXTURE_KEY = 'bloomBlurMip4Texture';
const BLOOM_BLUR_MIP8_TEXTURE_KEY = 'bloomBlurMip8Texture';
const BLOOM_BLUR_MIP16_TEXTURE_KEY = 'bloomBlurMip16Texture';
const BLOOM_BLUR_MIP32_TEXTURE_KEY = 'bloomBlurMip32Texture';
const BLOOM_BLUR_MIP64_TEXTURE_KEY = 'bloomBlurMip64Texture';
const BLOOM_TEXTURE_KEY = 'bloomTexture';
const STREAK_PREFILTER_TEXTURE_KEY = 'streakPrefilterTexture';
const STREAK_DOWN_SAMPLE_MIP_2_TEXTURE_KEY = 'streakDownSampleMip2Texture';
const STREAK_DOWN_SAMPLE_MIP_4_TEXTURE_KEY = 'streakDownSampleMip4Texture';
const STREAK_DOWN_SAMPLE_MIP_8_TEXTURE_KEY = 'streakDownSampleMip8Texture';
const STREAK_DOWN_SAMPLE_MIP_16_TEXTURE_KEY = 'streakDownSampleMip16Texture';
const STREAK_DOWN_SAMPLE_MIP_32_TEXTURE_KEY = 'streakDownSampleMip32Texture';
const STREAK_UP_SAMPLE_0_TEXTURE_KEY = 'streakUpSample0Texture';
const STREAK_UP_SAMPLE_1_TEXTURE_KEY = 'streakUpSample1Texture';
const STREAK_UP_SAMPLE_2_TEXTURE_KEY = 'streakUpSample2Texture';
const STREAK_UP_SAMPLE_3_TEXTURE_KEY = 'streakUpSample3Texture';
const STREAK_UP_SAMPLE_4_TEXTURE_KEY = 'streakUpSample4Texture';
const STREAK_TEXTURE_KEY = 'streakTexture';

// ------------------------------------------------------------------------------

type RowPass = {
    pass: FragmentPass;
    tiles: Map<
        string,
        {
            label?: string;
            type?: 'Texture' | 'Other';
            uniformNamePrefix?: string;
            // uniformName?: string;
            uniformNameTexture?: string;
            uniformNameUvOffset?: string;
        }
    >;
};

type BufferVisualizerPassParametersBase = {
    fullViewTextureEnabled: boolean;
};

type BufferVisualizerPassParameters = PostProcessPassParametersBase & BufferVisualizerPassParametersBase;

type BufferVisualizerPassParametersArgs = Partial<BufferVisualizerPassParameters>;

function generateBufferVisualizerPassParameters(
    args: BufferVisualizerPassParametersArgs = {}
): BufferVisualizerPassParameters {
    return {
        enabled: args.enabled || false,
        fullViewTextureEnabled: args.fullViewTextureEnabled || false,
    };
}

export type BufferVisualizerPass = PostProcessPassBase & {
    dom: HTMLDivElement,
    // parameters: BufferVisualizerPassParameters,
    rowPasses: RowPass[],
    compositePass: FragmentPass,
    toggleR: boolean,
}

export function createBufferVisualizerPass(args: { gpu: GPU; parameters?: BufferVisualizerPassParametersArgs }) : BufferVisualizerPass {
    const { gpu } = args;
    
    const rowPasses: RowPass[] = [];
    const materials: Material[] = [];
    let toggleR = true;

    window.addEventListener('keydown', (e) => {
        if (e.key === 'b') {
            toggleR = !toggleR;
        }
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'f') {
            parameters.fullViewTextureEnabled = !parameters.fullViewTextureEnabled;
        }
    });

    const parameters = generateBufferVisualizerPassParameters(args.parameters);

    // NOTE: geometryは親から渡して使いまわしてもよい
    const geometry = createPlaneGeometry({ gpu });

    // row 0
    rowPasses.push({
        pass: createFragmentPass({
            gpu,
            fragmentShader: bufferVisualizerRow0PassFragmentShader,
            uniforms: [
                {
                    name: 'uNearClip',
                    type: UniformTypes.Float,
                    value: 0.1,
                },
                {
                    name: 'uFarClip',
                    type: UniformTypes.Float,
                    value: 1,
                },
                {
                    name: 'uInverseViewProjectionMatrix',
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
                // {
                //     name: 'uDepthTexture',
                //     type: UniformTypes.Texture,
                //     value: gpu.dummyTextureBlack,
                // },
            ],
        }),
        tiles: new Map([
            [
                DEPTH_TEXTURE_KEY,
                {
                    label: 'depth',
                    type: 'Texture',
                },
            ],
            [
                'worldPosition',
                {
                    type: 'Other',
                    uniformPrefix: 'uWorldPosition',
                },
            ],
            [
                GBUFFER_A_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                GBUFFER_B_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                GBUFFER_C_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                GBUFFER_D_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
        ]),
    });
    // row 1
    rowPasses.push({
        pass: createFragmentPass({
            gpu,
            fragmentShader: bufferVisualizerRowBasePassFragmentShader,
            srcTextureEnabled: false,
        }),
        tiles: new Map([
            [
                DIRECTIONAL_LIGHT_SHADOW_MAP_KEY,
                {
                    type: 'Texture',
                },
            ],

            [
                `${SPOT_LIGHT_SHADOW_MAP_KEY}0`,
                {
                    type: 'Texture',
                },
            ],
            [
                `${SPOT_LIGHT_SHADOW_MAP_KEY}1`,
                {
                    type: 'Texture',
                },
            ],
            [
                `${SPOT_LIGHT_SHADOW_MAP_KEY}2`,
                {
                    type: 'Texture',
                },
            ],
            [
                `${SPOT_LIGHT_SHADOW_MAP_KEY}3`,
                {
                    type: 'Texture',
                },
            ],
        ]),
    });
    // row 2
    rowPasses.push({
        pass: createFragmentPass({
            gpu,
            fragmentShader: bufferVisualizerRowBasePassFragmentShader,
            srcTextureEnabled: false,
        }),
        tiles: new Map([
            [
                SCREEN_SPACE_SHADOW_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                AMBIENT_OCCLUSION_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                DEFERRED_SHADING_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                SSR_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'combine ssr',
                },
            ],
        ]),
    });
    // row 3
    rowPasses.push({
        pass: createFragmentPass({
            gpu,
            fragmentShader: bufferVisualizerRowBasePassFragmentShader,
            srcTextureEnabled: false,
        }),
        tiles: new Map([
            [
                LIGHT_SHAFT_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                VOLUMETRIC_LIGHT_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                FOG_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'combine fog',
                },
            ],
            [
                DEPTH_OF_FIELD_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'dof',
                },
            ],
        ]),
    });
    // row 4
    rowPasses.push({
        pass: createFragmentPass({
            gpu,
            fragmentShader: bufferVisualizerRowBasePassFragmentShader,
            srcTextureEnabled: false,
        }),
        tiles: new Map([
            [
                BLOOM_BLUR_MIP4_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'bloom blur mip4',
                },
            ],
            [
                BLOOM_BLUR_MIP8_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'bloom blur mip8',
                },
            ],
            [
                BLOOM_BLUR_MIP16_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'bloom blur mip16',
                },
            ],
            [
                BLOOM_BLUR_MIP32_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'bloom blur mip32',
                },
            ],
            [
                BLOOM_BLUR_MIP64_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'bloom blur mip64',
                },
            ],
            [
                BLOOM_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'bloom',
                },
            ],
        ]),
    });
    // row 5
    rowPasses.push({
        pass: createFragmentPass({
            gpu,
            fragmentShader: bufferVisualizerRowBasePassFragmentShader,
            srcTextureEnabled: false,
        }),
        tiles: new Map([
            [
                STREAK_PREFILTER_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_DOWN_SAMPLE_MIP_2_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_DOWN_SAMPLE_MIP_4_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_DOWN_SAMPLE_MIP_8_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_DOWN_SAMPLE_MIP_16_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_DOWN_SAMPLE_MIP_32_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
        ]),
    });
    // row 6
    rowPasses.push({
        pass: createFragmentPass({
            gpu,
            fragmentShader: bufferVisualizerRowBasePassFragmentShader,
            srcTextureEnabled: false,
        }),
        tiles: new Map([
            [
                STREAK_UP_SAMPLE_0_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_UP_SAMPLE_1_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_UP_SAMPLE_2_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_UP_SAMPLE_3_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_UP_SAMPLE_4_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
        ]),
    });

    const compositePass = createFragmentPass({
        gpu,
        name: 'BufferVisualizerPass',
        fragmentShader: bufferVisualizerCompositePassFragmentShader,
        srcTextureEnabled: false,
        uniforms: [
            {
                name: 'uFullViewTexture',
                type: UniformTypes.Texture,
                value: gpu.dummyTextureBlack,
            },
            {
                name: 'uFullViewTextureEnabled',
                type: UniformTypes.Float,
                value: 0,
            },
            ...maton
                .range(ROW_NUM)
                .map((_, i) => {
                    return [
                        {
                            name: `uRow${i}Texture`,
                            type: UniformTypes.Texture,
                            value: gpu.dummyTextureBlack,
                        },
                    ];
                })
                .flat(),
            ...getPostProcessCommonUniforms(),
        ],
    });

    // initialize materials
    rowPasses.forEach(({ pass }) => materials.push(pass.material));
    materials.push(compositePass.material);

    // this.rowPasses.forEach(({ pass, tiles }, rowIndex) => {
    rowPasses.forEach(({ pass, tiles }, i) => {
        let colIndex = 0;
        // pass.material.uniforms.addValue('uTiling', UniformTypes.Vector2, new Vector2(COL_NUM, ROW_NUM));
        addMaterialUniformValue(pass.material, 'uTiling', UniformTypes.Vector2, new Vector2(COL_NUM, 1));
        for (const [key, tile] of tiles) {
            const uniformNamePrefix = tile.uniformNamePrefix || 'uTextureCol';
            const uniformNameTexture = `${uniformNamePrefix}${colIndex}`;
            const uniformNameUvOffset = `${uniformNameTexture}UvOffset`;
            const colOffset = -colIndex;

            if (!tile.uniformNamePrefix) {
                tiles.get(key)!.uniformNamePrefix = uniformNamePrefix;
            }

            if (tile.type === 'Texture') {
                tiles.get(key)!.uniformNameTexture = uniformNameTexture;
            }
            tiles.get(key)!.uniformNameUvOffset = uniformNameUvOffset;

            if (i === 0) {
                addMaterialUniformValue(
                    pass.material,
                    uniformNameUvOffset,
                    UniformTypes.Vector2,
                    new Vector2(colOffset, 0)
                );
                if (tile.type === 'Texture') {
                    addMaterialUniformValue(
                        pass.material,
                        uniformNameTexture,
                        UniformTypes.Texture,
                        gpu.dummyTextureBlack
                    );
                }
            } else {
                addMaterialUniformValue(
                    pass.material,
                    uniformNameUvOffset,
                    UniformTypes.Vector2,
                    new Vector2(colOffset, 0)
                );
                // console.log('hogehoge', pass, key, uniformNameTexture, UniformTypes.Texture, gpu.dummyTextureBlack);
                addMaterialUniformValue(
                    pass.material,
                    uniformNameTexture,
                    UniformTypes.Texture,
                    gpu.dummyTextureBlack
                );
            }

            colIndex++;
        }
    });

    addMaterialUniformValue(compositePass.material, 'uTiling', UniformTypes.Vector2, new Vector2(1, ROW_NUM));

    const styleHeader = document.createElement('style');
    styleHeader.textContent = `
.buffer-visualizer-pass {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    display: grid;
    grid-template-rows: repeat(${ROW_NUM}, 1fr);
}
.buffer-visualizer-pass.hidden {
    display: none;
}
.buffer-visualizer-pass-tile {
    display: flex;
    justify-content: flex-start;
    align-items: flex-end;
    font-size: 9px;
    line-height: 1em;
    font-weight: bold;
    text-shadow: 1px 1px #333;
    padding: 4px;
}

.buffer-visualizer-pass-row {
    // display: flex;
    display: grid;
    grid-template-columns: repeat(${COL_NUM}, 1fr);
}
        `;
    document.head.appendChild(styleHeader);

    const dom = document.createElement('div');
    dom.classList.add('buffer-visualizer-pass');
    const frag = document.createDocumentFragment();

    // for debug
    // console.log(this.rowPasses);

    rowPasses.forEach(({ tiles }, rowIndex) => {
        let colIndex = 0;
        const rowContent = document.createElement('div');
        rowContent.classList.add('buffer-visualizer-pass-row');
        for (const [key, tile] of tiles) {
            const newLabel = `[${colIndex}, ${rowIndex}] ${tile.label || key}`;
            const elem = document.createElement('div');
            elem.classList.add('buffer-visualizer-pass-tile');
            const p = document.createElement('p');
            p.textContent = newLabel;
            elem.appendChild(p);
            rowContent.appendChild(elem);
            colIndex++;
        }
        frag.appendChild(rowContent);
    });
    dom.appendChild(frag);
    document.body.appendChild(dom);

    const bufferVisualizerPass: BufferVisualizerPass = {
        ...createPostProcessPassBase({
            name: 'BufferVisualizerPass',
            type: PostProcessPassType.BufferVisualizer,
            parameters,
            geometry,
            materials
        }),
        dom,
        rowPasses,
        compositePass,
        toggleR,
        
    }

    hideBufferVisualizerPassDom(bufferVisualizerPass);
    
    return bufferVisualizerPass;
}

export function setBufferVisualizerPassSize(bufferVisualizerPass: BufferVisualizerPass, width: number, height: number) {
    bufferVisualizerPass.rowPasses.forEach(({ pass }) => {
        setPostProcessPassSize(pass, width, height / ROW_NUM);
    });
    setPostProcessPassSize(bufferVisualizerPass.compositePass, width, height);

    bufferVisualizerPass.width = width;
    bufferVisualizerPass.height = height;
}

export function showBufferVisualizerPassDom(bufferVisualizerPass: BufferVisualizerPass) {
    bufferVisualizerPass.dom.classList.remove('hidden');
}

export function hideBufferVisualizerPassDom(bufferVisualizerPass: BufferVisualizerPass) {
    bufferVisualizerPass.dom.classList.add('hidden');
}

export function updateBufferVisualizerPass(postProcessPass: PostProcessPassBase) {
    const bufferVisualizerPass = postProcessPass as BufferVisualizerPass;
        if (bufferVisualizerPass.enabled) {
            showBufferVisualizerPassDom(bufferVisualizerPass);
        } else {
            hideBufferVisualizerPassDom(bufferVisualizerPass);
        }
     }

export function renderBufferVisualizerPass(bufferVisualizerPass: BufferVisualizerPass, args: PostProcessPassRenderArgs) {
    const { gpu, renderer, lightActors } = args;

    const tmpRealWidth = renderer.realWidth;
    const tmpRealHeight = renderer.realHeight;

    // this.geometry.start();

    bufferVisualizerPass.rowPasses.forEach(({ pass, tiles }) => {
        if (lightActors?.directionalLight) {
            if (tiles.has(DIRECTIONAL_LIGHT_SHADOW_MAP_KEY)) {
                setMaterialUniformValue(
                    pass.material,
                    tiles.get(DIRECTIONAL_LIGHT_SHADOW_MAP_KEY)!.uniformNameTexture!,
                    // 'uDirectionalLightShadowMap',
                    lightActors.directionalLight.shadowMap!.depthTexture
                );
            }
        }
        if (lightActors?.spotLights) {
            lightActors.spotLights.forEach((spotLight, i) => {
                const key = `${SPOT_LIGHT_SHADOW_MAP_KEY}${i}`;
                if (tiles.has(key)) {
                    if (spotLight.shadowMap) {
                        setMaterialUniformValue(
                            pass.material,
                            tiles.get(key)!.uniformNameTexture!,
                            spotLight.shadowMap.depthTexture
                        );
                    }
                }
            });
        }

        if (tiles.has(DEPTH_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(DEPTH_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.depthPrePassRenderTarget.depthTexture
            );
        }

        if (tiles.has(GBUFFER_A_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(GBUFFER_A_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.gBufferRenderTargets.gBufferATexture
            );
        }

        if (tiles.has(GBUFFER_B_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(GBUFFER_B_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.gBufferRenderTargets.gBufferBTexture
            );
        }

        if (tiles.has(GBUFFER_C_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(GBUFFER_C_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.gBufferRenderTargets.gBufferCTexture
            );
        }

        if (tiles.has(GBUFFER_D_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(GBUFFER_D_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.gBufferRenderTargets.gBufferDTexture
            );
        }
        
        if (tiles.has(SCREEN_SPACE_SHADOW_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(SCREEN_SPACE_SHADOW_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.screenSpaceShadowPass.renderTarget.texture
            );
        }

        if (tiles.has(AMBIENT_OCCLUSION_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(AMBIENT_OCCLUSION_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.ambientOcclusionPass.renderTarget.texture
            );
        }

        if (tiles.has(DEFERRED_SHADING_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(DEFERRED_SHADING_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.deferredShadingPass.renderTarget.texture
            );
        }

        if (tiles.has(SSR_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(SSR_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.ssrPass.renderTarget.texture
            );
        }

        if (tiles.has(LIGHT_SHAFT_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(LIGHT_SHAFT_TEXTURE_KEY)!.uniformNameTexture!,
                getPostProcessPassRenderTarget(renderer.lightShaftPass).texture
            );
        }

        if (tiles.has(VOLUMETRIC_LIGHT_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(VOLUMETRIC_LIGHT_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.volumetricLightPass.renderTarget.texture
            );
        }

        if (tiles.has(DEPTH_OF_FIELD_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(DEPTH_OF_FIELD_TEXTURE_KEY)!.uniformNameTexture!,
                getPostProcessPassRenderTarget(renderer.depthOfFieldPass).texture
            );
        }

        if (tiles.has(FOG_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(FOG_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.fogPass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_PREFILTER_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_PREFILTER_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.prefilterPass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_DOWN_SAMPLE_MIP_2_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_DOWN_SAMPLE_MIP_2_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.downSamplePasses[0].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_DOWN_SAMPLE_MIP_4_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_DOWN_SAMPLE_MIP_4_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.downSamplePasses[1].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_DOWN_SAMPLE_MIP_8_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_DOWN_SAMPLE_MIP_8_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.downSamplePasses[2].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_DOWN_SAMPLE_MIP_16_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_DOWN_SAMPLE_MIP_16_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.downSamplePasses[3].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_DOWN_SAMPLE_MIP_32_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_DOWN_SAMPLE_MIP_32_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.downSamplePasses[4].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_UP_SAMPLE_0_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_UP_SAMPLE_0_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.upSamplePasses[0].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_UP_SAMPLE_1_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_UP_SAMPLE_1_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.upSamplePasses[1].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_UP_SAMPLE_2_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_UP_SAMPLE_2_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.upSamplePasses[2].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_UP_SAMPLE_3_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_UP_SAMPLE_3_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.upSamplePasses[3].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_UP_SAMPLE_4_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_UP_SAMPLE_4_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.upSamplePasses[4].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_TEXTURE_KEY)!.uniformNameTexture!,
                getPostProcessPassRenderTarget(renderer.streakPass).texture
            );
        }

        if (tiles.has(BLOOM_BLUR_MIP4_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(BLOOM_BLUR_MIP4_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.bloomPass.renderTargetBlurMip4_Vertical.texture
            );
        }

        if (tiles.has(BLOOM_BLUR_MIP8_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(BLOOM_BLUR_MIP8_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.bloomPass.renderTargetBlurMip8_Vertical.texture
            );
        }

        if (tiles.has(BLOOM_BLUR_MIP16_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(BLOOM_BLUR_MIP16_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.bloomPass.renderTargetBlurMip16_Vertical.texture
            );
        }

        if (tiles.has(BLOOM_BLUR_MIP32_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(BLOOM_BLUR_MIP32_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.bloomPass.renderTargetBlurMip32_Vertical.texture
            );
        }

        if (tiles.has(BLOOM_BLUR_MIP64_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(BLOOM_BLUR_MIP64_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.bloomPass.renderTargetBlurMip64_Vertical.texture
            );
        }

        if (tiles.has(BLOOM_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                // 'uBloomTexture',
                tiles.get(BLOOM_TEXTURE_KEY)!.uniformNameTexture!,
                getPostProcessPassRenderTarget(renderer.bloomPass).texture
            );
        }
    });

    setMaterialUniformValue(
        bufferVisualizerPass.rowPasses[0].pass.material,
        'uInverseViewProjectionMatrix',
        args.targetCamera.inverseViewProjectionMatrix
    );

    setGPUViewport(gpu, 0, 0, bufferVisualizerPass.width, bufferVisualizerPass.height / ROW_NUM);

    bufferVisualizerPass.rowPasses.forEach(({ pass, tiles }, i) => {
        if (tiles.size > 0) {
            renderPostProcessPass(pass, { ...args, isLastPass: false });
            setMaterialUniformValue(
                bufferVisualizerPass.compositePass.material,
                `uRow${i}Texture`,
                pass.renderTarget.texture
            );
        }
    });

    setMaterialUniformValue(
        bufferVisualizerPass.compositePass.material,
        'uFullViewTexture',
        // renderer.depthOfFieldPass.renderTarget.read.$getTexture()
        // renderer.depthOfFieldPass.circleOfConfusionPass.renderTarget.read.$getTexture()
        bufferVisualizerPass.toggleR
            ? renderer.depthOfFieldPass.preFilterPass.renderTarget.texture
            : renderer.depthOfFieldPass.circleOfConfusionPass.renderTarget.texture
        // renderer.depthOfFieldPass.dofBokehPass.renderTarget.read.$getTexture()
        // renderer.depthOfFieldPass.preFilterPass.renderTarget.read.$getTexture()
    );

    setMaterialUniformValue(
        bufferVisualizerPass.compositePass.material,
        'uFullViewTextureEnabled',
        (bufferVisualizerPass.parameters as BufferVisualizerPassParameters).fullViewTextureEnabled ? 1 : 0
    );
    // for debug
    // this.compositePass.material.uniforms.setValue('uFullViewTextureEnabled', 1);

    setGPUViewport(gpu, 0, 0, tmpRealWidth, tmpRealHeight);

    renderPostProcessPass(bufferVisualizerPass.compositePass, { ...args });

    // for debug
    // console.log(this.rowPasses)
}
