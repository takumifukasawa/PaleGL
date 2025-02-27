import {
    ActorTypes,
    BlendTypes,
    LightTypes,
    MAX_POINT_LIGHT_COUNT,
    MAX_SPOT_LIGHT_COUNT,
    PostProcessPassType,
    RenderQueueType,
    RenderTargetTypes,
    TextureDepthPrecisionType,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import { Stats } from '@/PaleGL/utilities/stats.ts';
import { Light } from '@/PaleGL/actors/lights/light.ts';
import { getMeshMaterial, Mesh, updateMeshDepthMaterial, updateMeshMaterial } from '@/PaleGL/actors/mesh.ts';
import { Scene, traverseScene } from '@/PaleGL/core/scene.ts';
import {
    Camera,
    CameraRenderTargetType,
    getCameraForward,
    hasEnabledPostProcessPass,
    isPerspectiveCamera,
} from '@/PaleGL/actors/cameras/camera.ts';
import { Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { PostProcess } from '@/PaleGL/postprocess/PostProcess';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets';
import { OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import { createFullQuadOrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts';
import { Skybox } from '@/PaleGL/actors/skybox.ts';
import { DeferredShadingPass } from '@/PaleGL/postprocess/DeferredShadingPass';
import { SSAOPass } from '@/PaleGL/postprocess/SSAOPass';
import { SSRPass } from '@/PaleGL/postprocess/SSRPass';
import { ToneMappingPass } from '@/PaleGL/postprocess/ToneMappingPass';
import { BloomPass, BloomPassParameters } from '@/PaleGL/postprocess/BloomPass';
import { DepthOfFieldPass } from '@/PaleGL/postprocess/DepthOfFieldPass';
import { LightShaftPass } from '@/PaleGL/postprocess/LightShaftPass.ts';
import { VolumetricLightPass } from '@/PaleGL/postprocess/VolumetricLightPass.ts';
import { FogPass } from '@/PaleGL/postprocess/FogPass.ts';
import { DirectionalLight } from '@/PaleGL/actors/lights/directionalLight.ts';
import { getSpotLightConeCos, getSpotLightPenumbraCos, SpotLight } from '@/PaleGL/actors/lights/spotLight.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { Shader } from '@/PaleGL/core/Shader.ts';
import globalUniformBufferObjectVertexShader from '@/PaleGL/shaders/global-uniform-buffer-object-vertex.glsl';
import globalUniformBufferObjectFragmentShader from '@/PaleGL/shaders/global-uniform-buffer-object-fragment.glsl';
import { UniformBufferObject } from '@/PaleGL/core/UniformBufferObject.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Actor } from '@/PaleGL/actors/actor.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/cameras/perspectiveCamera.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import {
    UniformBufferObjectBlockData,
    UniformBufferObjectElementValueArray,
    UniformBufferObjectElementValueNoNeedsPadding,
    UniformBufferObjectStructArrayValue,
    UniformBufferObjectStructValue,
    UniformBufferObjectValue,
} from '@/PaleGL/core/uniforms.ts';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { ChromaticAberrationPass } from '@/PaleGL/postprocess/ChromaticAberrationPass.ts';
import { VignettePass } from '@/PaleGL/postprocess/VignettePass.ts';
import { StreakPass } from '@/PaleGL/postprocess/StreakPass.ts';
import { FXAAPass } from '@/PaleGL/postprocess/FXAAPass.ts';
import { ScreenSpaceShadowPass } from '@/PaleGL/postprocess/ScreenSpaceShadowPass.ts';
import { PointLight } from '@/PaleGL/actors/lights/pointLight.ts';
import { Texture } from '@/PaleGL/core/Texture.ts';
import { findPostProcessParameter, PostProcessVolume } from '@/PaleGL/actors/postProcessVolume.ts';
import { GlitchPass } from '@/PaleGL/postprocess/GlitchPass.ts';
import { SharedTextures, SharedTexturesTypes } from '@/PaleGL/core/createSharedTextures.ts';
import { replaceShaderIncludes } from '@/PaleGL/core/buildShader.ts';
import { updateActorTransform } from '@/PaleGL/actors/actorBehaviours.ts';

type RenderMeshInfo = { actor: Mesh; materialIndex: number; queue: RenderQueueType };

type RenderMeshInfoEachQueue = {
    [key in RenderQueueType]: RenderMeshInfo[];
};

export type LightActors = {
    directionalLight: DirectionalLight | null;
    spotLights: SpotLight[];
    pointLights: PointLight[];
};

/**
 * TODO: shadow 用のuniform設定も一緒にされちゃうので出し分けたい
 * TODO: 渡す uniform の値、キャッシュできる気がする
 * TODO: directional light がないとき、spot lightがないときの対応
 * @param targetMaterial
 * @param lightActors
 * @param fallbackTexture
 */
export function applyLightShadowMapUniformValues(
    targetMaterial: Material,
    lightActors: LightActors,
    fallbackTexture: Texture
) {
    // directional light
    setMaterialUniformValue(
        targetMaterial,
        UniformNames.DirectionalLightShadowMap,
        lightActors.directionalLight && lightActors.directionalLight.shadowMap
            ? lightActors.directionalLight.shadowMap.read.$getDepthTexture()
            : fallbackTexture
    );

    // spotlights
    const spotLightShadowMaps = maton.range(MAX_SPOT_LIGHT_COUNT).map((i) => {
        const spotLight = lightActors.spotLights[i];
        return spotLight && spotLight.shadowMap ? spotLight.shadowMap.read.$getDepthTexture() : fallbackTexture;
    });
    setMaterialUniformValue(targetMaterial, UniformNames.SpotLightShadowMap, spotLightShadowMaps);
}

/**
 * post process volume の値を各passに適用
 * @param renderer
 * @param postProcessVolumeActor
 */
function applyPostProcessVolumeParameters(renderer: Renderer, postProcessVolumeActor: PostProcessVolume) {
    // bloom
    // renderer.bloomPass.updateParameters(postProcessVolumeActor.findParameter<BloomPassParameters>(PostProcessPassType.Bloom));
    const bloomParameter = findPostProcessParameter<BloomPassParameters>(
        postProcessVolumeActor,
        PostProcessPassType.Bloom
    );
    if (bloomParameter) {
        renderer.bloomPass.updateParameters(bloomParameter);
    }
}

// /**
//  * 描画パイプライン的な役割
//  * TODO: memo pass
//  * - depth pre-pass
//  * - g-buffer pass (color, normal, material info)
//  * - ao pass
//  * - shading pass
//  * - post process pass
//  * TODO:
//  * - depth prepass 使わない場合。offscreen する時とか
//  * - offscreen rendering
//  */
// export class Renderer {
//     _canvas;
//     _pixelRatio;
//     _globalUniformBufferObjects: {
//         uniformBufferObject: UniformBufferObject;
//         data: UniformBufferObjectBlockData;
//     }[] = [];
//
//     _gpu;
//     _realWidth: number = 1;
//     _realHeight: number = 1;
//     _stats: Stats | null = null;
//     _scenePostProcess: PostProcess;
//     _screenQuadCamera: Camera = createFullQuadOrthographicCamera();
//     _depthPrePassRenderTarget: RenderTarget;
//     _gBufferRenderTargets: GBufferRenderTargets;
//     _afterDeferredShadingRenderTarget: RenderTarget;
//     _copyDepthSourceRenderTarget: RenderTarget;
//     _copyDepthDestRenderTarget: RenderTarget;
//     _screenSpaceShadowPass: ScreenSpaceShadowPass;
//     _ambientOcclusionPass: SSAOPass;
//     _deferredShadingPass: DeferredShadingPass;
//     _ssrPass: SSRPass;
//     _lightShaftPass: LightShaftPass;
//     _volumetricLightPass: VolumetricLightPass;
//     _fogPass: FogPass;
//     _depthOfFieldPass: DepthOfFieldPass;
//     _bloomPass: BloomPass;
//     _streakPass: StreakPass;
//     _toneMappingPass: ToneMappingPass;
//     _chromaticAberrationPass: ChromaticAberrationPass;
//     _glitchPass: GlitchPass;
//     _vignettePass: VignettePass;
//     _fxaaPass: FXAAPass;
//
//     get realWidth() {
//         return this._realWidth;
//     }
//
//     get realHeight() {
//         return this._realHeight;
//     }
//
//     get pixelRatio() {
//         return this._pixelRatio;
//     }
//
//     getStats() {
//         return this._stats;
//     }
//
//     setStats(stats: Stats) {
//         this._stats = stats;
//     }
//
//     get globalUniformBufferObjects() {
//         return this._globalUniformBufferObjects;
//     }
//
//     get depthPrePassRenderTarget() {
//         return this._depthPrePassRenderTarget;
//     }
//
//     get gBufferRenderTargets() {
//         return this._gBufferRenderTargets;
//     }
//
//     get screenSpaceShadowPass() {
//         return this._screenSpaceShadowPass;
//     }
//
//     get ambientOcclusionPass() {
//         return this._ambientOcclusionPass;
//     }
//
//     get ssrPass() {
//         return this._ssrPass;
//     }
//
//     get deferredShadingPass() {
//         return this._deferredShadingPass;
//     }
//
//     get lightShaftPass() {
//         return this._lightShaftPass;
//     }
//
//     get lightShaftPassTexture() {
//         // dummy
//         return this._gpu.dummyTextureBlack;
//     }
//
//     get volumetricLightPass() {
//         return this._volumetricLightPass;
//     }
//
//     get fogPass() {
//         return this._fogPass;
//     }
//
//     get depthOfFieldPass() {
//         return this._depthOfFieldPass;
//     }
//
//     get bloomPass() {
//         return this._bloomPass;
//     }
//
//     get streakPass() {
//         return this._streakPass;
//     }
//
//     get chromaticAberrationPass() {
//         return this._chromaticAberrationPass;
//     }
//
//     get glitchPass() {
//         return this._glitchPass;
//     }
//
//     get vignettePass() {
//         return this._vignettePass;
//     }
//
//     get fxaaPass() {
//         return this._fxaaPass;
//     }
//
//     /**
//      *
//      * @param gpu
//      * @param canvas
//      * @param pixelRatio
//      */
//     constructor({ gpu, canvas, pixelRatio = 1.5 }: { gpu: GPU; canvas: HTMLCanvasElement; pixelRatio: number }) {
//         this._gpu = gpu;
//         this._canvas = canvas;
//         this._pixelRatio = pixelRatio;
//         this._scenePostProcess = new PostProcess(this._screenQuadCamera);
//         this._depthPrePassRenderTarget = new RenderTarget({
//             gpu,
//             type: RenderTargetTypes.Depth,
//             width: 1,
//             height: 1,
//             name: 'depth pre-pass render target',
//             depthPrecision: TextureDepthPrecisionType.High, // 低精度だとマッハバンドのような見た目になるので高精度にしておく
//         });
//         this._gBufferRenderTargets = new GBufferRenderTargets({
//             gpu,
//             width: 1,
//             height: 1,
//             name: 'g-buffer render target',
//         });
//         this._afterDeferredShadingRenderTarget = new RenderTarget({
//             gpu,
//             type: RenderTargetTypes.Empty,
//             width: 1,
//             height: 1,
//             name: 'after g-buffer render target',
//         });
//         // console.log(this._afterDeferredShadingRenderTarget)
//         this._copyDepthSourceRenderTarget = new RenderTarget({
//             gpu,
//             type: RenderTargetTypes.Empty,
//             width: 1,
//             height: 1,
//             name: 'copy depth source render target',
//             depthPrecision: TextureDepthPrecisionType.High, // 低精度だとマッハバンドのような見た目になるので高精度にしておく
//         });
//         this._copyDepthDestRenderTarget = new RenderTarget({
//             gpu,
//             type: RenderTargetTypes.Depth,
//             width: 1,
//             height: 1,
//             name: 'copy depth dest render target',
//             depthPrecision: TextureDepthPrecisionType.High, // 低精度だとマッハバンドのような見た目になるので高精度にしておく
//         });
//
//         this._screenSpaceShadowPass = new ScreenSpaceShadowPass({ gpu });
//         this._ambientOcclusionPass = new SSAOPass({ gpu });
//         this._deferredShadingPass = new DeferredShadingPass({ gpu });
//         this._ssrPass = new SSRPass({ gpu });
//         this._lightShaftPass = new LightShaftPass({ gpu });
//         this._volumetricLightPass = new VolumetricLightPass({ gpu });
//         this._fogPass = new FogPass({ gpu });
//
//         this._fxaaPass = new FXAAPass({ gpu });
//         this._scenePostProcess.addPass(this._fxaaPass);
//
//         this._depthOfFieldPass = new DepthOfFieldPass({ gpu });
//         this._scenePostProcess.addPass(this._depthOfFieldPass);
//
//         this._bloomPass = new BloomPass({
//             gpu,
//         });
//         this._scenePostProcess.addPass(this._bloomPass);
//
//         this._streakPass = new StreakPass({ gpu });
//         this._scenePostProcess.addPass(this._streakPass);
//
//         this._toneMappingPass = new ToneMappingPass({ gpu });
//         this._scenePostProcess.addPass(this._toneMappingPass);
//
//         this._vignettePass = new VignettePass({ gpu });
//         this._scenePostProcess.addPass(this._vignettePass);
//
//         this._chromaticAberrationPass = new ChromaticAberrationPass({ gpu });
//         this._scenePostProcess.addPass(this._chromaticAberrationPass);
//
//         this._glitchPass = new GlitchPass({ gpu });
//         this._scenePostProcess.addPass(this._glitchPass);
//
//         //
//         // initialize global uniform buffer objects
//         //
//
//         const uniformBufferObjectShader = new Shader({
//             gpu,
//             vertexShader: replaceShaderIncludes(globalUniformBufferObjectVertexShader),
//             fragmentShader: replaceShaderIncludes(globalUniformBufferObjectFragmentShader),
//         });
//
//         const transformationsUniformBlockData = [
//             {
//                 name: UniformNames.WorldMatrix,
//                 type: UniformTypes.Matrix4,
//                 value: Matrix4.identity,
//             },
//             {
//                 name: UniformNames.ViewMatrix,
//                 type: UniformTypes.Matrix4,
//                 value: Matrix4.identity,
//             },
//             {
//                 name: UniformNames.ProjectionMatrix,
//                 type: UniformTypes.Matrix4,
//                 value: Matrix4.identity,
//             },
//             {
//                 name: UniformNames.NormalMatrix,
//                 type: UniformTypes.Matrix4,
//                 value: Matrix4.identity,
//             },
//             {
//                 name: UniformNames.InverseWorldMatrix,
//                 type: UniformTypes.Matrix4,
//                 value: Matrix4.identity,
//             },
//             {
//                 name: UniformNames.ViewProjectionMatrix,
//                 type: UniformTypes.Matrix4,
//                 value: Matrix4.identity,
//             },
//             {
//                 name: UniformNames.InverseViewMatrix,
//                 type: UniformTypes.Matrix4,
//                 value: Matrix4.identity,
//             },
//             {
//                 name: UniformNames.InverseProjectionMatrix,
//                 type: UniformTypes.Matrix4,
//                 value: Matrix4.identity,
//             },
//             {
//                 name: UniformNames.InverseViewProjectionMatrix,
//                 type: UniformTypes.Matrix4,
//                 value: Matrix4.identity,
//             },
//             {
//                 name: UniformNames.TransposeInverseViewMatrix,
//                 type: UniformTypes.Matrix4,
//                 value: Matrix4.identity,
//             },
//         ];
//         this._globalUniformBufferObjects.push({
//             uniformBufferObject: this._gpu.createUniformBufferObject(
//                 uniformBufferObjectShader,
//                 UniformBlockNames.Transformations,
//                 transformationsUniformBlockData
//             ),
//             data: transformationsUniformBlockData,
//         });
//
//         const cameraUniformBufferData = [
//             {
//                 name: UniformNames.ViewPosition,
//                 type: UniformTypes.Vector3,
//                 value: Vector3.zero,
//             },
//             {
//                 name: UniformNames.ViewDirection,
//                 type: UniformTypes.Vector3,
//                 value: Vector3.zero,
//             },
//             {
//                 name: UniformNames.CameraNear,
//                 type: UniformTypes.Float,
//                 value: 0,
//             },
//             {
//                 name: UniformNames.CameraFar,
//                 type: UniformTypes.Float,
//                 value: 0,
//             },
//             {
//                 name: UniformNames.CameraAspect,
//                 type: UniformTypes.Float,
//                 value: 0,
//             },
//             {
//                 name: UniformNames.CameraFov,
//                 type: UniformTypes.Float,
//                 value: 0,
//             },
//         ];
//         this._globalUniformBufferObjects.push({
//             uniformBufferObject: this._gpu.createUniformBufferObject(
//                 uniformBufferObjectShader,
//                 UniformBlockNames.Camera,
//                 cameraUniformBufferData
//             ),
//             data: cameraUniformBufferData,
//         });
//
//         const directionalLightUniformBufferData = [
//             {
//                 name: UniformNames.DirectionalLight,
//                 type: UniformTypes.Struct,
//                 value: [
//                     {
//                         name: UniformNames.LightDirection,
//                         type: UniformTypes.Vector3,
//                         value: Vector3.zero,
//                     },
//                     {
//                         name: UniformNames.LightIntensity,
//                         type: UniformTypes.Float,
//                         value: 0,
//                     },
//                     {
//                         name: UniformNames.LightColor,
//                         type: UniformTypes.Color,
//                         value: Color.black,
//                     },
//                     {
//                         name: UniformNames.ShadowMapProjectionMatrix,
//                         type: UniformTypes.Matrix4,
//                         value: Matrix4.identity,
//                     },
//                 ],
//             },
//         ];
//         this._globalUniformBufferObjects.push({
//             uniformBufferObject: this._gpu.createUniformBufferObject(
//                 uniformBufferObjectShader,
//                 UniformBlockNames.DirectionalLight,
//                 directionalLightUniformBufferData
//             ),
//             data: directionalLightUniformBufferData,
//         });
//
//         const spotLightUniformBufferData = [
//             {
//                 name: UniformNames.SpotLight,
//                 type: UniformTypes.StructArray,
//                 value: maton.range(MAX_SPOT_LIGHT_COUNT).map(() => [
//                     {
//                         name: UniformNames.LightColor,
//                         type: UniformTypes.Color,
//                         value: Color.black,
//                     },
//                     {
//                         name: UniformNames.LightPosition,
//                         type: UniformTypes.Vector3,
//                         value: Vector3.zero,
//                     },
//                     {
//                         name: UniformNames.LightDirection,
//                         type: UniformTypes.Vector3,
//                         value: Vector3.zero,
//                     },
//                     {
//                         name: UniformNames.LightIntensity,
//                         type: UniformTypes.Float,
//                         value: 0,
//                     },
//                     {
//                         name: UniformNames.LightDistance,
//                         type: UniformTypes.Float,
//                         value: 0,
//                     },
//                     {
//                         name: UniformNames.LightAttenuation,
//                         type: UniformTypes.Float,
//                         value: 0,
//                     },
//                     {
//                         name: UniformNames.LightConeCos,
//                         type: UniformTypes.Float,
//                         value: 0,
//                     },
//                     {
//                         name: UniformNames.LightPenumbraCos,
//                         type: UniformTypes.Float,
//                         value: 0,
//                     },
//                     {
//                         name: UniformNames.ShadowMapProjectionMatrix,
//                         type: UniformTypes.Matrix4,
//                         value: Matrix4.identity,
//                     },
//                 ]),
//             },
//         ];
//         this._globalUniformBufferObjects.push({
//             uniformBufferObject: this._gpu.createUniformBufferObject(
//                 uniformBufferObjectShader,
//                 UniformBlockNames.SpotLight,
//                 spotLightUniformBufferData
//             ),
//             data: spotLightUniformBufferData,
//         });
//
//         const pointLightUniformBufferData = [
//             {
//                 name: UniformNames.PointLight,
//                 type: UniformTypes.StructArray,
//                 value: maton.range(MAX_POINT_LIGHT_COUNT).map(() => [
//                     {
//                         name: UniformNames.LightColor,
//                         type: UniformTypes.Color,
//                         value: Color.black,
//                     },
//                     {
//                         name: UniformNames.LightPosition,
//                         type: UniformTypes.Vector3,
//                         value: Vector3.zero,
//                     },
//                     {
//                         name: UniformNames.LightIntensity,
//                         type: UniformTypes.Float,
//                         value: 0,
//                     },
//                     {
//                         name: UniformNames.LightDistance,
//                         type: UniformTypes.Float,
//                         value: 0,
//                     },
//                     {
//                         name: UniformNames.LightAttenuation,
//                         type: UniformTypes.Float,
//                         value: 0,
//                     },
//                 ]),
//             },
//         ];
//         this._globalUniformBufferObjects.push({
//             uniformBufferObject: this._gpu.createUniformBufferObject(
//                 uniformBufferObjectShader,
//                 UniformBlockNames.PointLight,
//                 pointLightUniformBufferData
//             ),
//             data: pointLightUniformBufferData,
//         });
//
//         const timelineUniformBufferData = [
//             {
//                 name: UniformNames.TimelineTime,
//                 type: UniformTypes.Float,
//                 value: 0,
//             },
//             {
//                 name: UniformNames.TimelineDeltaTime,
//                 type: UniformTypes.Float,
//                 value: 0,
//             },
//         ];
//         this._globalUniformBufferObjects.push({
//             uniformBufferObject: this._gpu.createUniformBufferObject(
//                 uniformBufferObjectShader,
//                 UniformBlockNames.Timeline,
//                 timelineUniformBufferData
//             ),
//             data: timelineUniformBufferData,
//         });
//
//         const commonUniformBlockData = [
//             {
//                 name: UniformNames.Time,
//                 type: UniformTypes.Float,
//                 value: 0,
//             },
//             {
//                 name: UniformNames.DeltaTime,
//                 type: UniformTypes.Float,
//                 value: 0,
//             },
//             {
//                 name: UniformNames.Viewport,
//                 type: UniformTypes.Vector4,
//                 value: Vector4.zero,
//             },
//         ];
//         // TODO: 一番最初の要素としてpushするとなぜかエラーになる
//         this._globalUniformBufferObjects.push({
//             uniformBufferObject: this._gpu.createUniformBufferObject(
//                 uniformBufferObjectShader,
//                 UniformBlockNames.Common,
//                 commonUniformBlockData
//             ),
//             data: commonUniformBlockData,
//         });
//
//         // for debug
//         console.log('===== global uniform buffer objects =====');
//         console.log(this._globalUniformBufferObjects);
//         console.log('=========================================');
//     }
//
//     // TODO: materialのstartの中でやりたい
//     $checkNeedsBindUniformBufferObjectToMaterial(material: Material) {
//         // mesh.materials.forEach((material) => {
//         if (material.getBoundUniformBufferObjects()) {
//             return;
//         }
//         material.setBoundUniformBufferObjects(true);
//         // for debug
//         // console.log("[Renderer.$checkNeedsBindUniformBufferObjectToMaterial]", material.name)
//         material.getUniformBlockNames().forEach((blockName) => {
//             const targetGlobalUniformBufferObject = this._globalUniformBufferObjects.find(
//                 ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
//             );
//             if (!targetGlobalUniformBufferObject) {
//                 return;
//             }
//             const blockIndex = this._gpu.bindUniformBlockAndGetBlockIndex(
//                 targetGlobalUniformBufferObject.uniformBufferObject,
//                 material.getShader()!,
//                 blockName
//             );
//             // for debug
//             // console.log(
//             //     material.name,
//             //     'addUniformBlock',
//             //     material.uniformBlockNames,
//             //     targetUniformBufferObject.blockName,
//             //     blockIndex
//             // );
//             material.getUniforms().addUniformBlock(blockIndex, targetGlobalUniformBufferObject.uniformBufferObject, []);
//         });
//         // });
//     }
//
//     /**
//      *
//      * @param realWidth
//      * @param realHeight
//      */
//     setSize(realWidth: number, realHeight: number) {
//         const w = Math.floor(realWidth);
//         const h = Math.floor(realHeight);
//         this._realWidth = w;
//         this._realHeight = h;
//         this._canvas.width = w;
//         this._canvas.height = h;
//
//         this._gpu.setSize(0, 0, w, h);
//
//         // render targets
//         this._depthPrePassRenderTarget.setSize(w, h);
//         this._gBufferRenderTargets.setSize(w, h);
//         this._afterDeferredShadingRenderTarget.setSize(w, h);
//         this._copyDepthSourceRenderTarget.setSize(w, h);
//         this._copyDepthDestRenderTarget.setSize(w, h);
//         // passes
//         this._screenSpaceShadowPass.setSize(w, h);
//         this._ambientOcclusionPass.setSize(w, h);
//         this._deferredShadingPass.setSize(w, h);
//         this._ssrPass.setSize(w, h);
//         this._lightShaftPass.setSize(w, h);
//         this._volumetricLightPass.setSize(w, h);
//         this._fogPass.setSize(w, h);
//         this._depthOfFieldPass.setSize(w, h);
//         this._bloomPass.setSize(w, h);
//         this._streakPass.setSize(w, h);
//         this._toneMappingPass.setSize(w, h);
//         this._chromaticAberrationPass.setSize(w, h);
//         this._glitchPass.setSize(w, h);
//         this._vignettePass.setSize(w, h);
//         this._fxaaPass.setSize(w, h);
//     }
//
//     renderTarget: CameraRenderTargetType | null = null;
//     clearColorDirtyFlag = false;
//
//     /**
//      *
//      * @param renderTarget
//      * @param clearColor
//      * @param clearDepth
//      */
//     // TODO: 本当はclearcolorの色も渡せるとよい
//     setRenderTarget(renderTarget: CameraRenderTargetType, clearColor: boolean = false, clearDepth: boolean = false) {
//         if (renderTarget) {
//             this.renderTarget = renderTarget;
//             this._gpu.setFramebuffer(renderTarget.$getFramebuffer());
//             this._gpu.setSize(0, 0, renderTarget.width, renderTarget.height);
//         } else {
//             this.renderTarget = null;
//             this._gpu.setFramebuffer(null);
//             this._gpu.setSize(0, 0, this._realWidth, this._realHeight);
//         }
//         if (clearColor) {
//             this._gpu.clearColor(0, 0, 0, 0);
//             this.clearColorDirtyFlag = true;
//         } else {
//             this.clearColorDirtyFlag = false;
//         }
//         if (clearDepth) {
//             this._gpu.clearDepth(1, 1, 1, 1);
//         }
//     }
//
//     flush() {
//         this._gpu.flush();
//     }
//
//     clearColor(r: number, g: number, b: number, a: number) {
//         this._gpu.clearColor(r, g, b, a);
//     }
//
//     clearDepth(r: number, g: number, b: number, a: number) {
//         this._gpu.clearDepth(r, g, b, a);
//     }
//
//     beforeRender(time: number, deltaTime: number) {
//         this.$updateCommonUniforms({ time, deltaTime });
//     }
//
//     /**
//      *
//      * @param scene
//      * @param cameras
//      * @param time
//      * @param deltaTime
//      * @param onBeforePostProcess
//      */
//     // render(scene: Scene, cameras: Camera, {useShadowPass = true, clearScene = true}) {
//     render(
//         scene: Scene,
//         cameras: Camera,
//         sharedTextures: SharedTextures,
//         {
//             time,
//             onBeforePostProcess,
//         }: {
//             time: number;
//             // timelineTime: number;
//             // timelineDeltaTime: number;
//             onBeforePostProcess?: () => void;
//         }
//     ) {
//         // ------------------------------------------------------------------------------
//         // transform feedback
//         // ------------------------------------------------------------------------------
//
//         // ------------------------------------------------------------------------------
//         // common uniform block object
//         // ------------------------------------------------------------------------------
//
//         // ------------------------------------------------------------------------------
//         // setup render mesh infos
//         // TODO: depth sort
//         // ------------------------------------------------------------------------------
//
//         const renderMeshInfoEachQueue: RenderMeshInfoEachQueue = {
//             [RenderQueueType.Skybox]: [],
//             [RenderQueueType.Opaque]: [],
//             [RenderQueueType.AlphaTest]: [],
//             [RenderQueueType.Transparent]: [],
//         };
//         const lightActors: LightActors = {
//             directionalLight: null,
//             spotLights: [],
//             pointLights: [],
//         };
//
//         let postProcessVolumeActor: PostProcessVolume | null = null;
//
//         // build render mesh info each queue
//         scene.traverse((actor) => {
//             switch (actor.type) {
//                 case ActorTypes.Skybox:
//                     renderMeshInfoEachQueue[RenderQueueType.Skybox].push(
//                         this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.Skybox)
//                     );
//                     // TODO: skyboxの中で処理したい
//                     // actor.transform.parent = cameras.transform;
//                     return;
//                 case ActorTypes.Mesh:
//                 case ActorTypes.SkinnedMesh:
//                     if (!(actor as Mesh).renderEnabled) {
//                         // skip
//                         return;
//                     }
//                     (actor as Mesh).materials.forEach((material, i) => {
//                         // if (!material.canRender) {
//                         //     return;
//                         // }
//                         if (material.getAlphaTest()) {
//                             renderMeshInfoEachQueue[RenderQueueType.AlphaTest].push(
//                                 this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.AlphaTest, i)
//                             );
//                             return;
//                         }
//                         switch (material.getBlendType()) {
//                             case BlendTypes.Opaque:
//                                 renderMeshInfoEachQueue[RenderQueueType.Opaque].push(
//                                     this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.Opaque, i)
//                                 );
//                                 return;
//                             case BlendTypes.Transparent:
//                             case BlendTypes.Additive:
//                                 renderMeshInfoEachQueue[RenderQueueType.Transparent].push(
//                                     this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.Transparent, i)
//                                 );
//                                 return;
//                             default:
//                                 console.error('[Renderer.render] invalid blend type');
//                         }
//                     });
//                     break;
//
//                 case ActorTypes.Light:
//                     if (actor.enabled) {
//                         const light = actor as Light;
//                         switch (light.lightType) {
//                             case LightTypes.Directional:
//                                 lightActors.directionalLight = light;
//                                 break;
//                             case LightTypes.Spot:
//                                 lightActors.spotLights.push(light as SpotLight);
//                                 break;
//                             case LightTypes.Point:
//                                 lightActors.pointLights.push(light as PointLight);
//                                 break;
//                         }
//                     }
//                     break;
//
//                 case ActorTypes.PostProcessVolume:
//                     postProcessVolumeActor = actor as PostProcessVolume;
//                     break;
//             }
//         });
//
//         // sort by render queue
//         const sortRenderQueueCompareFunc = (a: RenderMeshInfo, b: RenderMeshInfo) =>
//             a.actor.materials[a.materialIndex].getRenderQueue() - b.actor.materials[b.materialIndex].getRenderQueue();
//
//         // all mesh infos
//         const sortedRenderMeshInfos: RenderMeshInfo[] = Object.keys(renderMeshInfoEachQueue)
//             .map((key) => {
//                 const renderQueueType = key as RenderQueueType;
//                 const info = renderMeshInfoEachQueue[renderQueueType];
//                 return info.sort(sortRenderQueueCompareFunc);
//             })
//             .flat()
//             .filter(({ actor }) => actor.enabled);
//
//         // override postprocess parameters
//         if (postProcessVolumeActor) {
//             applyPostProcessVolumeParameters(this, postProcessVolumeActor);
//         }
//
//         //
//         // TODO: depth sort
//         //
//
//         // skybox
//         const sortedSkyboxRenderMeshInfos: RenderMeshInfo[] = sortedRenderMeshInfos.filter((renderMeshInfo) => {
//             return renderMeshInfo.queue === RenderQueueType.Skybox;
//         });
//
//         // base pass mesh infos
//         const sortedBasePassRenderMeshInfos: RenderMeshInfo[] = sortedRenderMeshInfos.filter((renderMeshInfo) => {
//             return (
//                 renderMeshInfo.queue === RenderQueueType.Skybox ||
//                 renderMeshInfo.queue === RenderQueueType.Opaque ||
//                 renderMeshInfo.queue === RenderQueueType.AlphaTest
//             );
//         });
//         sortedBasePassRenderMeshInfos.sort((a, b) => {
//             const al = Vector3.subVectors(cameras.transform.getPosition(), a.actor.transform.getPosition()).magnitude;
//             const bl = Vector3.subVectors(cameras.transform.getPosition(), b.actor.transform.getPosition()).magnitude;
//             return al < bl ? -1 : 1;
//         });
//
//         // transparent mesh infos
//         const sortedTransparentRenderMeshInfos: RenderMeshInfo[] = sortedRenderMeshInfos.filter(
//             (renderMeshInfo) => renderMeshInfo.queue === RenderQueueType.Transparent
//         );
//         sortedTransparentRenderMeshInfos.sort((a, b) => {
//             const al = Vector3.subVectors(cameras.transform.getPosition(), a.actor.transform.getPosition()).magnitude;
//             const bl = Vector3.subVectors(cameras.transform.getPosition(), b.actor.transform.getPosition()).magnitude;
//             return al > bl ? -1 : 1;
//         });
//
//         // ------------------------------------------------------------------------------
//         // update common uniforms
//         // ------------------------------------------------------------------------------
//
//         // this.updateCommonUniforms({ time, deltaTime });
//         // TODO: このままだと directional-light がなくなったときも directional-light が残ることになる
//         if (lightActors.directionalLight) {
//             this.$updateDirectionalLightUniforms(lightActors.directionalLight);
//         }
//         // TODO: このままだと spot-light がなくなったときも spot-light が残ることになる
//         if (lightActors.spotLights.length > 0) {
//             this.$updateSpotLightsUniforms(lightActors.spotLights);
//         }
//         // TODO: このままだと point-light がなくなったときも point-light が残ることになる
//         if (lightActors.pointLights.length > 0) {
//             this.$updatePointLightsUniforms(lightActors.pointLights);
//         }
//
//         // ------------------------------------------------------------------------------
//         // depth pre-pass
//         // ------------------------------------------------------------------------------
//
//         const depthPrePassRenderMeshInfos = sortedBasePassRenderMeshInfos.filter(({ actor }) => {
//             if (actor.type === ActorTypes.Skybox) {
//                 return false;
//             }
//             return actor;
//         });
//         depthPrePassRenderMeshInfos.sort((a, b) => {
//             const al = Vector3.subVectors(cameras.transform.getPosition(), a.actor.transform.getPosition()).magnitude;
//             const bl = Vector3.subVectors(cameras.transform.getPosition(), b.actor.transform.getPosition()).magnitude;
//             return al < bl ? -1 : 1;
//         });
//         this.depthPrePass(depthPrePassRenderMeshInfos, cameras);
//
//         // ------------------------------------------------------------------------------
//         // g-buffer opaque pass
//         // ------------------------------------------------------------------------------
//
//         this.scenePass(sortedBasePassRenderMeshInfos, cameras);
//
//         // ------------------------------------------------------------------------------
//         // shadow pass
//         // ------------------------------------------------------------------------------
//
//         // cast shadow 用のライト管理は配列にしちゃう
//         const castShadowLightActors: Light[] = [];
//         if (lightActors.directionalLight) {
//             castShadowLightActors.push(lightActors.directionalLight);
//         }
//         lightActors.spotLights.forEach((light) => {
//             if (light.castShadow) {
//                 castShadowLightActors.push(light);
//             }
//         });
//
//         if (castShadowLightActors.length > 0) {
//             const castShadowRenderMeshInfos = sortedBasePassRenderMeshInfos.filter(({ actor }) => {
//                 if (actor.type === ActorTypes.Skybox) {
//                     return false;
//                 }
//                 return actor.castShadow;
//             });
//             this.shadowPass(castShadowLightActors, castShadowRenderMeshInfos);
//         }
//
//         // ------------------------------------------------------------------------------
//         // screen space shadow pass
//         // ------------------------------------------------------------------------------
//
//         const postProcessCamera = this._scenePostProcess.getPostProcessCamera();
//
//         PostProcess.renderPass({
//             pass: this._screenSpaceShadowPass,
//             renderer: this,
//             targetCamera: cameras,
//             gpu: this._gpu,
//             cameras: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
//             prevRenderTarget: null,
//             isLastPass: false,
//             time, // TODO: engineから渡したい
//             // lightActors,
//         });
//
//         // ------------------------------------------------------------------------------
//         // ambient occlusion pass
//         // ------------------------------------------------------------------------------
//
//         PostProcess.renderPass({
//             pass: this._ambientOcclusionPass,
//             renderer: this,
//             targetCamera: cameras,
//             gpu: this._gpu,
//             cameras: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
//             prevRenderTarget: null,
//             isLastPass: false,
//             time, // TODO: engineから渡したい
//             // lightActors,
//         });
//
//         // ------------------------------------------------------------------------------
//         // deferred lighting pass
//         // ------------------------------------------------------------------------------
//
//         // update cubemap to deferred lighting pass
//         // TODO: skyboxは一個だけ想定のいいはず
//         sortedSkyboxRenderMeshInfos.forEach((skyboxRenderMeshInfo) => {
//             const skyboxActor = skyboxRenderMeshInfo.actor as Skybox;
//             this._deferredShadingPass.updateSkyboxUniforms(skyboxActor);
//         });
//
//         applyLightShadowMapUniformValues(this._deferredShadingPass.material, lightActors, this._gpu.dummyTextureBlack);
//
//         // set sss texture
//         setMaterialUniformValue(
//             this._deferredShadingPass.material,
//             'uScreenSpaceShadowTexture',
//             this._screenSpaceShadowPass.renderTarget.read.$getTexture()
//         );
//
//         // set ao texture
//         setMaterialUniformValue(
//             this._deferredShadingPass.material,
//             'uAmbientOcclusionTexture',
//             this._ambientOcclusionPass.renderTarget.read.$getTexture()
//         );
//
//         PostProcess.renderPass({
//             pass: this._deferredShadingPass,
//             renderer: this,
//             targetCamera: cameras,
//             gpu: this._gpu,
//             cameras: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
//             prevRenderTarget: null,
//             isLastPass: false,
//             time, // TODO: engineから渡したい
//             lightActors,
//         });
//
//         // ------------------------------------------------------------------------------
//         // ssr pass
//         // ------------------------------------------------------------------------------
//
//         PostProcess.renderPass({
//             pass: this._ssrPass,
//             renderer: this,
//             targetCamera: cameras,
//             gpu: this._gpu,
//             cameras: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
//             prevRenderTarget: this._deferredShadingPass.renderTarget,
//             isLastPass: false,
//             time, // TODO: engineから渡したい
//             // lightActors,
//         });
//
//         // ------------------------------------------------------------------------------
//         // light shaft pass
//         // ------------------------------------------------------------------------------
//
//         if (lightActors.directionalLight) {
//             this._lightShaftPass.setDirectionalLight(lightActors.directionalLight);
//             PostProcess.renderPass({
//                 pass: this._lightShaftPass,
//                 renderer: this,
//                 targetCamera: cameras,
//                 gpu: this._gpu,
//                 cameras: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
//                 prevRenderTarget: this._deferredShadingPass.renderTarget,
//                 isLastPass: false,
//                 time, // TODO: engineから渡したい
//             });
//         } else {
//             // TODO: directional light ないときの対応。黒く塗りたい
//         }
//
//         // ------------------------------------------------------------------------------
//         // volumetric light pass
//         // ------------------------------------------------------------------------------
//
//         this._volumetricLightPass.setSpotLights(lightActors.spotLights);
//         if (lightActors.spotLights.length > 0) {
//             PostProcess.renderPass({
//                 pass: this._volumetricLightPass,
//                 renderer: this,
//                 targetCamera: cameras,
//                 gpu: this._gpu,
//                 cameras: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
//                 prevRenderTarget: this._deferredShadingPass.renderTarget,
//                 isLastPass: false,
//                 time, // TODO: engineから渡したい
//                 // lightActors,
//             });
//         } else {
//             // TODO: spot light ないときの対応。黒く塗りたい
//         }
//         // return;
//
//         // ------------------------------------------------------------------------------
//         // height fog pass
//         // ------------------------------------------------------------------------------
//
//         this._fogPass.setTextures(
//             this._lightShaftPass.renderTarget.read.$getTexture()!,
//             // CUSTOM
//             //  this._gpu.dummyTextureBlack,
//             //
//             this._volumetricLightPass.renderTarget.read.$getTexture()!,
//             this._screenSpaceShadowPass.renderTarget.read.$getTexture()!,
//             sharedTextures[SharedTexturesTypes.FBM_NOISE].texture
//         );
//
//         PostProcess.renderPass({
//             pass: this._fogPass,
//             renderer: this,
//             targetCamera: cameras,
//             gpu: this._gpu,
//             cameras: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
//             // prevRenderTarget: this._deferredShadingPass.renderTarget,
//             prevRenderTarget: this._ssrPass.renderTarget,
//             isLastPass: false,
//             time, // TODO: engineから渡したい
//             // lightActors,
//         });
//         // return;
//
//         // ------------------------------------------------------------------------------
//         // transparent pass
//         // ------------------------------------------------------------------------------
//
//         // TODO: 直前のパスを明示的に指定する必要があるのはめんどうなのでうまいこと管理したい
//         this._afterDeferredShadingRenderTarget.setTexture(this._fogPass.renderTarget.read.$getTexture()!);
//
//         // pattern1: g-buffer depth
//         // this._afterDeferredShadingRenderTarget.setDepthTexture(this._gBufferRenderTargets.depthTexture!);
//         // pattern2: depth prepass
//         this._afterDeferredShadingRenderTarget.setDepthTexture(this._depthPrePassRenderTarget.$getDepthTexture()!);
//
//         this.copyDepthTexture();
//
//         // TODO: set depth to transparent meshes
//         sortedTransparentRenderMeshInfos.forEach((renderMeshInfo) => {
//             setMaterialUniformValue(
//                 renderMeshInfo.actor.material,
//                 UniformNames.DepthTexture,
//                 this._copyDepthDestRenderTarget.$getDepthTexture()
//             );
//         });
//
//         this.setRenderTarget(this._afterDeferredShadingRenderTarget.write);
//
//         this.$transparentPass(sortedTransparentRenderMeshInfos, cameras, lightActors);
//
//         // ------------------------------------------------------------------------------
//         // full screen pass
//         // TODO: mainCameraかつcameraにpostProcessがあるときの対応
//         // ------------------------------------------------------------------------------
//
//         if (onBeforePostProcess) {
//             onBeforePostProcess();
//         }
//
//         if (!this._scenePostProcess.hasEnabledPass) {
//             // 何もenabledがないのはおかしい. tonemappingは最低限有効化されていないとおかしい(HDRなので)
//             console.error('invalid postprocess');
//         }
//
//         // console.log("--------- postprocess pass ---------");
//
//         let prevRenderTarget: RenderTarget = this._afterDeferredShadingRenderTarget;
//         const isCameraLastPassAndHasNotPostProcess = !cameras.renderTarget && !cameras.hasEnabledPostProcessPass;
//         this._scenePostProcess.update();
//         this._scenePostProcess.render({
//             gpu: this._gpu,
//             renderer: this,
//             prevRenderTarget,
//             gBufferRenderTargets: this._gBufferRenderTargets,
//             targetCamera: cameras,
//             time, // TODO: engineから渡したい
//             isCameraLastPass: isCameraLastPassAndHasNotPostProcess,
//             // lightActors,
//         });
//
//         if (isCameraLastPassAndHasNotPostProcess) {
//             return;
//         }
//
//         prevRenderTarget = this._scenePostProcess.lastRenderTarget!;
//
//         if (cameras.hasEnabledPostProcessPass) {
//             cameras.postProcess?.update();
//             cameras.postProcess?.render({
//                 gpu: this._gpu,
//                 renderer: this,
//                 prevRenderTarget,
//                 // tone mapping 挟む場合
//                 // prevRenderTarget: this._toneMappingPass.renderTarget,
//                 gBufferRenderTargets: this._gBufferRenderTargets,
//                 targetCamera: cameras,
//                 time, // TODO: engineから渡したい
//                 isCameraLastPass: !cameras.renderTarget,
//                 lightActors,
//             });
//         }
//     }
//
//     /**
//      *
//      * @param geometry
//      * @param material
//      */
//     renderMesh(geometry: Geometry, material: Material) {
//         geometry.update();
//
//         if (this._stats) {
//             this._stats.addDrawVertexCount(geometry);
//             this._stats.incrementDrawCall();
//         }
//
//         // console.log("===========")
//         // console.log(`[Renderer.renderMesh] geometry`, geometry);
//         // console.log(`[Renderer.renderMesh] mat: ${material.getName()}`, material.getShader());
//
//         // vertex
//         this._gpu.setVertexArrayObject(geometry.getVertexArrayObject());
//         // material
//         if (!material.getShader()) {
//             // console.error('invalid material shader');
//             return;
//         }
//         this._gpu.setShader(material.getShader()!); // TODO: ない場合を判定したい
//         // uniforms
//         this._gpu.setUniforms(material.getUniforms());
//
//         // setup depth write (depth mask)
//         let depthWrite;
//         if (material.getDepthWrite() !== null) {
//             depthWrite = material.getDepthWrite();
//         } else {
//             switch (material.getBlendType()) {
//                 case BlendTypes.Opaque:
//                     depthWrite = true;
//                     break;
//                 case BlendTypes.Transparent:
//                 case BlendTypes.Additive:
//                     depthWrite = false;
//                     break;
//                 default:
//                     console.error('invalid depth write');
//                     return;
//             }
//         }
//
//         // setup depth test
//         const depthTest = !!material.getDepthTest();
//
//         // depth func type
//         const depthFuncType = material.getDepthFuncType();
//
//         // draw
//         this._gpu.draw(
//             geometry.getDrawCount(),
//             material.getPrimitiveType(),
//             depthTest,
//             depthWrite,
//             depthFuncType,
//             material.getBlendType(),
//             material.getFaceSide(),
//             geometry.getInstanceCount()
//         );
//     }
//
//     /**
//      *
//      * @param actor
//      * @param materialIndex
//      * @private
//      */
//     private buildRenderMeshInfo(actor: Mesh, queue: RenderQueueType, materialIndex: number = 0): RenderMeshInfo {
//         return {
//             actor,
//             queue,
//             materialIndex,
//         };
//     }
//
//     // setUniformBlockData() {}
//
//     /**
//      * uniform block の変数を更新
//      * @param blockName
//      * @param uniformName
//      * @param value
//      * @private
//      */
//     $setUniformBlockValue(blockName: string, uniformName: string, value: UniformBufferObjectValue) {
//         const targetGlobalUniformBufferObject = this._globalUniformBufferObjects.find(
//             ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
//         );
//         if (!targetGlobalUniformBufferObject) {
//             console.error(`[Renderer.setUniformBlockData] invalid uniform block object: ${blockName}`);
//             return;
//         }
//         const targetUbo = targetGlobalUniformBufferObject.uniformBufferObject;
//
//         const targetUniformData = targetGlobalUniformBufferObject.data.find((d) => {
//             return d.name === uniformName;
//         });
//
//         if (!targetUniformData) {
//             console.error(`[Renderer.setUniformBlockData] invalid uniform name: ${uniformName}`);
//             return;
//         }
//
//         targetUbo.updateUniformValue(uniformName, targetUniformData.type, value);
//     }
//
//     private depthPrePass(depthPrePassRenderMeshInfos: RenderMeshInfo[], cameras: Camera) {
//         // console.log("--------- depth pre pass ---------");
//
//         this.setRenderTarget(this._depthPrePassRenderTarget, false, true);
//         this.updateCameraUniforms(cameras);
//
//         depthPrePassRenderMeshInfos.forEach(({ actor }) => {
//             this.updateActorTransformUniforms(actor);
//
//             actor.depthMaterials.forEach((depthMaterial, i) => {
//                 if (!depthMaterial) {
//                     console.error('[Renderer.depthPrePass] invalid depth material');
//                     return;
//                 }
//
//                 if (!depthMaterial.getCanRender()) {
//                     return;
//                 }
//
//                 if (actor.materials[i].getSkipDepthPrePass()) {
//                     return;
//                 }
//
//                 this.renderMesh(actor.geometry, depthMaterial);
//
//                 if (this._stats) {
//                     this._stats.addPassInfo('depth pre pass', actor.name, actor.geometry);
//                 }
//             });
//         });
//     }
//
//     private copyDepthTexture() {
//         this._copyDepthSourceRenderTarget.setDepthTexture(this._depthPrePassRenderTarget.$getDepthTexture()!);
//         RenderTarget.blitDepth({
//             gpu: this._gpu,
//             sourceRenderTarget: this._copyDepthSourceRenderTarget,
//             destRenderTarget: this._copyDepthDestRenderTarget,
//             width: this._realWidth,
//             height: this._realHeight,
//         });
//     }
//
//     private shadowPass(castShadowLightActors: Light[], castShadowRenderMeshInfos: RenderMeshInfo[]) {
//         // console.log("--------- shadow pass ---------");
//
//         castShadowLightActors.forEach((lightActor) => {
//             if (!lightActor.shadowMap) {
//                 console.error('invalid shadow pass');
//                 return;
//             }
//             if (!lightActor.shadowCamera) {
//                 console.error('invalid shadow cameras');
//                 return;
//             }
//             this.setRenderTarget(lightActor.shadowMap.write, false, true);
//             // this.clear(0, 0, 0, 1);
//             // this._gpu.clearDepth(0, 0, 0, 1);
//
//             if (castShadowRenderMeshInfos.length < 1) {
//                 return;
//             }
//
//             this.updateCameraUniforms(lightActor.shadowCamera);
//
//             castShadowRenderMeshInfos.forEach(({ actor }) => {
//                 // TODO: material 側でやった方がよい？
//                 this.updateActorTransformUniforms(actor);
//
//                 actor.updateDepthMaterial({ cameras: lightActor.shadowCamera! });
//
//                 actor.depthMaterials.forEach((depthMaterial) => {
//                     // TODO: material 側でやった方がよい？
//                     if (!depthMaterial) {
//                         console.error('invalid target material');
//                         return;
//                     }
//
//                     if (!depthMaterial.getCanRender()) {
//                         return;
//                     }
//
//                     setMaterialUniformValue(
//                         depthMaterial,
//                         UniformNames.DepthTexture,
//                         this._copyDepthDestRenderTarget.$getDepthTexture()
//                     );
//
//                     this.renderMesh(actor.geometry, depthMaterial);
//                     if (this._stats) {
//                         this._stats.addPassInfo('shadow pass', actor.name, actor.geometry);
//                     }
//                 });
//             });
//         });
//     }
//
//     private scenePass(sortedRenderMeshInfos: RenderMeshInfo[], cameras: Camera) {
//         // console.log("--------- scene pass ---------");
//
//         // NOTE: DepthTextureはあるはず
//         this._gBufferRenderTargets.setDepthTexture(this._depthPrePassRenderTarget.$getDepthTexture()!);
//
//         this.setRenderTarget(this._gBufferRenderTargets.write, true);
//
//         // TODO: depth prepass しない場合は必要
//         // if (clear) {
//         //     this.clear(cameras.clearColor.x, cameras.clearColor.y, cameras.clearColor.z, cameras.clearColor.w);
//         // }
//
//         this.updateCameraUniforms(cameras);
//
//         sortedRenderMeshInfos.forEach(({ actor, materialIndex }) => {
//             switch (actor.type) {
//                 case ActorTypes.Skybox:
//                     if (!(actor as Skybox).renderMesh) {
//                         return;
//                     }
//                     // TODO: skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
//                     // TODO: engineでやるべき
//                     actor.$updateTransform(cameras);
//                     break;
//             }
//
//             const targetMaterial = actor.materials[materialIndex];
//
//             if (!targetMaterial.getCanRender()) {
//                 return;
//             }
//
//             // pre-passしてないmaterialの場合はdepthをcopy.
//             // pre-passしてないmaterialが存在する度にdepthをcopyする必要があるので、使用は最小限にとどめる（raymarch以外では使わないなど）
//             if (targetMaterial.getSkipDepthPrePass()) {
//                 this.setRenderTarget(null, false, false);
//                 this.copyDepthTexture();
//                 this.setRenderTarget(this._gBufferRenderTargets.write, false, false);
//             }
//
//             // TODO: material 側でやった方がよい？
//             this.updateActorTransformUniforms(actor);
//
//             // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
//             setMaterialUniformValue(
//                 targetMaterial,
//                 UniformNames.DepthTexture,
//                 this._copyDepthDestRenderTarget.$getDepthTexture()
//             );
//
//             // TODO:
//             // - light actor の中で lightの種類別に処理を分ける
//             // - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意
//             // lightActors.forEach((light) => {
//             //     light.applyUniformsValues(targetMaterial);
//             // });
//             // TODO: g-bufferの時にはlightのuniformsを設定しなくて大丈夫になったのでいらないはず
//             // applyLightShadowMapUniformValues(targetMaterial, lightActors);
//
//             actor.updateMaterial({ cameras });
//
//             this.renderMesh(actor.geometry, targetMaterial);
//
//             if (this._stats) {
//                 this._stats.addPassInfo('scene pass', actor.name, actor.geometry);
//             }
//         });
//     }
//
//     updateActorTransformUniforms(actor: Actor) {
//         this.$setUniformBlockValue(
//             UniformBlockNames.Transformations,
//             UniformNames.WorldMatrix,
//             actor.transform.getWorldMatrix()
//         );
//         this.$setUniformBlockValue(
//             UniformBlockNames.Transformations,
//             UniformNames.InverseWorldMatrix,
//             actor.transform.getInverseWorldMatrix()
//         );
//         this.$setUniformBlockValue(
//             UniformBlockNames.Transformations,
//             UniformNames.NormalMatrix,
//             actor.transform.getNormalMatrix()
//         );
//     }
//
//     updateCameraUniforms(cameras: Camera) {
//         this.$setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.ViewMatrix, cameras.viewMatrix);
//         this.$setUniformBlockValue(
//             UniformBlockNames.Transformations,
//             UniformNames.ProjectionMatrix,
//             cameras.projectionMatrix
//         );
//         this.$setUniformBlockValue(
//             UniformBlockNames.Camera,
//             UniformNames.ViewPosition,
//             cameras.transform.getWorldMatrix().position
//         );
//         this.$setUniformBlockValue(UniformBlockNames.Camera, UniformNames.ViewDirection, cameras.getWorldForward());
//         this.$setUniformBlockValue(UniformBlockNames.Camera, UniformNames.CameraNear, cameras.near);
//         this.$setUniformBlockValue(UniformBlockNames.Camera, UniformNames.CameraFar, cameras.far);
//         this.$setUniformBlockValue(
//             UniformBlockNames.Camera,
//             UniformNames.CameraAspect,
//             cameras.isPerspective() ? (cameras as PerspectiveCamera).aspect : (cameras as OrthographicCamera).aspect
//         );
//         this.$setUniformBlockValue(
//             UniformBlockNames.Camera,
//             UniformNames.CameraFov,
//             cameras.isPerspective() ? (cameras as PerspectiveCamera).fov : 0
//         );
//         this.$setUniformBlockValue(
//             UniformBlockNames.Transformations,
//             UniformNames.ViewProjectionMatrix,
//             cameras.viewProjectionMatrix
//         );
//         this.$setUniformBlockValue(
//             UniformBlockNames.Transformations,
//             UniformNames.InverseViewMatrix,
//             cameras.inverseViewMatrix
//         );
//         this.$setUniformBlockValue(
//             UniformBlockNames.Transformations,
//             UniformNames.InverseProjectionMatrix,
//             cameras.inverseProjectionMatrix
//         );
//         this.$setUniformBlockValue(
//             UniformBlockNames.Transformations,
//             UniformNames.InverseViewProjectionMatrix,
//             cameras.inverseViewProjectionMatrix
//         );
//         this.$setUniformBlockValue(
//             UniformBlockNames.Transformations,
//             UniformNames.TransposeInverseViewMatrix,
//             cameras.viewMatrix.clone().invert().transpose()
//         );
//     }
//
//     $updateUniformBlockValue(
//         blockName: string,
//         uniformName: string,
//         value: UniformBufferObjectValue,
//         showLog: boolean = false
//     ) {
//         const targetGlobalUniformBufferObject = this._globalUniformBufferObjects.find(
//             ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
//         );
//         if (!targetGlobalUniformBufferObject) {
//             console.error(`[Renderer.setUniformBlockData] invalid uniform block object: ${blockName}`);
//             return;
//         }
//
//         const targetUbo = targetGlobalUniformBufferObject.uniformBufferObject;
//
//         const targetUniformData = targetGlobalUniformBufferObject.data.find((d) => {
//             return d.name === uniformName;
//         });
//
//         if (!targetUniformData) {
//             console.error(`[Renderer.setUniformBlockData] invalid uniform name: ${uniformName}`);
//             return;
//         }
//
//         const getStructElementValue = (type: UniformTypes, value: UniformBufferObjectValue) => {
//             const data: number[] = [];
//             switch (type) {
//                 case UniformTypes.Float:
//                 case UniformTypes.Int:
//                     data.push(value as number);
//                     data.push(0);
//                     data.push(0);
//                     data.push(0);
//                     break;
//                 case UniformTypes.Bool:
//                     data.push((value as boolean) ? 1 : 0);
//                     data.push(0);
//                     data.push(0);
//                     data.push(0);
//                     break;
//                 case UniformTypes.Vector2:
//                     data.push(...(value as Vector2).e);
//                     data.push(0);
//                     break;
//                 case UniformTypes.Vector3:
//                     data.push(...(value as Vector3).e);
//                     data.push(0);
//                     break;
//                 case UniformTypes.Vector4:
//                     data.push(...(value as Vector4).e);
//                     break;
//                 case UniformTypes.Matrix4:
//                     data.push(...(value as Matrix4).e);
//                     break;
//                 case UniformTypes.Color:
//                     data.push(...(value as Color).e);
//                     break;
//                 default:
//                     console.error(`invalid uniform type: ${type}`);
//             }
//             return data;
//         };
//
//         switch (targetUniformData.type) {
//             // TODO: update struct
//             case UniformTypes.Struct:
//                 (value as unknown as UniformBufferObjectStructValue).forEach((v) => {
//                     const structElementName = `${uniformName}.${v.name}`;
//                     const data: number[] = getStructElementValue(v.type, v.value);
//                     targetUbo.updateBufferData(structElementName, new Float32Array(data));
//                 });
//                 break;
//             case UniformTypes.StructArray:
//                 (value as UniformBufferObjectStructArrayValue).forEach((v, i) => {
//                     v.forEach((vv) => {
//                         const structElementName = `${uniformName}[${i}].${vv.name}`;
//                         const data: number[] = getStructElementValue(vv.type, vv.value);
//                         if (showLog) {
//                             // console.log(structElementName, data);
//                         }
//                         targetUbo.updateBufferData(structElementName, new Float32Array(data), showLog);
//                     });
//                 });
//                 break;
//             default:
//                 if (Array.isArray(value)) {
//                     const data: number[] = [];
//                     (value as UniformBufferObjectElementValueArray).forEach((v) => {
//                         if (typeof v === 'number') {
//                             data.push(v);
//                             data.push(0);
//                             data.push(0);
//                             data.push(0);
//                         } else if (typeof v === 'boolean') {
//                             data.push(v ? 1 : 0);
//                             data.push(0);
//                             data.push(0);
//                             data.push(0);
//                         } else {
//                             data.push(...(v as UniformBufferObjectElementValueNoNeedsPadding).e);
//                         }
//                     });
//                     targetUbo.updateBufferData(uniformName, new Float32Array(data));
//                 } else {
//                     targetUbo.updateBufferData(
//                         uniformName,
//                         typeof value === 'number'
//                             ? new Float32Array([value])
//                             : (value as Vector2 | Vector3 | Vector4 | Matrix4 | Color).e
//                     );
//                 }
//                 break;
//         }
//     }
//
//     $updateCommonUniforms({ time, deltaTime }: { time: number; deltaTime: number }) {
//         // passMaterial.uniforms.setValue(UniformNames.Time, time);
//         this.$updateUniformBlockValue(UniformBlockNames.Common, UniformNames.Time, time);
//         this.$updateUniformBlockValue(UniformBlockNames.Common, UniformNames.DeltaTime, deltaTime);
//         this.$updateUniformBlockValue(
//             UniformBlockNames.Common,
//             UniformNames.Viewport,
//             new Vector4(this._realWidth, this._realHeight, this._realWidth / this._realHeight, 0)
//         );
//     }
//
//     updateTimelineUniforms(timelineTime: number, timelineDeltaTime: number) {
//         // passMaterial.uniforms.setValue(UniformNames.Time, time);
//         this.$updateUniformBlockValue(UniformBlockNames.Timeline, UniformNames.TimelineTime, timelineTime);
//         this.$updateUniformBlockValue(UniformBlockNames.Timeline, UniformNames.TimelineDeltaTime, timelineDeltaTime);
//     }
//
//     $updateDirectionalLightUniforms(directionalLight: DirectionalLight) {
//         this.$updateUniformBlockValue(UniformBlockNames.DirectionalLight, UniformNames.DirectionalLight, [
//             {
//                 name: UniformNames.LightDirection,
//                 type: UniformTypes.Vector3,
//                 // pattern3: normalizeし、光源の位置から降り注ぐとみなす
//                 value: directionalLight.transform.getPosition().clone().negate().normalize(),
//             },
//             {
//                 name: UniformNames.LightIntensity,
//                 type: UniformTypes.Float,
//                 value: directionalLight.intensity,
//             },
//             {
//                 name: UniformNames.LightColor,
//                 type: UniformTypes.Color,
//                 value: directionalLight.color,
//             },
//             {
//                 // name: UniformNames.LightViewProjectionMatrix,
//                 name: UniformNames.ShadowMapProjectionMatrix,
//                 type: UniformTypes.Matrix4,
//                 value: directionalLight.shadowMapProjectionMatrix,
//             },
//         ]);
//     }
//
//     $updateSpotLightsUniforms(spotLights: SpotLight[]) {
//         this.$updateUniformBlockValue(
//             UniformBlockNames.SpotLight,
//             UniformNames.SpotLight,
//             spotLights.map((spotLight) => {
//                 return [
//                     {
//                         name: UniformNames.LightColor,
//                         type: UniformTypes.Color,
//                         value: spotLight.color,
//                     },
//                     {
//                         name: UniformNames.LightPosition,
//                         type: UniformTypes.Vector3,
//                         value: spotLight.transform.getPosition(),
//                     },
//                     {
//                         name: UniformNames.LightDirection,
//                         type: UniformTypes.Vector3,
//                         value: spotLight.transform.getWorldForward().clone(),
//                     },
//                     {
//                         name: UniformNames.LightIntensity,
//                         type: UniformTypes.Float,
//                         value: spotLight.intensity,
//                     },
//                     {
//                         name: UniformNames.LightDistance,
//                         type: UniformTypes.Float,
//                         value: spotLight.distance,
//                     },
//                     {
//                         name: UniformNames.LightAttenuation,
//                         type: UniformTypes.Float,
//                         value: spotLight.attenuation,
//                     },
//                     {
//                         name: UniformNames.LightConeCos,
//                         type: UniformTypes.Float,
//                         value: spotLight.coneCos,
//                     },
//                     {
//                         name: UniformNames.LightPenumbraCos,
//                         type: UniformTypes.Float,
//                         value: spotLight.penumbraCos,
//                     },
//                     {
//                         name: UniformNames.ShadowMapProjectionMatrix,
//                         type: UniformTypes.Matrix4,
//                         value: spotLight.shadowMapProjectionMatrix,
//                     },
//                 ];
//             })
//         );
//     }
//
//     $updatePointLightsUniforms(pointLights: PointLight[]) {
//         this.$updateUniformBlockValue(
//             UniformBlockNames.PointLight,
//             UniformNames.PointLight,
//             pointLights.map((pointLight) => {
//                 return [
//                     {
//                         name: UniformNames.LightColor,
//                         type: UniformTypes.Color,
//                         value: pointLight.color,
//                     },
//                     {
//                         name: UniformNames.LightPosition,
//                         type: UniformTypes.Vector3,
//                         value: pointLight.transform.getPosition(),
//                     },
//                     {
//                         name: UniformNames.LightIntensity,
//                         type: UniformTypes.Float,
//                         value: pointLight.intensity,
//                     },
//                     {
//                         name: UniformNames.LightDistance,
//                         type: UniformTypes.Float,
//                         value: pointLight.distance,
//                     },
//                     {
//                         name: UniformNames.LightAttenuation,
//                         type: UniformTypes.Float,
//                         value: pointLight.attenuation,
//                     },
//                 ];
//             }),
//             true
//         );
//     }
//
//     $transparentPass(
//         sortedRenderMeshInfos: RenderMeshInfo[],
//         cameras: Camera,
//         lightActors: LightActors
//         // clear: boolean
//     ) {
//         // console.log("--------- transparent pass ---------");
//
//         // TODO: 常にclearしない、で良い気がする
//         // if (clear) {
//         //     this._gpu.clear(cameras.clearColor.x, cameras.clearColor.y, cameras.clearColor.z, cameras.clearColor.w);
//         // }
//         this.updateCameraUniforms(cameras);
//
//         sortedRenderMeshInfos.forEach(({ actor, materialIndex }) => {
//             const targetMaterial = actor.materials[materialIndex];
//             this.updateActorTransformUniforms(actor);
//
//             // TODO:
//             // - light actor の中で lightの種類別に処理を分ける
//             // - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意
//             // - opaqueと共通処理なのでまとめたい
//             // lightActors.forEach((light) => {
//             //     light.applyUniformsValues(targetMaterial);
//             // });
//             // TODO: transparentで必要？使わないことを強制してもいい気がする
//             applyLightShadowMapUniformValues(targetMaterial, lightActors, this._gpu.dummyTextureBlack);
//
//             this.renderMesh(actor.geometry, targetMaterial);
//
//             if (this._stats) {
//                 this._stats.addPassInfo('transparent pass', actor.name, actor.geometry);
//             }
//         });
//     }
// }

/**
 * 描画パイプライン的な役割
 * TODO: memo pass
 * - depth pre-pass
 * - g-buffer pass (color, normal, material info)
 * - ao pass
 * - shading pass
 * - post process pass
 * TODO:
 * - depth prepass 使わない場合。offscreen する時とか
 * - offscreen rendering
 */
export class Renderer {
    _canvas;
    _pixelRatio;
    _globalUniformBufferObjects: {
        uniformBufferObject: UniformBufferObject;
        data: UniformBufferObjectBlockData;
    }[] = [];

    _gpu;
    _realWidth: number = 1;
    _realHeight: number = 1;
    _stats: Stats | null = null;
    _scenePostProcess: PostProcess;
    _screenQuadCamera: Camera = createFullQuadOrthographicCamera();
    _depthPrePassRenderTarget: RenderTarget;
    _gBufferRenderTargets: GBufferRenderTargets;
    _afterDeferredShadingRenderTarget: RenderTarget;
    _copyDepthSourceRenderTarget: RenderTarget;
    _copyDepthDestRenderTarget: RenderTarget;
    _screenSpaceShadowPass: ScreenSpaceShadowPass;
    _ambientOcclusionPass: SSAOPass;
    _deferredShadingPass: DeferredShadingPass;
    _ssrPass: SSRPass;
    _lightShaftPass: LightShaftPass;
    _volumetricLightPass: VolumetricLightPass;
    _fogPass: FogPass;
    _depthOfFieldPass: DepthOfFieldPass;
    _bloomPass: BloomPass;
    _streakPass: StreakPass;
    _toneMappingPass: ToneMappingPass;
    _chromaticAberrationPass: ChromaticAberrationPass;
    _glitchPass: GlitchPass;
    _vignettePass: VignettePass;
    _fxaaPass: FXAAPass;

    get realWidth() {
        return this._realWidth;
    }

    get realHeight() {
        return this._realHeight;
    }

    get pixelRatio() {
        return this._pixelRatio;
    }

    getStats() {
        return this._stats;
    }

    setStats(stats: Stats) {
        this._stats = stats;
    }

    get globalUniformBufferObjects() {
        return this._globalUniformBufferObjects;
    }

    get depthPrePassRenderTarget() {
        return this._depthPrePassRenderTarget;
    }

    get gBufferRenderTargets() {
        return this._gBufferRenderTargets;
    }

    get screenSpaceShadowPass() {
        return this._screenSpaceShadowPass;
    }

    get ambientOcclusionPass() {
        return this._ambientOcclusionPass;
    }

    get ssrPass() {
        return this._ssrPass;
    }

    get deferredShadingPass() {
        return this._deferredShadingPass;
    }

    get lightShaftPass() {
        return this._lightShaftPass;
    }

    get lightShaftPassTexture() {
        // dummy
        return this._gpu.dummyTextureBlack;
    }

    get volumetricLightPass() {
        return this._volumetricLightPass;
    }

    get fogPass() {
        return this._fogPass;
    }

    get depthOfFieldPass() {
        return this._depthOfFieldPass;
    }

    get bloomPass() {
        return this._bloomPass;
    }

    get streakPass() {
        return this._streakPass;
    }

    get chromaticAberrationPass() {
        return this._chromaticAberrationPass;
    }

    get glitchPass() {
        return this._glitchPass;
    }

    get vignettePass() {
        return this._vignettePass;
    }

    get fxaaPass() {
        return this._fxaaPass;
    }

    /**
     *
     * @param gpu
     * @param canvas
     * @param pixelRatio
     */
    constructor({ gpu, canvas, pixelRatio = 1.5 }: { gpu: GPU; canvas: HTMLCanvasElement; pixelRatio: number }) {
        this._gpu = gpu;
        this._canvas = canvas;
        this._pixelRatio = pixelRatio;
        this._scenePostProcess = new PostProcess(this._screenQuadCamera);
        this._depthPrePassRenderTarget = new RenderTarget({
            gpu,
            type: RenderTargetTypes.Depth,
            width: 1,
            height: 1,
            name: 'depth pre-pass render target',
            depthPrecision: TextureDepthPrecisionType.High, // 低精度だとマッハバンドのような見た目になるので高精度にしておく
        });
        this._gBufferRenderTargets = new GBufferRenderTargets({
            gpu,
            width: 1,
            height: 1,
            name: 'g-buffer render target',
        });
        this._afterDeferredShadingRenderTarget = new RenderTarget({
            gpu,
            type: RenderTargetTypes.Empty,
            width: 1,
            height: 1,
            name: 'after g-buffer render target',
        });
        // console.log(this._afterDeferredShadingRenderTarget)
        this._copyDepthSourceRenderTarget = new RenderTarget({
            gpu,
            type: RenderTargetTypes.Empty,
            width: 1,
            height: 1,
            name: 'copy depth source render target',
            depthPrecision: TextureDepthPrecisionType.High, // 低精度だとマッハバンドのような見た目になるので高精度にしておく
        });
        this._copyDepthDestRenderTarget = new RenderTarget({
            gpu,
            type: RenderTargetTypes.Depth,
            width: 1,
            height: 1,
            name: 'copy depth dest render target',
            depthPrecision: TextureDepthPrecisionType.High, // 低精度だとマッハバンドのような見た目になるので高精度にしておく
        });

        this._screenSpaceShadowPass = new ScreenSpaceShadowPass({ gpu });
        this._ambientOcclusionPass = new SSAOPass({ gpu });
        this._deferredShadingPass = new DeferredShadingPass({ gpu });
        this._ssrPass = new SSRPass({ gpu });
        this._lightShaftPass = new LightShaftPass({ gpu });
        this._volumetricLightPass = new VolumetricLightPass({ gpu });
        this._fogPass = new FogPass({ gpu });

        this._fxaaPass = new FXAAPass({ gpu });
        this._scenePostProcess.addPass(this._fxaaPass);

        this._depthOfFieldPass = new DepthOfFieldPass({ gpu });
        this._scenePostProcess.addPass(this._depthOfFieldPass);

        this._bloomPass = new BloomPass({
            gpu,
        });
        this._scenePostProcess.addPass(this._bloomPass);

        this._streakPass = new StreakPass({ gpu });
        this._scenePostProcess.addPass(this._streakPass);

        this._toneMappingPass = new ToneMappingPass({ gpu });
        this._scenePostProcess.addPass(this._toneMappingPass);

        this._vignettePass = new VignettePass({ gpu });
        this._scenePostProcess.addPass(this._vignettePass);

        this._chromaticAberrationPass = new ChromaticAberrationPass({ gpu });
        this._scenePostProcess.addPass(this._chromaticAberrationPass);

        this._glitchPass = new GlitchPass({ gpu });
        this._scenePostProcess.addPass(this._glitchPass);

        //
        // initialize global uniform buffer objects
        //

        const uniformBufferObjectShader = new Shader({
            gpu,
            vertexShader: replaceShaderIncludes(globalUniformBufferObjectVertexShader),
            fragmentShader: replaceShaderIncludes(globalUniformBufferObjectFragmentShader),
        });

        const transformationsUniformBlockData = [
            {
                name: UniformNames.WorldMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.ViewMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.ProjectionMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.NormalMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.InverseWorldMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.ViewProjectionMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.InverseViewMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.InverseProjectionMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.InverseViewProjectionMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.TransposeInverseViewMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
        ];
        this._globalUniformBufferObjects.push({
            uniformBufferObject: this._gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.Transformations,
                transformationsUniformBlockData
            ),
            data: transformationsUniformBlockData,
        });

        const cameraUniformBufferData = [
            {
                name: UniformNames.ViewPosition,
                type: UniformTypes.Vector3,
                value: Vector3.zero,
            },
            {
                name: UniformNames.ViewDirection,
                type: UniformTypes.Vector3,
                value: Vector3.zero,
            },
            {
                name: UniformNames.CameraNear,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.CameraFar,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.CameraAspect,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.CameraFov,
                type: UniformTypes.Float,
                value: 0,
            },
        ];
        this._globalUniformBufferObjects.push({
            uniformBufferObject: this._gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.Camera,
                cameraUniformBufferData
            ),
            data: cameraUniformBufferData,
        });

        const directionalLightUniformBufferData = [
            {
                name: UniformNames.DirectionalLight,
                type: UniformTypes.Struct,
                value: [
                    {
                        name: UniformNames.LightDirection,
                        type: UniformTypes.Vector3,
                        value: Vector3.zero,
                    },
                    {
                        name: UniformNames.LightIntensity,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UniformNames.LightColor,
                        type: UniformTypes.Color,
                        value: Color.black,
                    },
                    {
                        name: UniformNames.ShadowMapProjectionMatrix,
                        type: UniformTypes.Matrix4,
                        value: Matrix4.identity,
                    },
                ],
            },
        ];
        this._globalUniformBufferObjects.push({
            uniformBufferObject: this._gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.DirectionalLight,
                directionalLightUniformBufferData
            ),
            data: directionalLightUniformBufferData,
        });

        const spotLightUniformBufferData = [
            {
                name: UniformNames.SpotLight,
                type: UniformTypes.StructArray,
                value: maton.range(MAX_SPOT_LIGHT_COUNT).map(() => [
                    {
                        name: UniformNames.LightColor,
                        type: UniformTypes.Color,
                        value: Color.black,
                    },
                    {
                        name: UniformNames.LightPosition,
                        type: UniformTypes.Vector3,
                        value: Vector3.zero,
                    },
                    {
                        name: UniformNames.LightDirection,
                        type: UniformTypes.Vector3,
                        value: Vector3.zero,
                    },
                    {
                        name: UniformNames.LightIntensity,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UniformNames.LightDistance,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UniformNames.LightAttenuation,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UniformNames.LightConeCos,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UniformNames.LightPenumbraCos,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UniformNames.ShadowMapProjectionMatrix,
                        type: UniformTypes.Matrix4,
                        value: Matrix4.identity,
                    },
                ]),
            },
        ];
        this._globalUniformBufferObjects.push({
            uniformBufferObject: this._gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.SpotLight,
                spotLightUniformBufferData
            ),
            data: spotLightUniformBufferData,
        });

        const pointLightUniformBufferData = [
            {
                name: UniformNames.PointLight,
                type: UniformTypes.StructArray,
                value: maton.range(MAX_POINT_LIGHT_COUNT).map(() => [
                    {
                        name: UniformNames.LightColor,
                        type: UniformTypes.Color,
                        value: Color.black,
                    },
                    {
                        name: UniformNames.LightPosition,
                        type: UniformTypes.Vector3,
                        value: Vector3.zero,
                    },
                    {
                        name: UniformNames.LightIntensity,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UniformNames.LightDistance,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UniformNames.LightAttenuation,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                ]),
            },
        ];
        this._globalUniformBufferObjects.push({
            uniformBufferObject: this._gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.PointLight,
                pointLightUniformBufferData
            ),
            data: pointLightUniformBufferData,
        });

        const timelineUniformBufferData = [
            {
                name: UniformNames.TimelineTime,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.TimelineDeltaTime,
                type: UniformTypes.Float,
                value: 0,
            },
        ];
        this._globalUniformBufferObjects.push({
            uniformBufferObject: this._gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.Timeline,
                timelineUniformBufferData
            ),
            data: timelineUniformBufferData,
        });

        const commonUniformBlockData = [
            {
                name: UniformNames.Time,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.DeltaTime,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.Viewport,
                type: UniformTypes.Vector4,
                value: Vector4.zero,
            },
        ];
        // TODO: 一番最初の要素としてpushするとなぜかエラーになる
        this._globalUniformBufferObjects.push({
            uniformBufferObject: this._gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.Common,
                commonUniformBlockData
            ),
            data: commonUniformBlockData,
        });

        // for debug
        console.log('===== global uniform buffer objects =====');
        console.log(this._globalUniformBufferObjects);
        console.log('=========================================');
    }

    // TODO: materialのstartの中でやりたい
    $checkNeedsBindUniformBufferObjectToMaterial(material: Material) {
        // mesh.materials.forEach((material) => {
        if (material.getBoundUniformBufferObjects()) {
            return;
        }
        material.setBoundUniformBufferObjects(true);
        // for debug
        material.getUniformBlockNames().forEach((blockName) => {
            const targetGlobalUniformBufferObject = this._globalUniformBufferObjects.find(
                ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
            );
            if (!targetGlobalUniformBufferObject) {
                return;
            }
            const blockIndex = this._gpu.bindUniformBlockAndGetBlockIndex(
                targetGlobalUniformBufferObject.uniformBufferObject,
                material.getShader()!,
                blockName
            );
            // // for debug
            // console.log(
            //     material.getName(),
            //     'addUniformBlock',
            //     material.getUniformBlockNames(),
            //     targetGlobalUniformBufferObject.data,
            //     blockIndex
            // );
            material.getUniforms().addUniformBlock(blockIndex, targetGlobalUniformBufferObject.uniformBufferObject, []);
        });
        // });
    }

    /**
     *
     * @param realWidth
     * @param realHeight
     */
    setSize(realWidth: number, realHeight: number) {
        const w = Math.floor(realWidth);
        const h = Math.floor(realHeight);
        this._realWidth = w;
        this._realHeight = h;
        this._canvas.width = w;
        this._canvas.height = h;

        this._gpu.setSize(0, 0, w, h);

        // render targets
        this._depthPrePassRenderTarget.setSize(w, h);
        this._gBufferRenderTargets.setSize(w, h);
        this._afterDeferredShadingRenderTarget.setSize(w, h);
        this._copyDepthSourceRenderTarget.setSize(w, h);
        this._copyDepthDestRenderTarget.setSize(w, h);
        // passes
        this._screenSpaceShadowPass.setSize(w, h);
        this._ambientOcclusionPass.setSize(w, h);
        this._deferredShadingPass.setSize(w, h);
        this._ssrPass.setSize(w, h);
        this._lightShaftPass.setSize(w, h);
        this._volumetricLightPass.setSize(w, h);
        this._fogPass.setSize(w, h);
        this._depthOfFieldPass.setSize(w, h);
        this._bloomPass.setSize(w, h);
        this._streakPass.setSize(w, h);
        this._toneMappingPass.setSize(w, h);
        this._chromaticAberrationPass.setSize(w, h);
        this._glitchPass.setSize(w, h);
        this._vignettePass.setSize(w, h);
        this._fxaaPass.setSize(w, h);
    }

    renderTarget: CameraRenderTargetType | null = null;
    clearColorDirtyFlag = false;

    /**
     *
     * @param renderTarget
     * @param clearColor
     * @param clearDepth
     */
    // TODO: 本当はclearcolorの色も渡せるとよい
    setRenderTarget(renderTarget: CameraRenderTargetType, clearColor: boolean = false, clearDepth: boolean = false) {
        if (renderTarget) {
            this.renderTarget = renderTarget;
            this._gpu.setFramebuffer(renderTarget.$getFramebuffer());
            this._gpu.setSize(0, 0, renderTarget.width, renderTarget.height);
        } else {
            this.renderTarget = null;
            this._gpu.setFramebuffer(null);
            this._gpu.setSize(0, 0, this._realWidth, this._realHeight);
        }
        if (clearColor) {
            this._gpu.clearColor(0, 0, 0, 0);
            this.clearColorDirtyFlag = true;
        } else {
            this.clearColorDirtyFlag = false;
        }
        if (clearDepth) {
            this._gpu.clearDepth(1, 1, 1, 1);
        }
    }

    flush() {
        this._gpu.flush();
    }

    clearColor(r: number, g: number, b: number, a: number) {
        this._gpu.clearColor(r, g, b, a);
    }

    clearDepth(r: number, g: number, b: number, a: number) {
        this._gpu.clearDepth(r, g, b, a);
    }

    beforeRender(time: number, deltaTime: number) {
        this.$updateCommonUniforms({ time, deltaTime });
    }

    /**
     *
     * @param scene
     * @param camera
     * @param time
     * @param deltaTime
     * @param onBeforePostProcess
     */
    // render(scene: Scene, cameras: Camera, {useShadowPass = true, clearScene = true}) {
    render(
        scene: Scene,
        camera: Camera,
        sharedTextures: SharedTextures,
        {
            time,
            onBeforePostProcess,
        }: {
            time: number;
            // timelineTime: number;
            // timelineDeltaTime: number;
            onBeforePostProcess?: () => void;
        }
    ) {
        // ------------------------------------------------------------------------------
        // transform feedback
        // ------------------------------------------------------------------------------

        // ------------------------------------------------------------------------------
        // common uniform block object
        // ------------------------------------------------------------------------------

        // ------------------------------------------------------------------------------
        // setup render mesh infos
        // TODO: depth sort
        // ------------------------------------------------------------------------------

        const renderMeshInfoEachQueue: RenderMeshInfoEachQueue = {
            [RenderQueueType.Skybox]: [],
            [RenderQueueType.Opaque]: [],
            [RenderQueueType.AlphaTest]: [],
            [RenderQueueType.Transparent]: [],
        };
        const lightActors: LightActors = {
            directionalLight: null,
            spotLights: [],
            pointLights: [],
        };

        let postProcessVolumeActor: PostProcessVolume | null = null;

        // build render mesh info each queue
        traverseScene(scene, (actor) => {
            switch (actor.type) {
                case ActorTypes.Skybox:
                    renderMeshInfoEachQueue[RenderQueueType.Skybox].push(
                        this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.Skybox)
                    );
                    // TODO: skyboxの中で処理したい
                    // actor.transform.parent = cameras.transform;
                    return;
                case ActorTypes.Mesh:
                case ActorTypes.SkinnedMesh:
                    if (!(actor as Mesh).renderEnabled) {
                        // skip
                        return;
                    }
                    (actor as Mesh).materials.forEach((material, i) => {
                        // if (!material.canRender) {
                        //     return;
                        // }
                        if (material.getAlphaTest()) {
                            renderMeshInfoEachQueue[RenderQueueType.AlphaTest].push(
                                this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.AlphaTest, i)
                            );
                            return;
                        }
                        switch (material.getBlendType()) {
                            case BlendTypes.Opaque:
                                renderMeshInfoEachQueue[RenderQueueType.Opaque].push(
                                    this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.Opaque, i)
                                );
                                return;
                            case BlendTypes.Transparent:
                            case BlendTypes.Additive:
                                renderMeshInfoEachQueue[RenderQueueType.Transparent].push(
                                    this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.Transparent, i)
                                );
                                return;
                            default:
                                console.error('[Renderer.render] invalid blend type');
                        }
                    });
                    break;

                case ActorTypes.Light:
                    if (actor.enabled) {
                        const light = actor as Light;
                        switch (light.lightType) {
                            case LightTypes.Directional:
                                lightActors.directionalLight = light;
                                break;
                            case LightTypes.Spot:
                                lightActors.spotLights.push(light as SpotLight);
                                break;
                            case LightTypes.Point:
                                lightActors.pointLights.push(light as PointLight);
                                break;
                        }
                    }
                    break;

                case ActorTypes.PostProcessVolume:
                    postProcessVolumeActor = actor as PostProcessVolume;
                    break;
            }
        });

        // sort by render queue
        const sortRenderQueueCompareFunc = (a: RenderMeshInfo, b: RenderMeshInfo) =>
            a.actor.materials[a.materialIndex].getRenderQueue() - b.actor.materials[b.materialIndex].getRenderQueue();

        // all mesh infos
        const sortedRenderMeshInfos: RenderMeshInfo[] = Object.keys(renderMeshInfoEachQueue)
            .map((key) => {
                const renderQueueType = key as RenderQueueType;
                const info = renderMeshInfoEachQueue[renderQueueType];
                return info.sort(sortRenderQueueCompareFunc);
            })
            .flat()
            .filter(({ actor }) => actor.enabled);

        // override postprocess parameters
        if (postProcessVolumeActor) {
            applyPostProcessVolumeParameters(this, postProcessVolumeActor);
        }

        //
        // TODO: depth sort
        //

        // skybox
        const sortedSkyboxRenderMeshInfos: RenderMeshInfo[] = sortedRenderMeshInfos.filter((renderMeshInfo) => {
            return renderMeshInfo.queue === RenderQueueType.Skybox;
        });

        // base pass mesh infos
        const sortedBasePassRenderMeshInfos: RenderMeshInfo[] = sortedRenderMeshInfos.filter((renderMeshInfo) => {
            return (
                renderMeshInfo.queue === RenderQueueType.Skybox ||
                renderMeshInfo.queue === RenderQueueType.Opaque ||
                renderMeshInfo.queue === RenderQueueType.AlphaTest
            );
        });
        sortedBasePassRenderMeshInfos.sort((a, b) => {
            const al = Vector3.subVectors(camera.transform.getPosition(), a.actor.transform.getPosition()).magnitude;
            const bl = Vector3.subVectors(camera.transform.getPosition(), b.actor.transform.getPosition()).magnitude;
            return al < bl ? -1 : 1;
        });

        // transparent mesh infos
        const sortedTransparentRenderMeshInfos: RenderMeshInfo[] = sortedRenderMeshInfos.filter(
            (renderMeshInfo) => renderMeshInfo.queue === RenderQueueType.Transparent
        );
        sortedTransparentRenderMeshInfos.sort((a, b) => {
            const al = Vector3.subVectors(camera.transform.getPosition(), a.actor.transform.getPosition()).magnitude;
            const bl = Vector3.subVectors(camera.transform.getPosition(), b.actor.transform.getPosition()).magnitude;
            return al > bl ? -1 : 1;
        });

        // ------------------------------------------------------------------------------
        // update common uniforms
        // ------------------------------------------------------------------------------

        // this.updateCommonUniforms({ time, deltaTime });
        // TODO: このままだと directional-light がなくなったときも directional-light が残ることになる
        if (lightActors.directionalLight) {
            this.$updateDirectionalLightUniforms(lightActors.directionalLight);
        }
        // TODO: このままだと spot-light がなくなったときも spot-light が残ることになる
        if (lightActors.spotLights.length > 0) {
            this.$updateSpotLightsUniforms(lightActors.spotLights);
        }
        // TODO: このままだと point-light がなくなったときも point-light が残ることになる
        if (lightActors.pointLights.length > 0) {
            this.$updatePointLightsUniforms(lightActors.pointLights);
        }

        // ------------------------------------------------------------------------------
        // depth pre-pass
        // ------------------------------------------------------------------------------

        const depthPrePassRenderMeshInfos = sortedBasePassRenderMeshInfos.filter(({ actor }) => {
            if (actor.type === ActorTypes.Skybox) {
                return false;
            }
            return actor;
        });
        depthPrePassRenderMeshInfos.sort((a, b) => {
            const al = Vector3.subVectors(camera.transform.getPosition(), a.actor.transform.getPosition()).magnitude;
            const bl = Vector3.subVectors(camera.transform.getPosition(), b.actor.transform.getPosition()).magnitude;
            return al < bl ? -1 : 1;
        });
        this.depthPrePass(depthPrePassRenderMeshInfos, camera);

        // ------------------------------------------------------------------------------
        // g-buffer opaque pass
        // ------------------------------------------------------------------------------

        this.scenePass(sortedBasePassRenderMeshInfos, camera);

        // ------------------------------------------------------------------------------
        // shadow pass
        // ------------------------------------------------------------------------------

        // cast shadow 用のライト管理は配列にしちゃう
        const castShadowLightActors: Light[] = [];
        if (lightActors.directionalLight) {
            castShadowLightActors.push(lightActors.directionalLight);
        }
        lightActors.spotLights.forEach((light) => {
            if (light.castShadow) {
                castShadowLightActors.push(light);
            }
        });

        if (castShadowLightActors.length > 0) {
            const castShadowRenderMeshInfos = sortedBasePassRenderMeshInfos.filter(({ actor }) => {
                if (actor.type === ActorTypes.Skybox) {
                    return false;
                }
                return actor.castShadow;
            });
            this.shadowPass(castShadowLightActors, castShadowRenderMeshInfos);
        }

        // ------------------------------------------------------------------------------
        // screen space shadow pass
        // ------------------------------------------------------------------------------

        const postProcessCamera = this._scenePostProcess.getPostProcessCamera();

        PostProcess.renderPass({
            pass: this._screenSpaceShadowPass,
            renderer: this,
            targetCamera: camera,
            gpu: this._gpu,
            camera: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: null,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });

        // ------------------------------------------------------------------------------
        // ambient occlusion pass
        // ------------------------------------------------------------------------------

        PostProcess.renderPass({
            pass: this._ambientOcclusionPass,
            renderer: this,
            targetCamera: camera,
            gpu: this._gpu,
            camera: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: null,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });

        // ------------------------------------------------------------------------------
        // deferred lighting pass
        // ------------------------------------------------------------------------------

        // update cubemap to deferred lighting pass
        // TODO: skyboxは一個だけ想定のいいはず
        sortedSkyboxRenderMeshInfos.forEach((skyboxRenderMeshInfo) => {
            const skyboxActor = skyboxRenderMeshInfo.actor as Skybox;
            this._deferredShadingPass.updateSkyboxUniforms(skyboxActor);
        });

        applyLightShadowMapUniformValues(this._deferredShadingPass.material, lightActors, this._gpu.dummyTextureBlack);

        // set sss texture
        setMaterialUniformValue(
            this._deferredShadingPass.material,
            'uScreenSpaceShadowTexture',
            this._screenSpaceShadowPass.renderTarget.read.$getTexture()
        );

        // set ao texture
        setMaterialUniformValue(
            this._deferredShadingPass.material,
            'uAmbientOcclusionTexture',
            this._ambientOcclusionPass.renderTarget.read.$getTexture()
        );

        PostProcess.renderPass({
            pass: this._deferredShadingPass,
            renderer: this,
            targetCamera: camera,
            gpu: this._gpu,
            camera: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: null,
            isLastPass: false,
            time, // TODO: engineから渡したい
            lightActors,
        });

        // ------------------------------------------------------------------------------
        // ssr pass
        // ------------------------------------------------------------------------------

        PostProcess.renderPass({
            pass: this._ssrPass,
            renderer: this,
            targetCamera: camera,
            gpu: this._gpu,
            camera: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: this._deferredShadingPass.renderTarget,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });

        // ------------------------------------------------------------------------------
        // light shaft pass
        // ------------------------------------------------------------------------------

        if (lightActors.directionalLight) {
            this._lightShaftPass.setDirectionalLight(lightActors.directionalLight);
            PostProcess.renderPass({
                pass: this._lightShaftPass,
                renderer: this,
                targetCamera: camera,
                gpu: this._gpu,
                camera: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
                prevRenderTarget: this._deferredShadingPass.renderTarget,
                isLastPass: false,
                time, // TODO: engineから渡したい
            });
        } else {
            // TODO: directional light ないときの対応。黒く塗りたい
        }

        // ------------------------------------------------------------------------------
        // volumetric light pass
        // ------------------------------------------------------------------------------

        this._volumetricLightPass.setSpotLights(lightActors.spotLights);
        if (lightActors.spotLights.length > 0) {
            PostProcess.renderPass({
                pass: this._volumetricLightPass,
                renderer: this,
                targetCamera: camera,
                gpu: this._gpu,
                camera: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
                prevRenderTarget: this._deferredShadingPass.renderTarget,
                isLastPass: false,
                time, // TODO: engineから渡したい
                // lightActors,
            });
        } else {
            // TODO: spot light ないときの対応。黒く塗りたい
        }
        // return;

        // ------------------------------------------------------------------------------
        // height fog pass
        // ------------------------------------------------------------------------------

        this._fogPass.setTextures(
            this._lightShaftPass.renderTarget.read.$getTexture()!,
            // CUSTOM
            //  this._gpu.dummyTextureBlack,
            //
            this._volumetricLightPass.renderTarget.read.$getTexture()!,
            this._screenSpaceShadowPass.renderTarget.read.$getTexture()!,
            sharedTextures[SharedTexturesTypes.FBM_NOISE].texture
        );

        PostProcess.renderPass({
            pass: this._fogPass,
            renderer: this,
            targetCamera: camera,
            gpu: this._gpu,
            camera: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            // prevRenderTarget: this._deferredShadingPass.renderTarget,
            prevRenderTarget: this._ssrPass.renderTarget,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });
        // return;

        // ------------------------------------------------------------------------------
        // transparent pass
        // ------------------------------------------------------------------------------

        // TODO: 直前のパスを明示的に指定する必要があるのはめんどうなのでうまいこと管理したい
        this._afterDeferredShadingRenderTarget.setTexture(this._fogPass.renderTarget.read.$getTexture()!);

        // pattern1: g-buffer depth
        // this._afterDeferredShadingRenderTarget.setDepthTexture(this._gBufferRenderTargets.depthTexture!);
        // pattern2: depth prepass
        this._afterDeferredShadingRenderTarget.setDepthTexture(this._depthPrePassRenderTarget.$getDepthTexture()!);

        this.copyDepthTexture();

        // TODO: set depth to transparent meshes
        sortedTransparentRenderMeshInfos.forEach((renderMeshInfo) => {
            setMaterialUniformValue(
                getMeshMaterial(renderMeshInfo.actor),
                UniformNames.DepthTexture,
                this._copyDepthDestRenderTarget.$getDepthTexture()
            );
        });

        this.setRenderTarget(this._afterDeferredShadingRenderTarget.write);

        this.$transparentPass(sortedTransparentRenderMeshInfos, camera, lightActors);

        // ------------------------------------------------------------------------------
        // full screen pass
        // TODO: mainCameraかつcameraにpostProcessがあるときの対応
        // ------------------------------------------------------------------------------

        if (onBeforePostProcess) {
            onBeforePostProcess();
        }

        if (!this._scenePostProcess.hasEnabledPass) {
            // 何もenabledがないのはおかしい. tonemappingは最低限有効化されていないとおかしい(HDRなので)
            console.error('invalid postprocess');
        }

        // console.log("--------- postprocess pass ---------");

        let prevRenderTarget: RenderTarget = this._afterDeferredShadingRenderTarget;
        const isCameraLastPassAndHasNotPostProcess = !camera.renderTarget && !hasEnabledPostProcessPass(camera);
        this._scenePostProcess.update();
        this._scenePostProcess.render({
            gpu: this._gpu,
            renderer: this,
            prevRenderTarget,
            gBufferRenderTargets: this._gBufferRenderTargets,
            targetCamera: camera,
            time, // TODO: engineから渡したい
            isCameraLastPass: isCameraLastPassAndHasNotPostProcess,
            // lightActors,
        });

        if (isCameraLastPassAndHasNotPostProcess) {
            return;
        }

        prevRenderTarget = this._scenePostProcess.lastRenderTarget!;

        if (hasEnabledPostProcessPass(camera)) {
            camera.postProcess?.update();
            camera.postProcess?.render({
                gpu: this._gpu,
                renderer: this,
                prevRenderTarget,
                // tone mapping 挟む場合
                // prevRenderTarget: this._toneMappingPass.renderTarget,
                gBufferRenderTargets: this._gBufferRenderTargets,
                targetCamera: camera,
                time, // TODO: engineから渡したい
                isCameraLastPass: !camera.renderTarget,
                lightActors,
            });
        }
    }

    /**
     *
     * @param geometry
     * @param material
     */
    renderMesh(geometry: Geometry, material: Material) {
        geometry.update();

        if (this._stats) {
            this._stats.addDrawVertexCount(geometry);
            this._stats.incrementDrawCall();
        }

        // console.log("===========")
        // console.log(`[Renderer.renderMesh] geometry`, geometry);
        // console.log(`[Renderer.renderMesh] mat: ${material.getName()}`, material.getShader());

        // vertex
        this._gpu.setVertexArrayObject(geometry.getVertexArrayObject());
        // material
        if (!material.getShader()) {
            // console.error('invalid material shader');
            return;
        }
        this._gpu.setShader(material.getShader()!); // TODO: ない場合を判定したい
        // uniforms
        this._gpu.setUniforms(material.getUniforms());

        // setup depth write (depth mask)
        let depthWrite;
        if (material.getDepthWrite() !== null) {
            depthWrite = material.getDepthWrite();
        } else {
            switch (material.getBlendType()) {
                case BlendTypes.Opaque:
                    depthWrite = true;
                    break;
                case BlendTypes.Transparent:
                case BlendTypes.Additive:
                    depthWrite = false;
                    break;
                default:
                    console.error('invalid depth write');
                    return;
            }
        }

        // setup depth test
        const depthTest = !!material.getDepthTest();

        // depth func type
        const depthFuncType = material.getDepthFuncType();

        // console.log(
        //     geometry.getDrawCount(),
        //     material.getPrimitiveType(),
        //     depthTest,
        //     depthWrite,
        //     depthFuncType,
        //     material.getBlendType(),
        //     material.getFaceSide(),
        //     geometry.getInstanceCount()
        // )
        
        // draw
        this._gpu.draw(
            geometry.getDrawCount(),
            material.getPrimitiveType(),
            depthTest,
            depthWrite,
            depthFuncType,
            material.getBlendType(),
            material.getFaceSide(),
            geometry.getInstanceCount()
        );
    }

    /**
     *
     * @param actor
     * @param materialIndex
     * @private
     */
    private buildRenderMeshInfo(actor: Mesh, queue: RenderQueueType, materialIndex: number = 0): RenderMeshInfo {
        return {
            actor,
            queue,
            materialIndex,
        };
    }

    // setUniformBlockData() {}

    /**
     * uniform block の変数を更新
     * @param blockName
     * @param uniformName
     * @param value
     * @private
     */
    $setUniformBlockValue(blockName: string, uniformName: string, value: UniformBufferObjectValue) {
        const targetGlobalUniformBufferObject = this._globalUniformBufferObjects.find(
            ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
        );
        if (!targetGlobalUniformBufferObject) {
            console.error(`[Renderer.setUniformBlockData] invalid uniform block object: ${blockName}`);
            return;
        }
        const targetUbo = targetGlobalUniformBufferObject.uniformBufferObject;

        const targetUniformData = targetGlobalUniformBufferObject.data.find((d) => {
            return d.name === uniformName;
        });

        if (!targetUniformData) {
            console.error(`[Renderer.setUniformBlockData] invalid uniform name: ${uniformName}`);
            return;
        }

        targetUbo.updateUniformValue(uniformName, targetUniformData.type, value);
    }

    private depthPrePass(depthPrePassRenderMeshInfos: RenderMeshInfo[], camera: Camera) {
        // console.log("--------- depth pre pass ---------");

        this.setRenderTarget(this._depthPrePassRenderTarget, false, true);
        this.updateCameraUniforms(camera);

        depthPrePassRenderMeshInfos.forEach(({ actor }) => {
            this.updateActorTransformUniforms(actor);

            actor.depthMaterials.forEach((depthMaterial, i) => {
                if (!depthMaterial) {
                    console.error('[Renderer.depthPrePass] invalid depth material');
                    return;
                }

                if (!depthMaterial.getCanRender()) {
                    return;
                }

                if (actor.materials[i].getSkipDepthPrePass()) {
                    return;
                }

                this.renderMesh(actor.geometry, depthMaterial);

                if (this._stats) {
                    this._stats.addPassInfo('depth pre pass', actor.name, actor.geometry);
                }
            });
        });
    }

    private copyDepthTexture() {
        this._copyDepthSourceRenderTarget.setDepthTexture(this._depthPrePassRenderTarget.$getDepthTexture()!);
        RenderTarget.blitDepth({
            gpu: this._gpu,
            sourceRenderTarget: this._copyDepthSourceRenderTarget,
            destRenderTarget: this._copyDepthDestRenderTarget,
            width: this._realWidth,
            height: this._realHeight,
        });
    }

    private shadowPass(castShadowLightActors: Light[], castShadowRenderMeshInfos: RenderMeshInfo[]) {
        // console.log("--------- shadow pass ---------");

        castShadowLightActors.forEach((lightActor) => {
            if (!lightActor.shadowMap) {
                console.error('invalid shadow pass');
                return;
            }
            if (!lightActor.shadowCamera) {
                console.error('invalid shadow cameras');
                return;
            }
            this.setRenderTarget(lightActor.shadowMap.write, false, true);
            // this.clear(0, 0, 0, 1);
            // this._gpu.clearDepth(0, 0, 0, 1);

            if (castShadowRenderMeshInfos.length < 1) {
                return;
            }

            this.updateCameraUniforms(lightActor.shadowCamera);

            castShadowRenderMeshInfos.forEach(({ actor }) => {
                // TODO: material 側でやった方がよい？
                this.updateActorTransformUniforms(actor);

                updateMeshDepthMaterial(actor, { camera: lightActor.shadowCamera! });

                actor.depthMaterials.forEach((depthMaterial) => {
                    // TODO: material 側でやった方がよい？
                    if (!depthMaterial) {
                        console.error('invalid target material');
                        return;
                    }

                    if (!depthMaterial.getCanRender()) {
                        return;
                    }

                    setMaterialUniformValue(
                        depthMaterial,
                        UniformNames.DepthTexture,
                        this._copyDepthDestRenderTarget.$getDepthTexture()
                    );

                    this.renderMesh(actor.geometry, depthMaterial);
                    if (this._stats) {
                        this._stats.addPassInfo('shadow pass', actor.name, actor.geometry);
                    }
                });
            });
        });
    }

    private scenePass(sortedRenderMeshInfos: RenderMeshInfo[], camera: Camera) {
        // console.log("--------- scene pass ---------");

        // NOTE: DepthTextureはあるはず
        this._gBufferRenderTargets.setDepthTexture(this._depthPrePassRenderTarget.$getDepthTexture()!);

        this.setRenderTarget(this._gBufferRenderTargets.write, true);

        // TODO: depth prepass しない場合は必要
        // if (clear) {
        //     this.clear(cameras.clearColor.x, cameras.clearColor.y, cameras.clearColor.z, cameras.clearColor.w);
        // }

        this.updateCameraUniforms(camera);

        sortedRenderMeshInfos.forEach(({ actor, materialIndex }) => {
            switch (actor.type) {
                case ActorTypes.Skybox:
                    if (!(actor as Skybox).renderMesh) {
                        return;
                    }
                    // TODO: skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
                    // TODO: engineでやるべき
                    updateActorTransform(actor, camera);
                    break;
            }

            const targetMaterial = actor.materials[materialIndex];

            if (!targetMaterial.getCanRender()) {
                return;
            }

            // pre-passしてないmaterialの場合はdepthをcopy.
            // pre-passしてないmaterialが存在する度にdepthをcopyする必要があるので、使用は最小限にとどめる（raymarch以外では使わないなど）
            if (targetMaterial.getSkipDepthPrePass()) {
                this.setRenderTarget(null, false, false);
                this.copyDepthTexture();
                this.setRenderTarget(this._gBufferRenderTargets.write, false, false);
            }

            // TODO: material 側でやった方がよい？
            this.updateActorTransformUniforms(actor);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            setMaterialUniformValue(
                targetMaterial,
                UniformNames.DepthTexture,
                this._copyDepthDestRenderTarget.$getDepthTexture()
            );

            // TODO:
            // - light actor の中で lightの種類別に処理を分ける
            // - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意
            // lightActors.forEach((light) => {
            //     light.applyUniformsValues(targetMaterial);
            // });
            // TODO: g-bufferの時にはlightのuniformsを設定しなくて大丈夫になったのでいらないはず
            // applyLightShadowMapUniformValues(targetMaterial, lightActors);

            updateMeshMaterial(actor, { camera });

            this.renderMesh(actor.geometry, targetMaterial);

            if (this._stats) {
                this._stats.addPassInfo('scene pass', actor.name, actor.geometry);
            }
        });
    }

    updateActorTransformUniforms(actor: Actor) {
        this.$setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.WorldMatrix,
            actor.transform.getWorldMatrix()
        );
        this.$setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.InverseWorldMatrix,
            actor.transform.getInverseWorldMatrix()
        );
        this.$setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.NormalMatrix,
            actor.transform.getNormalMatrix()
        );
    }

    updateCameraUniforms(camera: Camera) {
        this.$setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.ViewMatrix, camera.viewMatrix);
        this.$setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.ProjectionMatrix,
            camera.projectionMatrix
        );
        this.$setUniformBlockValue(
            UniformBlockNames.Camera,
            UniformNames.ViewPosition,
            camera.transform.getWorldMatrix().position
        );
        this.$setUniformBlockValue(UniformBlockNames.Camera, UniformNames.ViewDirection, getCameraForward(camera));
        this.$setUniformBlockValue(UniformBlockNames.Camera, UniformNames.CameraNear, camera.near);
        this.$setUniformBlockValue(UniformBlockNames.Camera, UniformNames.CameraFar, camera.far);
        this.$setUniformBlockValue(
            UniformBlockNames.Camera,
            UniformNames.CameraAspect,
            isPerspectiveCamera(camera) ? (camera as PerspectiveCamera).aspect : (camera as OrthographicCamera).aspect
        );
        this.$setUniformBlockValue(
            UniformBlockNames.Camera,
            UniformNames.CameraFov,
            isPerspectiveCamera(camera) ? (camera as PerspectiveCamera).fov : 0
        );
        this.$setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.ViewProjectionMatrix,
            camera.viewProjectionMatrix
        );
        this.$setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.InverseViewMatrix,
            camera.inverseViewMatrix
        );
        this.$setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.InverseProjectionMatrix,
            camera.inverseProjectionMatrix
        );
        this.$setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.InverseViewProjectionMatrix,
            camera.inverseViewProjectionMatrix
        );
        this.$setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.TransposeInverseViewMatrix,
            camera.viewMatrix.clone().invert().transpose()
        );
    }

    $updateUniformBlockValue(
        blockName: string,
        uniformName: string,
        value: UniformBufferObjectValue,
        showLog: boolean = false
    ) {
        const targetGlobalUniformBufferObject = this._globalUniformBufferObjects.find(
            ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
        );
        if (!targetGlobalUniformBufferObject) {
            console.error(`[Renderer.setUniformBlockData] invalid uniform block object: ${blockName}`);
            return;
        }

        const targetUbo = targetGlobalUniformBufferObject.uniformBufferObject;

        const targetUniformData = targetGlobalUniformBufferObject.data.find((d) => {
            return d.name === uniformName;
        });

        if (!targetUniformData) {
            console.error(`[Renderer.setUniformBlockData] invalid uniform name: ${uniformName}`);
            return;
        }

        const getStructElementValue = (type: UniformTypes, value: UniformBufferObjectValue) => {
            const data: number[] = [];
            switch (type) {
                case UniformTypes.Float:
                case UniformTypes.Int:
                    data.push(value as number);
                    data.push(0);
                    data.push(0);
                    data.push(0);
                    break;
                case UniformTypes.Bool:
                    data.push((value as boolean) ? 1 : 0);
                    data.push(0);
                    data.push(0);
                    data.push(0);
                    break;
                case UniformTypes.Vector2:
                    data.push(...(value as Vector2).e);
                    data.push(0);
                    break;
                case UniformTypes.Vector3:
                    data.push(...(value as Vector3).e);
                    data.push(0);
                    break;
                case UniformTypes.Vector4:
                    data.push(...(value as Vector4).e);
                    break;
                case UniformTypes.Matrix4:
                    data.push(...(value as Matrix4).e);
                    break;
                case UniformTypes.Color:
                    data.push(...(value as Color).e);
                    break;
                default:
                    console.error(`invalid uniform type: ${type}`);
            }
            return data;
        };

        switch (targetUniformData.type) {
            // TODO: update struct
            case UniformTypes.Struct:
                (value as unknown as UniformBufferObjectStructValue).forEach((v) => {
                    const structElementName = `${uniformName}.${v.name}`;
                    const data: number[] = getStructElementValue(v.type, v.value);
                    targetUbo.updateBufferData(structElementName, new Float32Array(data));
                });
                break;
            case UniformTypes.StructArray:
                (value as UniformBufferObjectStructArrayValue).forEach((v, i) => {
                    v.forEach((vv) => {
                        const structElementName = `${uniformName}[${i}].${vv.name}`;
                        const data: number[] = getStructElementValue(vv.type, vv.value);
                        if (showLog) {
                            // console.log(structElementName, data);
                        }
                        targetUbo.updateBufferData(structElementName, new Float32Array(data), showLog);
                    });
                });
                break;
            default:
                if (Array.isArray(value)) {
                    const data: number[] = [];
                    (value as UniformBufferObjectElementValueArray).forEach((v) => {
                        if (typeof v === 'number') {
                            data.push(v);
                            data.push(0);
                            data.push(0);
                            data.push(0);
                        } else if (typeof v === 'boolean') {
                            data.push(v ? 1 : 0);
                            data.push(0);
                            data.push(0);
                            data.push(0);
                        } else {
                            data.push(...(v as UniformBufferObjectElementValueNoNeedsPadding).e);
                        }
                    });
                    targetUbo.updateBufferData(uniformName, new Float32Array(data));
                } else {
                    targetUbo.updateBufferData(
                        uniformName,
                        typeof value === 'number'
                            ? new Float32Array([value])
                            : (value as Vector2 | Vector3 | Vector4 | Matrix4 | Color).e
                    );
                }
                break;
        }
    }

    $updateCommonUniforms({ time, deltaTime }: { time: number; deltaTime: number }) {
        // passMaterial.uniforms.setValue(UniformNames.Time, time);
        this.$updateUniformBlockValue(UniformBlockNames.Common, UniformNames.Time, time);
        this.$updateUniformBlockValue(UniformBlockNames.Common, UniformNames.DeltaTime, deltaTime);
        this.$updateUniformBlockValue(
            UniformBlockNames.Common,
            UniformNames.Viewport,
            new Vector4(this._realWidth, this._realHeight, this._realWidth / this._realHeight, 0)
        );
    }

    updateTimelineUniforms(timelineTime: number, timelineDeltaTime: number) {
        // passMaterial.uniforms.setValue(UniformNames.Time, time);
        this.$updateUniformBlockValue(UniformBlockNames.Timeline, UniformNames.TimelineTime, timelineTime);
        this.$updateUniformBlockValue(UniformBlockNames.Timeline, UniformNames.TimelineDeltaTime, timelineDeltaTime);
    }

    $updateDirectionalLightUniforms(directionalLight: DirectionalLight) {
        this.$updateUniformBlockValue(UniformBlockNames.DirectionalLight, UniformNames.DirectionalLight, [
            {
                name: UniformNames.LightDirection,
                type: UniformTypes.Vector3,
                // pattern3: normalizeし、光源の位置から降り注ぐとみなす
                value: directionalLight.transform.getPosition().clone().negate().normalize(),
            },
            {
                name: UniformNames.LightIntensity,
                type: UniformTypes.Float,
                value: directionalLight.intensity,
            },
            {
                name: UniformNames.LightColor,
                type: UniformTypes.Color,
                value: directionalLight.color,
            },
            {
                // name: UniformNames.LightViewProjectionMatrix,
                name: UniformNames.ShadowMapProjectionMatrix,
                type: UniformTypes.Matrix4,
                value: directionalLight.shadowMapProjectionMatrix,
            },
        ]);
    }

    $updateSpotLightsUniforms(spotLights: SpotLight[]) {
        this.$updateUniformBlockValue(
            UniformBlockNames.SpotLight,
            UniformNames.SpotLight,
            spotLights.map((spotLight) => {
                return [
                    {
                        name: UniformNames.LightColor,
                        type: UniformTypes.Color,
                        value: spotLight.color,
                    },
                    {
                        name: UniformNames.LightPosition,
                        type: UniformTypes.Vector3,
                        value: spotLight.transform.getPosition(),
                    },
                    {
                        name: UniformNames.LightDirection,
                        type: UniformTypes.Vector3,
                        value: spotLight.transform.getWorldForward().clone(),
                    },
                    {
                        name: UniformNames.LightIntensity,
                        type: UniformTypes.Float,
                        value: spotLight.intensity,
                    },
                    {
                        name: UniformNames.LightDistance,
                        type: UniformTypes.Float,
                        value: spotLight.distance,
                    },
                    {
                        name: UniformNames.LightAttenuation,
                        type: UniformTypes.Float,
                        value: spotLight.attenuation,
                    },
                    {
                        name: UniformNames.LightConeCos,
                        type: UniformTypes.Float,
                        value: getSpotLightConeCos(spotLight),
                    },
                    {
                        name: UniformNames.LightPenumbraCos,
                        type: UniformTypes.Float,
                        value: getSpotLightPenumbraCos(spotLight),
                    },
                    {
                        name: UniformNames.ShadowMapProjectionMatrix,
                        type: UniformTypes.Matrix4,
                        value: spotLight.shadowMapProjectionMatrix,
                    },
                ];
            })
        );
    }

    $updatePointLightsUniforms(pointLights: PointLight[]) {
        this.$updateUniformBlockValue(
            UniformBlockNames.PointLight,
            UniformNames.PointLight,
            pointLights.map((pointLight) => {
                return [
                    {
                        name: UniformNames.LightColor,
                        type: UniformTypes.Color,
                        value: pointLight.color,
                    },
                    {
                        name: UniformNames.LightPosition,
                        type: UniformTypes.Vector3,
                        value: pointLight.transform.getPosition(),
                    },
                    {
                        name: UniformNames.LightIntensity,
                        type: UniformTypes.Float,
                        value: pointLight.intensity,
                    },
                    {
                        name: UniformNames.LightDistance,
                        type: UniformTypes.Float,
                        value: pointLight.distance,
                    },
                    {
                        name: UniformNames.LightAttenuation,
                        type: UniformTypes.Float,
                        value: pointLight.attenuation,
                    },
                ];
            }),
            true
        );
    }

    $transparentPass(
        sortedRenderMeshInfos: RenderMeshInfo[],
        camera: Camera,
        lightActors: LightActors
        // clear: boolean
    ) {
        // console.log("--------- transparent pass ---------");

        // TODO: 常にclearしない、で良い気がする
        // if (clear) {
        //     this._gpu.clear(cameras.clearColor.x, cameras.clearColor.y, cameras.clearColor.z, cameras.clearColor.w);
        // }
        this.updateCameraUniforms(camera);

        sortedRenderMeshInfos.forEach(({ actor, materialIndex }) => {
            const targetMaterial = actor.materials[materialIndex];
            this.updateActorTransformUniforms(actor);

            // TODO:
            // - light actor の中で lightの種類別に処理を分ける
            // - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意
            // - opaqueと共通処理なのでまとめたい
            // lightActors.forEach((light) => {
            //     light.applyUniformsValues(targetMaterial);
            // });
            // TODO: transparentで必要？使わないことを強制してもいい気がする
            applyLightShadowMapUniformValues(targetMaterial, lightActors, this._gpu.dummyTextureBlack);

            this.renderMesh(actor.geometry, targetMaterial);

            if (this._stats) {
                this._stats.addPassInfo('transparent pass', actor.name, actor.geometry);
            }
        });
    }
}
