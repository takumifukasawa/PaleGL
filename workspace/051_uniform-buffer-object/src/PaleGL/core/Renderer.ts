import {
    ActorTypes,
    BlendTypes,
    LightTypes,
    MAX_SPOT_LIGHT_COUNT,
    RenderQueueType,
    RenderTargetTypes, TextureDepthPrecisionType,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import { Stats } from '@/PaleGL/utilities/Stats';
import { Light } from '@/PaleGL/actors/Light';
import { Mesh } from '@/PaleGL/actors/Mesh';
import { Scene } from '@/PaleGL/core/Scene';
import { Camera, CameraRenderTargetType } from '@/PaleGL/actors/Camera';
import { Material } from '@/PaleGL/materials/Material';
import { Geometry } from '@/PaleGL/geometries/Geometry';
import { PostProcess } from '@/PaleGL/postprocess/PostProcess';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets';
// import {PostProcessPassBase} from "@/PaleGL/postprocess/PostProcessPassBase";
// import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass';
import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
// import {Skybox} from "@/PaleGL/actors/Skybox";
// import {GBufferRenderTargets} from "@/PaleGL/core/GBufferRenderTargets";
// import {RenderTarget} from "@/PaleGL/core/RenderTarget";
// import deferredShadingFragmentShader from '@/PaleGL/shaders/deferred-shading-fragment.glsl';
// import { Vector3 } from '@/PaleGL/math/Vector3';
// import { Color } from '@/PaleGL/math/Color';
import { Skybox } from '@/PaleGL/actors/Skybox';
import { DeferredShadingPass } from '@/PaleGL/postprocess/DeferredShadingPass';
// import { CubeMap } from '@/PaleGL/core/CubeMap';
import { SSAOPass } from '@/PaleGL/postprocess/SSAOPass';
import { SSRPass } from '@/PaleGL/postprocess/SSRPass';
import { ToneMappingPass } from '@/PaleGL/postprocess/ToneMappingPass';
import { BloomPass } from '@/PaleGL/postprocess/BloomPass';
import { DepthOfFieldPass } from '@/PaleGL/postprocess/DepthOfFieldPass';
import { LightShaftPass } from '@/PaleGL/postprocess/LightShaftPass.ts';
import { VolumetricLightPass } from '@/PaleGL/postprocess/VolumetricLightPass.ts';
import { FogPass } from '@/PaleGL/postprocess/FogPass.ts';
import { DirectionalLight } from '@/PaleGL/actors/DirectionalLight.ts';
import { SpotLight } from '@/PaleGL/actors/SpotLight.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { Shader } from '@/PaleGL/core/Shader.ts';
import globalUniformBufferObjectVertexShader from '@/PaleGL/shaders/global-uniform-buffer-object-vertex.glsl';
import globalUniformBufferObjectFragmentShader from '@/PaleGL/shaders/global-uniform-buffer-object-fragment.glsl';
import { UniformBufferObject } from '@/PaleGL/core/UniformBufferObject.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import {
    UniformBufferObjectBlockData,
    UniformBufferObjectElementValueArray,
    UniformBufferObjectElementValueNoNeedsPadding,
    UniformBufferObjectStructArrayValue,
    UniformBufferObjectStructValue,
    UniformBufferObjectValue,
    // Uniforms,
    // UniformStructValue,
} from '@/PaleGL/core/Uniforms.ts';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import {ChromaticAberrationPass} from "@/PaleGL/postprocess/ChromaticAberrationPass.ts";
import {VignettePass} from "@/PaleGL/postprocess/VignettePass.ts";
import {StreakPass} from "@/PaleGL/postprocess/StreakPass.ts";

type RenderMeshInfo = { actor: Mesh; materialIndex: number; queue: RenderQueueType };

type RenderMeshInfoEachQueue = {
    [key in RenderQueueType]: RenderMeshInfo[];
};

export type LightActors = {
    directionalLight: DirectionalLight | null;
    spotLights: SpotLight[];
};

// function applyShadowUniformValues(targetMaterial: Material, light: Light) {
//     // TODO: これはlightごとに共通化できる気がするかつ、分岐が甘い気がする（postprocessで使いたかったりする. getterが必要か？
//     if (
//         // targetMaterial.uniforms[UniformNames.ShadowMapProjectionMatrix] &&
//         light.shadowCamera &&
//         light.shadowMap
//     ) {
//         // console.log(light, light.shadowCamera, light.shadowMap)
//         // clip coord (-1 ~ 1) to uv (0 ~ 1)
//         // prettier-ignore
//         const textureMatrix = new Matrix4(
//             0.5, 0, 0, 0.5,
//             0, 0.5, 0, 0.5,
//             0, 0, 0.5, 0.5,
//             0, 0, 0, 1
//         );
//         light.shadowMapProjectionMatrix = Matrix4.multiplyMatrices(
//             textureMatrix,
//             light.shadowCamera.projectionMatrix.clone(),
//             light.shadowCamera.viewMatrix.clone()
//         );
//         targetMaterial.uniforms.setValue(UniformNames.ShadowMap, light.shadowMap.read.depthTexture);
//         // targetMaterial.uniforms.setValue(UniformNames.ShadowMapProjectionMatrix, light.shadowMapProjectionMatrix);
//         targetMaterial.uniforms.setValue(
//             UniformNames.LightViewProjectionMatrix,
//             Matrix4.multiplyMatrices(
//                 // textureMatrix,
//                 light.shadowCamera.projectionMatrix.clone(),
//                 light.shadowCamera.viewMatrix.clone()
//             )
//         );
//     }
// }

// TODO: shadow 用のuniform設定も一緒にされちゃうので出し分けたい
// TODO: 渡す uniform の値、キャッシュできる気がする
export function applyLightShadowMapUniformValues(targetMaterial: Material, lightActors: LightActors) {
    if (lightActors.directionalLight) {
        // targetMaterial.uniforms.setValue(UniformNames.DirectionalLight, [
        //     {
        //         name: UniformNames.LightDirection,
        //         type: UniformTypes.Vector3,
        //         // pattern1: そのまま渡す
        //         // value: light.transform.position,
        //         // pattern2: normalizeしてから渡す
        //         // value: lightActors.directionalLight.transform.position.clone().normalize(),
        //         // pattern3: normalizeし、光源の位置から降り注ぐとみなす
        //         value: lightActors.directionalLight.transform.position.clone().negate().normalize(),
        //     },
        //     {
        //         name: UniformNames.LightIntensity,
        //         type: UniformTypes.Float,
        //         value: lightActors.directionalLight.intensity,
        //     },
        //     {
        //         name: UniformNames.LightColor,
        //         type: UniformTypes.Color,
        //         value: lightActors.directionalLight.color,
        //     },
        //     ...(lightActors.directionalLight.shadowMap && lightActors.directionalLight.shadowCamera
        //         ? [
        //               {
        //                   name: UniformNames.LightViewProjectionMatrix,
        //                   type: UniformTypes.Matrix4,
        //                   // prettier-ignore
        //                   value: Matrix4.multiplyMatrices(
        //                     new Matrix4(
        //                         0.5, 0, 0, 0.5,
        //                         0, 0.5, 0, 0.5,
        //                         0, 0, 0.5, 0.5,
        //                         0, 0, 0, 1
        //                     ),
        //                     lightActors.directionalLight.shadowCamera.projectionMatrix.clone(),
        //                     lightActors.directionalLight.shadowCamera.viewMatrix.clone()
        //                 ),
        //               },
        //           ]
        //         : []),
        // ]);

        // applyShadowUniformValues(targetMaterial, lightActors.directionalLight);
        if (lightActors.directionalLight.shadowMap) {
            targetMaterial.uniforms.setValue(
                UniformNames.DirectionalLightShadowMap,
                lightActors.directionalLight.shadowMap.read.depthTexture
            );
        }
    }

    // targetMaterial.uniforms.setValue(
    //     UniformNames.SpotLight,
    //     lightActors.spotLights.map((spotLight) => [
    //         {
    //             name: UniformNames.LightPosition,
    //             type: UniformTypes.Vector3,
    //             value: spotLight.transform.position,
    //         },
    //         {
    //             name: UniformNames.LightDirection,
    //             type: UniformTypes.Vector3,
    //             value: spotLight.transform.worldForward.clone(),
    //         },
    //         {
    //             name: UniformNames.LightIntensity,
    //             type: UniformTypes.Float,
    //             value: spotLight.intensity,
    //         },
    //         {
    //             name: UniformNames.LightColor,
    //             type: UniformTypes.Color,
    //             value: spotLight.color,
    //         },
    //         {
    //             name: UniformNames.LightDistance,
    //             type: UniformTypes.Float,
    //             value: spotLight.distance,
    //         },
    //         {
    //             name: UniformNames.LightAttenuation,
    //             type: UniformTypes.Float,
    //             value: spotLight.attenuation,
    //         },
    //         {
    //             name: UniformNames.LightConeCos,
    //             type: UniformTypes.Float,
    //             value: spotLight.coneCos,
    //         },
    //         {
    //             name: UniformNames.LightPenumbraCos,
    //             type: UniformTypes.Float,
    //             value: spotLight.penumbraCos,
    //         },
    //         ...(spotLight.shadowMap && spotLight.shadowCamera
    //             ? [
    //                   {
    //                       name: UniformNames.ShadowMap,
    //                       type: UniformTypes.Texture,
    //                       value: spotLight.shadowMap.read.depthTexture,
    //                   },
    //                   {
    //                       name: UniformNames.LightViewProjectionMatrix,
    //                       type: UniformTypes.Matrix4,
    //                       value: Matrix4.multiplyMatrices(
    //                           new Matrix4(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1),
    //                           spotLight.shadowCamera.projectionMatrix.clone(),
    //                           spotLight.shadowCamera.viewMatrix.clone()
    //                       ),
    //                   },
    //               ]
    //             : []),
    //     ])
    // );

    targetMaterial.uniforms.setValue(
        UniformNames.SpotLightShadowMap,
        lightActors.spotLights.map((spotLight) => (spotLight.shadowMap ? spotLight.shadowMap.read.depthTexture : null))
    );

    // TODO: 正しい個数渡す
    // lightActors.spotLights.forEach((spotLight) => {
    //     applyShadowUniformValues(targetMaterial, spotLight);
    // });
    // applyShadowUniformValues(targetMaterial, lightActors.spotLights[0]);
}

/**
 * 描画パイプライン的な役割
 * TODO: pass
 * - depth pre-pass
 * - g-buffer pass (color, normal, material info)
 * - ao pass
 * - shading pass
 * - post process pass
 * TODO:
 * - depth prepass 使わない場合。offscreen する時とか
 * TODO:
 * - offscreen rendering
 */
export class Renderer {
    // --------------------------------------------------------------
    // constructor
    // --------------------------------------------------------------
    
    /**
     *
     * @param gpu
     * @param canvas
     * @param pixelRatio
     */
    constructor({ gpu, canvas, pixelRatio = 1.5 }: { gpu: GPU; canvas: HTMLCanvasElement; pixelRatio: number }) {
        this.gpu = gpu;
        this.canvas = canvas;
        this.pixelRatio = pixelRatio;
        this._scenePostProcess = new PostProcess(this.screenQuadCamera);
        this._depthPrePassRenderTarget = new RenderTarget({
            gpu,
            type: RenderTargetTypes.Depth,
            width: 1,
            height: 1,
            name: 'depth pre-pass render target',
            depthPrecision: TextureDepthPrecisionType.High // 低精度だとマッハバンドのような見た目になるので高精度にしておく
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
            depthPrecision: TextureDepthPrecisionType.High // 低精度だとマッハバンドのような見た目になるので高精度にしておく
        });
        this._copyDepthDestRenderTarget = new RenderTarget({
            gpu,
            type: RenderTargetTypes.Depth,
            width: 1,
            height: 1,
            name: 'copy depth dest render target',
            depthPrecision: TextureDepthPrecisionType.High // 低精度だとマッハバンドのような見た目になるので高精度にしておく
        });

        this._ambientOcclusionPass = new SSAOPass({ gpu });
        this._deferredShadingPass = new DeferredShadingPass({ gpu });
        this._ssrPass = new SSRPass({ gpu });
        this._lightShaftPass = new LightShaftPass({ gpu });
        this._volumetricLightPass = new VolumetricLightPass({ gpu });
        this._fogPass = new FogPass({ gpu });

        this._depthOfFieldPass = new DepthOfFieldPass({ gpu });
        // this._depthOfFieldPass.enabled = false;
        this._scenePostProcess.addPass(this._depthOfFieldPass);

        this._bloomPass = new BloomPass({
            gpu,
        });
        // this._bloomPass.enabled = false;
        this._scenePostProcess.addPass(this._bloomPass);

        this._streakPass = new StreakPass({ gpu });
        this._scenePostProcess.addPass(this._streakPass);

        this._toneMappingPass = new ToneMappingPass({ gpu });
        this._scenePostProcess.addPass(this._toneMappingPass);
        
        this._chromaticAberrationPass = new ChromaticAberrationPass({ gpu });
        this._scenePostProcess.addPass(this._chromaticAberrationPass);
        
        this._vignettePass = new VignettePass({ gpu });
        this._scenePostProcess.addPass(this._vignettePass);

        //
        // initialize global uniform buffer objects
        //

        const uniformBufferObjectShader = new Shader({
            gpu,
            vertexShader: globalUniformBufferObjectVertexShader,
            fragmentShader: globalUniformBufferObjectFragmentShader,
        });

        const tranformationsUniformBlockData = [
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
        this.globalUniformBufferObjects.push({
            uniformBufferObject: this.gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.Transformations,
                tranformationsUniformBlockData
            ),
            data: tranformationsUniformBlockData,
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
        this.globalUniformBufferObjects.push({
            uniformBufferObject: this.gpu.createUniformBufferObject(
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
        this.globalUniformBufferObjects.push({
            uniformBufferObject: this.gpu.createUniformBufferObject(
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
            // {
            //     name: UniformNames.SpotLightIntensity,
            //     type: UniformTypes.Float,
            //     value: 0,
            // },
            // {
            //     name: UniformNames.SpotLightColor,
            //     type: UniformTypes.Color,
            //     value: Color.black,
            // },
        ];
        this.globalUniformBufferObjects.push({
            uniformBufferObject: this.gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.SpotLight,
                spotLightUniformBufferData
            ),
            data: spotLightUniformBufferData,
        });

        const commonUniformBlockData = [
            {
                name: UniformNames.Time,
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
        this.globalUniformBufferObjects.push({
            uniformBufferObject: this.gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.Common,
                commonUniformBlockData
            ),
            data: commonUniformBlockData,
        });

        // for debug
        console.log('===== global uniform buffer objects =====');
        console.log(this.globalUniformBufferObjects);
        console.log('=========================================');
    }

    // registerUniformBufferObjectToMaterial(material: Material) {
    //     if (!material.shader) {
    //         return;
    //     }
    //     material.uniformBlockNames.forEach((blockName) => {
    //         const targetUniformBufferObject = this.globalUniformBufferObjects.find(
    //             (ubo) => ubo.blockName === blockName
    //         );
    //         if (!targetUniformBufferObject) {
    //             return;
    //         }
    //         const blockIndex = this.gpu.bindUniformBlockAndGetBlockIndex(
    //             targetUniformBufferObject,
    //             material.shader!,
    //             blockName,
    //         );
    //         // material.addUniformBufferObject(targetUniformBufferObject, blockIndex);
    //         material.uniforms.addUniformBlock(targetUniformBufferObject, blockIndex);
    //     });
    // }

    // TODO: materialのstartの中でやりたい
    checkNeedsBindUniformBufferObjectToMaterial(material: Material) {
        // mesh.materials.forEach((material) => {
        if (material.boundUniformBufferObjects) {
            return;
        }
        material.boundUniformBufferObjects = true;
        // for debug
        // console.log("[Renderer.checkNeedsBindUniformBufferObjectToMaterial]", material.name)
        material.uniformBlockNames.forEach((blockName) => {
            const targetGlobalUniformBufferObject = this.globalUniformBufferObjects.find(
                ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
            );
            if (!targetGlobalUniformBufferObject) {
                return;
            }
            const blockIndex = this.gpu.bindUniformBlockAndGetBlockIndex(
                targetGlobalUniformBufferObject.uniformBufferObject,
                material.shader!,
                blockName
            );
            // for debug
            // console.log(
            //     material.name,
            //     'addUniformBlock',
            //     material.uniformBlockNames,
            //     targetUniformBufferObject.blockName,
            //     blockIndex
            // );
            material.uniforms.addUniformBlock(blockIndex, targetGlobalUniformBufferObject.uniformBufferObject, []);
        });
        // });
    }

    // --------------------------------------------------------------
    // public
    // --------------------------------------------------------------

    canvas;
    pixelRatio;
    globalUniformBufferObjects: { uniformBufferObject: UniformBufferObject; data: UniformBufferObjectBlockData }[] = [];

    get depthPrePassRenderTarget() {
        return this._depthPrePassRenderTarget;
    }

    get gBufferRenderTargets() {
        return this._gBufferRenderTargets;
    }

    // get scenePostProcess() {
    //     return this._scenePostProcess;
    // }

    // get ambientOcclusionRenderTarget() {
    //     // return this._ambientOcclusionRenderTarget;
    //     return this._ambientOcclusionPass.renderTarget;
    // }

    // get deferredShadingPass() {
    //     return this._deferredShadingPass;
    // }

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

    // get toneMappingRenderTarget() {
    //     return this._toneMappingPass.renderTarget;
    // }
    
    get chromaticAberrationPass() {
        return this._chromaticAberrationPass;
    }
    
    get vignettePass() {
        return this._vignettePass;
    }
    
    /**
     *
     * @param stats
     */
    setStats(stats: Stats) {
        this.stats = stats;
    }

    /**
     *
     * @param realWidth
     * @param realHeight
     */
    setSize(realWidth: number, realHeight: number) {
        this.realWidth = realWidth;
        this.realHeight = realHeight;
        this.canvas.width = this.realWidth;
        this.canvas.height = this.realHeight;

        this.gpu.setSize(0, 0, this.realWidth, this.realHeight);

        // render targets
        this._depthPrePassRenderTarget.setSize(realWidth, realHeight);
        this._gBufferRenderTargets.setSize(realWidth, realHeight);
        this._afterDeferredShadingRenderTarget.setSize(realWidth, realHeight);
        this._copyDepthSourceRenderTarget.setSize(realWidth, realHeight);
        this._copyDepthDestRenderTarget.setSize(realWidth, realHeight);
        // passes
        this._ambientOcclusionPass.setSize(realWidth, realHeight);
        this._deferredShadingPass.setSize(realWidth, realHeight);
        this._ssrPass.setSize(realWidth, realHeight);
        this._lightShaftPass.setSize(realWidth, realHeight);
        this._volumetricLightPass.setSize(realWidth, realHeight);
        this._fogPass.setSize(realWidth, realHeight);
        this._depthOfFieldPass.setSize(realWidth, realHeight);
        this._bloomPass.setSize(realWidth, realHeight);
        this._streakPass.setSize(realWidth, realHeight);
        this._toneMappingPass.setSize(realWidth, realHeight);
        this._chromaticAberrationPass.setSize(realWidth, realHeight);
        this._vignettePass.setSize(realWidth, realHeight);
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
            this.gpu.setFramebuffer(renderTarget.framebuffer);
            this.gpu.setSize(0, 0, renderTarget.width, renderTarget.height);
        } else {
            this.renderTarget = null;
            this.gpu.setFramebuffer(null);
            this.gpu.setSize(0, 0, this.realWidth, this.realHeight);
        }
        if (clearColor) {
            this.gpu.clearColor(0, 0, 0, 0);
            this.clearColorDirtyFlag = true;
        } else {
            this.clearColorDirtyFlag = false;
        }
        if (clearDepth) {
            this.gpu.clearDepth(1, 1, 1, 1);
        }
    }

    /**
     *
     */
    flush() {
        this.gpu.flush();
    }

    /**
     *
     * @param r
     * @param g
     * @param b
     * @param a
     */
    // TODO: pass Color
    clearColor(r: number, g: number, b: number, a: number) {
        this.gpu.clearColor(r, g, b, a);
    }

    clearDepth(r: number, g: number, b: number, a: number) {
        this.gpu.clearDepth(r, g, b, a);
    }

    /**
     *
     * @param scene
     * @param camera
     * @param time
     * @param deltaTime
     * @param onBeforePostProcess
     */
    // render(scene: Scene, camera: Camera, {useShadowPass = true, clearScene = true}) {
    render(
        scene: Scene,
        camera: Camera,
        {
            time,
            onBeforePostProcess,
        }: {
            time: number;
            deltaTime?: number;
            onBeforePostProcess?: () => void;
        }
    ) {
        // ------------------------------------------------------------------------------
        // transform feedback
        // ------------------------------------------------------------------------------

        // ------------------------------------------------------------------------------
        // uniform block object
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
        // const lightActors: Light[] = [];
        const lightActors: LightActors = {
            directionalLight: null,
            spotLights: [],
        };

        // build render mesh info each queue
        scene.traverse((actor) => {
            switch (actor.type) {
                case ActorTypes.Skybox:
                    renderMeshInfoEachQueue[RenderQueueType.Skybox].push(
                        this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.Skybox)
                    );
                    // TODO: skyboxの中で処理したい
                    // actor.transform.parent = camera.transform;
                    return;
                case ActorTypes.Mesh:
                case ActorTypes.SkinnedMesh:
                    (actor as Mesh).materials.forEach((material, i) => {
                        if (material.alphaTest) {
                            renderMeshInfoEachQueue[RenderQueueType.AlphaTest].push(
                                this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.AlphaTest, i)
                            );
                            return;
                        }
                        switch (material.blendType) {
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
                                throw '[Renderer.render] invalid blend type';
                        }
                    });
                    break;

                case ActorTypes.Light:
                    if (actor.enabled) {
                        const light = actor as Light;
                        switch (light.lightType) {
                            case LightTypes.Directional:
                                lightActors.directionalLight = light as DirectionalLight;
                                break;
                            case LightTypes.Spot:
                                lightActors.spotLights.push(light as SpotLight);
                                break;
                        }
                    }
                    break;
            }
        });

        // sort by render queue
        const sortRenderQueueCompareFunc = (a: RenderMeshInfo, b: RenderMeshInfo) =>
            a.actor.materials[a.materialIndex].renderQueue - b.actor.materials[b.materialIndex].renderQueue;

        // all mesh infos
        const sortedRenderMeshInfos: RenderMeshInfo[] = Object.keys(renderMeshInfoEachQueue)
            .map((key) => {
                const renderQueueType = key as RenderQueueType;
                const info = renderMeshInfoEachQueue[renderQueueType];
                return info.sort(sortRenderQueueCompareFunc);
            })
            .flat()
            .filter(({ actor }) => actor.enabled);

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

        // transparent mesh infos
        const sortedTransparentRenderMeshInfos: RenderMeshInfo[] = sortedRenderMeshInfos.filter(
            (renderMeshInfo) => renderMeshInfo.queue === RenderQueueType.Transparent
        );

        // ------------------------------------------------------------------------------
        // update common uniforms
        // ------------------------------------------------------------------------------

        this.updateCommonUniforms({ time });
        if (lightActors.directionalLight) {
            this.updateDirectionalLightUniforms(lightActors.directionalLight);
        }
        if (lightActors.spotLights.length > 0) {
            this.updateSpotLightsUniforms(lightActors.spotLights);
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
        this.depthPrePass(depthPrePassRenderMeshInfos, camera);

        // ------------------------------------------------------------------------------
        // g-buffer opaque pass
        // ------------------------------------------------------------------------------

        // this.scenePass(sortedBasePassRenderMeshInfos, camera, lightActors);
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
        // ambient occlusion pass
        // ------------------------------------------------------------------------------

        PostProcess.renderPass({
            pass: this._ambientOcclusionPass,
            renderer: this,
            targetCamera: camera,
            gpu: this.gpu,
            camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: null,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });

        // return;

        // ------------------------------------------------------------------------------
        // deferred lighting pass
        // ------------------------------------------------------------------------------

        // update cubemap to deferred lighting pass
        // TODO: skyboxは一個だけ想定のいいはず
        sortedSkyboxRenderMeshInfos.forEach((skyboxRenderMeshInfo) => {
            const skyboxActor = skyboxRenderMeshInfo.actor as Skybox;
            // const cubeMap: CubeMap = skyboxActor.cubeMap;
            // this._deferredShadingPass.material.updateUniform('uEnvMap', cubeMap);
            this._deferredShadingPass.updateSkyboxUniforms(skyboxActor);
        });

        // update lights to deferred lighting pass
        // TODO: ここでライティングのパスが必要
        // TODO: - light actor の中で lightの種類別に処理を分ける
        // TODO: - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意
        // lightActors.forEach((light) => {
        //     const targetMaterial = this._deferredShadingPass.material;
        //     applyLightShadowMapUniformValues(targetMaterial, l)
        //     light.applyUniformsValues(targetMaterial);
        // });

        applyLightShadowMapUniformValues(this._deferredShadingPass.material, lightActors);

        // set ao texture
        this._deferredShadingPass.material.uniforms.setValue(
            'uAmbientOcclusionTexture',
            this._ambientOcclusionPass.renderTarget.read.texture
        );

        PostProcess.renderPass({
            pass: this._deferredShadingPass,
            renderer: this,
            targetCamera: camera,
            gpu: this.gpu,
            camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: null,
            isLastPass: false,
            time, // TODO: engineから渡したい
            lightActors,
        });
        // return;
        // console.log(this._deferredShadingPass.material.getUniform(UniformNames.InverseProjectionMatrix))

        // ------------------------------------------------------------------------------
        // ssr pass
        // ------------------------------------------------------------------------------

        PostProcess.renderPass({
            pass: this._ssrPass,
            renderer: this,
            targetCamera: camera,
            gpu: this.gpu,
            camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: this._deferredShadingPass.renderTarget,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });

        // ------------------------------------------------------------------------------
        // light shaft pass
        // ------------------------------------------------------------------------------

        // PostProcess.updatePassMaterial({
        //     pass: this._lightShaftPass,
        //     renderer: this,
        //     targetCamera: this._scenePostProcess.postProcessCamera,
        //     time,
        //     lightActors,
        // });

        // this._lightShaftPass.materials.forEach((mat) => {
        //     mat.updateUniform(
        //         UniformNames.DepthTexture,
        //         this._depthPrePassRenderTarget.depthTexture
        //         // this._copyDepthDestRenderTarget.depthTexture
        //     );
        // });

        // TODO: directional light がない場合の対応
        // const directionalLight = lightActors.find((light) => light.lightType === LightTypes.Directional) || null;
        if (lightActors.directionalLight) {
            this._lightShaftPass.setDirectionalLight(lightActors.directionalLight);
            PostProcess.renderPass({
                pass: this._lightShaftPass,
                renderer: this,
                targetCamera: camera,
                gpu: this.gpu,
                camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
                prevRenderTarget: this._deferredShadingPass.renderTarget,
                isLastPass: false,
                time, // TODO: engineから渡したい
                // lightActors,
            });
        } else {
            throw 'invalid directional light.';
        }

        // ------------------------------------------------------------------------------
        // volumetric light pass
        // ------------------------------------------------------------------------------

        this._volumetricLightPass.setSpotLights(lightActors.spotLights);
        // TODO: spot light ないときの対応
        PostProcess.renderPass({
            pass: this._volumetricLightPass,
            renderer: this,
            targetCamera: camera,
            gpu: this.gpu,
            camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: this._deferredShadingPass.renderTarget,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });
        
        // return;

        // ------------------------------------------------------------------------------
        // height fog pass
        // ------------------------------------------------------------------------------

        // PostProcess.updatePassMaterial({
        //     pass: this._fogPass,
        //     renderer: this,
        //     targetCamera: this._scenePostProcess.postProcessCamera,
        //     time,
        //     lightActors,
        // });

        this._fogPass.setLightShaftMap(this._lightShaftPass.renderTarget);
        this._fogPass.setVolumetricLightMap(this._volumetricLightPass.renderTarget);

        PostProcess.renderPass({
            pass: this._fogPass,
            renderer: this,
            targetCamera: camera,
            gpu: this.gpu,
            camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
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
        this._afterDeferredShadingRenderTarget.setTexture(this._fogPass.renderTarget.read.texture!);

        // pattern1: g-buffer depth
        // this._afterDeferredShadingRenderTarget.setDepthTexture(this._gBufferRenderTargets.depthTexture);
        // pattern2: depth prepass
        this._afterDeferredShadingRenderTarget.setDepthTexture(this._depthPrePassRenderTarget.depthTexture!);

        this.copyDepthTexture();

        // TODO: set depth to transparent meshes
        sortedTransparentRenderMeshInfos.forEach((renderMeshInfo) => {
            renderMeshInfo.actor.material.uniforms.setValue(
                UniformNames.DepthTexture,
                this._copyDepthDestRenderTarget.depthTexture
            );
        });

        this.setRenderTarget(this._afterDeferredShadingRenderTarget.write);

        this.transparentPass(sortedTransparentRenderMeshInfos, camera, lightActors);

        // ------------------------------------------------------------------------------
        // full screen pass
        // TODO: mainCameraかつcameraにpostProcessがあるときの対応
        // ------------------------------------------------------------------------------

        if (onBeforePostProcess) {
            onBeforePostProcess();
        }

        if (!this._scenePostProcess.hasEnabledPass) {
            // 何もenabledがないのはおかしい. tonemappingは最低限有効化されていないとおかしい(HDRなので)
            throw 'invalid postprocess';
        }

        // console.log("--------- postprocess pass ---------");

        let prevRenderTarget: RenderTarget = this._afterDeferredShadingRenderTarget;
        const isCameraLastPassAndHasNotPostProcess = !camera.renderTarget && !camera.hasEnabledPostProcessPass;
        this._scenePostProcess.update();
        this._scenePostProcess.render({
            gpu: this.gpu,
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

        if (camera.hasEnabledPostProcessPass) {
            camera.postProcess?.update();
            camera.postProcess?.render({
                gpu: this.gpu,
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

        if (this.stats) {
            this.stats.addDrawVertexCount(geometry);
            this.stats.incrementDrawCall();
        }

        // vertex
        this.gpu.setVertexArrayObject(geometry.vertexArrayObject);
        // material
        if (!material.shader) {
            throw 'invalid material shader';
        }
        this.gpu.setShader(material.shader);
        // uniforms
        this.gpu.setUniforms(material.uniforms);

        // setup depth write (depth mask)
        let depthWrite;
        if (material.depthWrite !== null) {
            depthWrite = material.depthWrite;
        } else {
            switch (material.blendType) {
                case BlendTypes.Opaque:
                    depthWrite = true;
                    break;
                case BlendTypes.Transparent:
                case BlendTypes.Additive:
                    depthWrite = false;
                    break;
                default:
                    throw 'invalid depth write';
            }
        }

        // setup depth test
        const depthTest = !!material.depthTest;

        // depth func type
        const depthFuncType = material.depthFuncType;

        // draw
        this.gpu.draw(
            geometry.drawCount,
            material.primitiveType,
            depthTest,
            depthWrite,
            depthFuncType,
            material.blendType,
            material.faceSide,
            geometry.instanceCount
        );
    }

    // --------------------------------------------------------------
    // private
    // --------------------------------------------------------------

    private gpu;
    realWidth: number = 1;
    realHeight: number = 1;
    private stats: Stats | null = null;
    private _scenePostProcess: PostProcess;
    // internal cmmera
    private screenQuadCamera: Camera = OrthographicCamera.CreateFullQuadOrthographicCamera();
    // render targets
    private _depthPrePassRenderTarget: RenderTarget;
    private _gBufferRenderTargets: GBufferRenderTargets;
    // private _ambientOcclusionRenderTarget: RenderTarget;
    private _afterDeferredShadingRenderTarget: RenderTarget;
    private _copyDepthSourceRenderTarget: RenderTarget;
    private _copyDepthDestRenderTarget: RenderTarget;
    // pass
    private _ambientOcclusionPass: SSAOPass;
    private _deferredShadingPass: DeferredShadingPass;
    private _ssrPass: SSRPass;
    private _lightShaftPass: LightShaftPass;
    private _volumetricLightPass: VolumetricLightPass;
    private _fogPass: FogPass;
    private _depthOfFieldPass: DepthOfFieldPass;
    private _bloomPass: BloomPass;
    private _streakPass: StreakPass;
    
    private _toneMappingPass: ToneMappingPass;
    private _chromaticAberrationPass: ChromaticAberrationPass;
    private _vignettePass: VignettePass;

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
    private setUniformBlockValue(blockName: string, uniformName: string, value: UniformBufferObjectValue) {
        // private setUniformBlockData(blockName: string, uniformBufferObjectBlockData: UniformBufferObjectBlockData) {
        // private updateUniformBlock(blockName: string) {
        // const setUniformValueInternal = (type: UniformTypes, name: string, v: UniformValue) => {};

        // const a: UniformValue;

        // const targetUniformBufferObject = this.globalUniformBufferObjects.find((globalUniformBufferObject) => {
        //     return globalUniformBufferObject.blockName === blockName;
        // });

        // if (targetUniformBufferObject) {
        // }

        // if(typeof(value) === 'number') {
        //     console.log(blockName, uniformName, value);
        // }

        const targetGlobalUniformBufferObject = this.globalUniformBufferObjects.find(
            ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
        );
        if (!targetGlobalUniformBufferObject) {
            console.error(`[Renderer.setUniformBlockData] invalid uniform block object: ${blockName}`);
            return;
        }

        // const targetBlock = targetUbo.data.find((block) => block.name === uniformName);

        // if (!targetBlock) {
        //     console.error(`[Renderer.setUniformBlockData] invalid uniform block data: ${uniformName}`);
        //     return;
        // }

        const targetUbo = targetGlobalUniformBufferObject.uniformBufferObject;

        const targetUniformData = targetGlobalUniformBufferObject.data.find((d) => {
            return d.name === uniformName;
        });

        if (!targetUniformData) {
            console.error(`[Renderer.setUniformBlockData] invalid uniform name: ${uniformName}`);
            return;
        }

        targetUbo.updateUniformValue(uniformName, targetUniformData.type, value);

        // const getStructValue = (value: UniformStructValue) => {
        //     const data: number[] = [];
        //     value.forEach((v) => {
        //         switch (v.type) {
        //             case UniformTypes.Float:
        //             case UniformTypes.Int:
        //                 data.push(v.value as number);
        //                 data.push(0);
        //                 data.push(0);
        //                 data.push(0);
        //                 break;
        //             case UniformTypes.Bool:
        //                 data.push((v.value as boolean) ? 1 : 0);
        //                 data.push(0);
        //                 data.push(0);
        //                 data.push(0);
        //                 break;
        //             default:
        //                 data.push(...(v.value as Vector2 | Vector3 | Vector4 | Matrix4 | Color).elements);
        //         }
        //     });
        //     return data;
        // };

        // // targetGlobalUniformBufferObject.data.forEach((targetBlock) => {
        // // const uniformName = targetBlock.name;
        // // const value = targetBlock.value;
        // // switch (targetBlock.type) {
        // switch (targetUniformData.type) {
        //     // TODO: update struct
        //     case UniformTypes.Struct:
        //     case UniformTypes.StructArray:
        //         if (Array.isArray(value)) {
        //             const data: number[] = [];
        //             value.forEach((v) => {
        //                 data.push(...getStructValue(v as UniformStructValue));
        //             });
        //             targetUbo.updateBufferData(uniformName, new Float32Array(data));
        //         } else {
        //             const data = getStructValue(value as unknown as UniformStructValue);
        //             targetUbo.updateBufferData(uniformName, new Float32Array(data));
        //         }
        //         break;
        //     default:
        //         if (Array.isArray(value)) {
        //             const data: number[] = [];
        //             value.forEach((v) => {
        //                 if (typeof v === 'number') {
        //                     data.push(v);
        //                     data.push(0);
        //                     data.push(0);
        //                     data.push(0);
        //                 } else {
        //                     data.push(...(v as Vector2 | Vector3 | Vector4 | Matrix4 | Color).elements);
        //                 }
        //             });
        //             targetUbo.updateBufferData(uniformName, new Float32Array(data));
        //         } else {
        //             targetUbo.updateBufferData(
        //                 uniformName,
        //                 typeof value === 'number'
        //                     ? new Float32Array([value])
        //                     : (value as Vector2 | Vector3 | Vector4 | Matrix4 | Color).elements
        //             );
        //         }
        //         break;
        // }
        // // });
    }

    /**
     *
     * @param actor
     * @param camera
     */
    // updateUniformBlockTransformations(actor: Actor, camera: Camera) {
    //     this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.WorldMatrix, actor.transform.worldMatrix);
    //     this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.ViewMatrix, camera.viewMatrix);
    //     this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.ProjectionMatrix, camera.projectionMatrix);
    //     // this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.NormalMatrix, actor.transform.inverseWorldMatrix);
    //     // this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.ViewPosition, camera.transform.worldMatrix.position);
    //     // depthMaterial.uniforms.setValue(UniformNames.ViewPosition, camera.transform.worldMatrix.position);
    // }

    /**
     *
     * @param depthPrePassRenderMeshInfos
     * @param camera
     * @private
     */
    private depthPrePass(depthPrePassRenderMeshInfos: RenderMeshInfo[], camera: Camera) {
        // console.log("--------- depth pre pass ---------");

        this.setRenderTarget(this._depthPrePassRenderTarget, false, true);
        // this.gpu.clearDepth(0, 0, 0, 1);

        // this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.ViewMatrix, camera.viewMatrix);
        // this.setUniformBlockValue(
        //     UniformBlockNames.Transformations,
        //     UniformNames.ProjectionMatrix,
        //     camera.projectionMatrix
        // );
        this.updateCameraUniforms(camera);

        depthPrePassRenderMeshInfos.forEach(({ actor }) => {
            const depthMaterial = actor.depthMaterial;

            if (!depthMaterial) {
                throw '[Renderer.depthPrePass] invalid depth material';
            }

            if (actor.mainMaterial.skipDepthPrePass) {
                return;
            }

            // console.log(depthMaterial.name, depthMaterial.depthTest, depthMaterial.depthWrite, depthMaterial.depthFuncType)

            // this.setUniformBlockValue(
            //     UniformBlockNames.Transformations,
            //     UniformNames.WorldMatrix,
            //     actor.transform.worldMatrix
            // );
            // this.setUniformBlockValue(
            //     UniformBlockNames.Transformations,
            //     UniformNames.InverseWorldMatrix,
            //     actor.transform.inverseWorldMatrix
            // );
            this.updateActorTransformUniforms(actor);
            // depthMaterial.uniforms.setValue(UniformNames.InverseWorldMatrix, actor.transform.inverseWorldMatrix);
            // depthMaterial.uniforms.setValue(UniformNames.ViewPosition, camera.transform.worldMatrix.position);

            // depthMaterial.uniforms.setValue(UniformNames.InverseWorldMatrix, actor.transform.inverseWorldMatrix);
            // // depthMaterial.uniforms.setValue(UniformNames.WorldMatrix, actor.transform.worldMatrix);
            // this.globalUniformBufferObjects.find((ubo) => ubo.blockName === UniformBlockNames.Transformations)?.updateBufferData(UniformNames.WorldMatrix, actor.transform.worldMatrix.elements);
            // depthMaterial.uniforms.setValue(UniformNames.ViewPosition, camera.transform.worldMatrix.position);
            // // depthMaterial.uniforms.setValue(UniformNames.ViewMatrix, camera.viewMatrix);
            // this.globalUniformBufferObjects.find((ubo) => ubo.blockName === UniformBlockNames.Transformations)?.updateBufferData(UniformNames.ViewMatrix, camera.viewMatrix.elements);
            // // depthMaterial.uniforms.setValue(UniformNames.ProjectionMatrix, camera.projectionMatrix);
            // this.globalUniformBufferObjects.find((ubo) => ubo.blockName === UniformBlockNames.Transformations)?.updateBufferData(UniformNames.ProjectionMatrix, camera.projectionMatrix.elements);

            this.renderMesh(actor.geometry, depthMaterial);

            if (this.stats) {
                this.stats.addPassInfo('depth pre pass', actor.name, actor.geometry);
            }
        });
    }

    /**
     *
     * @private
     */
    private copyDepthTexture() {
        this._copyDepthSourceRenderTarget.setDepthTexture(this._depthPrePassRenderTarget.depthTexture!);
        RenderTarget.blitDepth({
            gpu: this.gpu,
            sourceRenderTarget: this._copyDepthSourceRenderTarget,
            destRenderTarget: this._copyDepthDestRenderTarget,
            width: this.realWidth,
            height: this.realHeight,
        });
    }

    /**
     *
     * @param castShadowLightActors
     * @param castShadowRenderMeshInfos
     * @private
     */
    private shadowPass(castShadowLightActors: Light[], castShadowRenderMeshInfos: RenderMeshInfo[]) {
        // console.log("--------- shadow pass ---------");

        castShadowLightActors.forEach((lightActor) => {
            if (!lightActor.shadowMap) {
                throw 'invalid shadow pass';
                // return;
            }
            if (!lightActor.shadowCamera) {
                throw 'invalid shadow camera';
                // return;
            }
            this.setRenderTarget(lightActor.shadowMap.write, false, true);
            // this.clear(0, 0, 0, 1);
            // this.gpu.clearDepth(0, 0, 0, 1);

            if (castShadowRenderMeshInfos.length < 1) {
                return;
            }

            // console.log(lightActor, castShadowLightActors, castShadowRenderMeshInfos)

            // this.setUniformBlockValue(
            //     UniformBlockNames.Transformations,
            //     UniformNames.ViewMatrix,
            //     lightActor.shadowCamera.viewMatrix
            // );
            // this.setUniformBlockValue(
            //     UniformBlockNames.Transformations,
            //     UniformNames.ProjectionMatrix,
            //     lightActor.shadowCamera.projectionMatrix
            // );
            this.updateCameraUniforms(lightActor.shadowCamera);

            castShadowRenderMeshInfos.forEach(({ actor }) => {
                const targetMaterial = actor.depthMaterial;

                // TODO: material 側でやった方がよい？
                if (!targetMaterial) {
                    throw 'invalid target material';
                }

                // TODO: material 側でやった方がよい？
                // targetMaterial.uniforms.setValue(UniformNames.InverseWorldMatrix, actor.transform.inverseWorldMatrix);
                // // targetMaterial.uniforms.setValue(UniformNames.WorldMatrix, actor.transform.worldMatrix);
                // this.globalUniformBufferObjects.find((ubo) => ubo.blockName === UniformBlockNames.Transformations)?.updateBufferData(UniformNames.WorldMatrix, actor.transform.worldMatrix.elements);
                // // targetMaterial.uniforms.setValue(UniformNames.ViewMatrix, lightActor.shadowCamera!.viewMatrix);
                // this.globalUniformBufferObjects.find((ubo) => ubo.blockName === UniformBlockNames.Transformations)?.updateBufferData(UniformNames.ViewMatrix, lightActor.shadowCamera!.viewMatrix.elements);
                // this.updateUniformBlockTransformations(actor, lightActor.shadowCamera!);
                // this.setUniformBlockValue(
                //     UniformBlockNames.Transformations,
                //     UniformNames.WorldMatrix,
                //     actor.transform.worldMatrix
                // );
                // this.setUniformBlockValue(
                //     UniformBlockNames.Transformations,
                //     UniformNames.InverseWorldMatrix,
                //     actor.transform.inverseWorldMatrix
                // );
                this.updateActorTransformUniforms(actor);
                // targetMaterial.uniforms.setValue(
                //     UniformNames.ProjectionMatrix,
                //     lightActor.shadowCamera!.projectionMatrix
                // );
                // this.globalUniformBufferObjects.find((ubo) => ubo.blockName === UniformBlockNames.Transformations)?.updateBufferData(UniformNames.ProjectionMatrix, lightActor.shadowCamera!.projectionMatrix.elements);

                // this.setUniformBlockValue(
                //     UniformBlockNames.Transformations,
                //     UniformNames.NormalMatrix,
                //     actor.transform.normalMatrix
                // );

                // targetMaterial.uniforms.setValue(
                //     UniformNames.NormalMatrix,
                //     actor.transform.worldMatrix.clone().invert().transpose()
                // );
                // targetMaterial.uniforms.setValue(
                //     UniformNames.ViewPosition,
                //     lightActor.shadowCamera!.transform.worldMatrix.position
                // );
                // targetMaterial.uniforms.setValue(
                //     UniformNames.ViewDirection,
                //     lightActor.shadowCamera!.transform.worldForward
                // );

                targetMaterial.uniforms.setValue(
                    UniformNames.DepthTexture,
                    this._copyDepthDestRenderTarget.depthTexture
                );
                // targetMaterial.uniforms.setValue(UniformNames.CameraNear, lightActor.shadowCamera!.near);
                // targetMaterial.uniforms.setValue(UniformNames.CameraFar, lightActor.shadowCamera!.far);

                actor.updateDepthMaterial({ camera: lightActor.shadowCamera! });
                // targetMaterial.updateUniforms();

                this.renderMesh(actor.geometry, targetMaterial);

                if (this.stats) {
                    this.stats.addPassInfo('shadow pass', actor.name, actor.geometry);
                }
            });
        });
    }

    /**
     *
     * @param sortedRenderMeshInfos
     * @param camera
     * @param lightActors
     * @param clear
     * @private
     */
    private scenePass(
        sortedRenderMeshInfos: RenderMeshInfo[],
        camera: Camera
        // lightActors: LightActors
        // clear: boolean = true
    ) {
        // console.log("--------- scene pass ---------");

        // NOTE: DepthTextureはあるはず
        this._gBufferRenderTargets.setDepthTexture(this._depthPrePassRenderTarget.depthTexture!);

        this.setRenderTarget(this._gBufferRenderTargets.write, true);

        // TODO: depth prepass しない場合は必要
        // if (clear) {
        //     this.clear(camera.clearColor.x, camera.clearColor.y, camera.clearColor.z, camera.clearColor.w);
        // }

        // this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.ViewMatrix, camera.viewMatrix);
        // this.setUniformBlockValue(
        //     UniformBlockNames.Transformations,
        //     UniformNames.ProjectionMatrix,
        //     camera.projectionMatrix
        // );
        this.updateCameraUniforms(camera);

        sortedRenderMeshInfos.forEach(({ actor, materialIndex }) => {
            switch (actor.type) {
                case ActorTypes.Skybox:
                    if (!(actor as Skybox).renderMesh) {
                        return;
                    }
                    // TODO: skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
                    // TODO: engineでやるべき
                    actor.updateTransform(camera);
                    break;
            }

            const targetMaterial = actor.materials[materialIndex];

            // prepassしてないmaterialの場合はdepthをcopy.
            // prepassしてないmaterialが存在する度にdepthをcopyする必要があるので、使用は最小限にとどめる（raymarch以外では使わないなど）
            if (targetMaterial.skipDepthPrePass) {
                this.setRenderTarget(null, false, false);
                this.copyDepthTexture();
                this.setRenderTarget(this._gBufferRenderTargets.write, false, false);
            }

            // TODO: material 側でやった方がよい？
            // targetMaterial.uniforms.setValue(UniformNames.InverseWorldMatrix, actor.transform.inverseWorldMatrix);
            // this.setUniformBlockValue(
            //     UniformBlockNames.Transformations,
            //     UniformNames.WorldMatrix,
            //     actor.transform.worldMatrix
            // );
            // this.setUniformBlockValue(
            //     UniformBlockNames.Transformations,
            //     UniformNames.InverseWorldMatrix,
            //     actor.transform.inverseWorldMatrix
            // );
            this.updateActorTransformUniforms(actor);
            // // targetMaterial.uniforms.setValue(UniformNames.WorldMatrix, actor.transform.worldMatrix);
            // this.globalUniformBufferObjects.find((ubo) => ubo.blockName === UniformBlockNames.Transformations)?.updateBufferData(UniformNames.WorldMatrix, actor.transform.worldMatrix.elements);
            // // targetMaterial.uniforms.setValue(UniformNames.ViewMatrix, camera.viewMatrix);
            // this.globalUniformBufferObjects.find((ubo) => ubo.blockName === UniformBlockNames.Transformations)?.updateBufferData(UniformNames.ViewMatrix, camera.viewMatrix.elements);
            // // targetMaterial.uniforms.setValue(UniformNames.ProjectionMatrix, camera.projectionMatrix);
            // this.globalUniformBufferObjects.find((ubo) => ubo.blockName === UniformBlockNames.Transformations)?.updateBufferData(UniformNames.ProjectionMatrix, camera.projectionMatrix.elements);
            // targetMaterial.uniforms.setValue(
            //     UniformNames.NormalMatrix,
            //     actor.transform.worldMatrix.clone().invert().transpose()
            // );
            // this.setUniformBlockValue(
            //     UniformBlockNames.Transformations,
            //     UniformNames.NormalMatrix,
            //     actor.transform.normalMatrix
            // );

            // targetMaterial.uniforms.setValue(UniformNames.ViewPosition, camera.transform.worldMatrix.position);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            targetMaterial.uniforms.setValue(UniformNames.DepthTexture, this._copyDepthDestRenderTarget.depthTexture!);
            // targetMaterial.uniforms.setValue(UniformNames.CameraNear, camera.near);
            // targetMaterial.uniforms.setValue(UniformNames.CameraFar, camera.far);

            // TODO:
            // - light actor の中で lightの種類別に処理を分ける
            // - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意
            // lightActors.forEach((light) => {
            //     light.applyUniformsValues(targetMaterial);
            // });
            // TODO: g-bufferの時にはlightのuniformsを設定しなくて大丈夫になったのでいらないはず
            // applyLightShadowMapUniformValues(targetMaterial, lightActors);

            actor.updateMaterial({ camera });

            this.renderMesh(actor.geometry, targetMaterial);

            if (this.stats) {
                this.stats.addPassInfo('scene pass', actor.name, actor.geometry);
            }
        });
    }

    updateActorTransformUniforms(actor: Actor) {
        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.WorldMatrix,
            actor.transform.worldMatrix
        );
        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.InverseWorldMatrix,
            actor.transform.inverseWorldMatrix
        );
        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.NormalMatrix,
            actor.transform.normalMatrix
        );
    }

    updateCameraUniforms(camera: Camera) {
        this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.ViewMatrix, camera.viewMatrix);
        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.ProjectionMatrix,
            camera.projectionMatrix
        );
        this.setUniformBlockValue(
            UniformBlockNames.Camera,
            UniformNames.ViewPosition,
            camera.transform.worldMatrix.position
        );
        this.setUniformBlockValue(UniformBlockNames.Camera, UniformNames.ViewDirection, camera.getWorldForward());
        this.setUniformBlockValue(UniformBlockNames.Camera, UniformNames.CameraNear, camera.near);
        this.setUniformBlockValue(UniformBlockNames.Camera, UniformNames.CameraFar, camera.far);
        this.setUniformBlockValue(
            UniformBlockNames.Camera,
            UniformNames.CameraAspect,
            camera.isPerspective() ? (camera as PerspectiveCamera).aspect : (camera as OrthographicCamera).aspect
        );
        this.setUniformBlockValue(
            UniformBlockNames.Camera,
            UniformNames.CameraFov,
            camera.isPerspective() ? (camera as PerspectiveCamera).fov : 0
        );

        // passMaterial.uniforms.setValue(UniformNames.ViewProjectionMatrix, targetCamera.viewProjectionMatrix);
        // passMaterial.uniforms.setValue(
        //     UniformNames.InverseViewProjectionMatrix,
        //     targetCamera.inverseViewProjectionMatrix
        // );
        // passMaterial.uniforms.setValue(UniformNames.InverseViewMatrix, targetCamera.inverseViewMatrix);
        // passMaterial.uniforms.setValue(UniformNames.InverseProjectionMatrix, targetCamera.inverseProjectionMatrix);
        // passMaterial.uniforms.setValue(
        //     UniformNames.TransposeInverseViewMatrix,
        //     targetCamera.viewMatrix.clone().invert().transpose()
        // );

        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.ViewProjectionMatrix,
            camera.viewProjectionMatrix
        );
        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.InverseViewMatrix,
            camera.inverseViewMatrix
        );
        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.InverseProjectionMatrix,
            camera.inverseProjectionMatrix
        );
        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.InverseViewProjectionMatrix,
            camera.inverseViewProjectionMatrix
        );
        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.TransposeInverseViewMatrix,
            camera.viewMatrix.clone().invert().transpose()
        );
    }

    updateUniformBlockValue(blockName: string, uniformName: string, value: UniformBufferObjectValue) {
        const targetGlobalUniformBufferObject = this.globalUniformBufferObjects.find(
            ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
        );
        if (!targetGlobalUniformBufferObject) {
            console.error(`[Renderer.setUniformBlockData] invalid uniform block object: ${blockName}`);
            return;
        }

        // const targetBlock = targetUbo.data.find((block) => block.name === uniformName);

        // if (!targetBlock) {
        //     console.error(`[Renderer.setUniformBlockData] invalid uniform block data: ${uniformName}`);
        //     return;
        // }

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
                    data.push(...(value as Vector2).elements);
                    data.push(0);
                    break;
                case UniformTypes.Vector3:
                    data.push(...(value as Vector3).elements);
                    data.push(0);
                    break;
                case UniformTypes.Vector4:
                    data.push(...(value as Vector4).elements);
                    break;
                case UniformTypes.Matrix4:
                    data.push(...(value as Matrix4).elements);
                    break;
                case UniformTypes.Color:
                    data.push(...(value as Color).elements);
                    break;
                default:
                    throw `invalid uniform type: ${type}`;
            }
            return data;
        };

        // targetGlobalUniformBufferObject.data.forEach((targetBlock) => {
        // const uniformName = targetBlock.name;
        // const value = targetBlock.value;
        // switch (targetBlock.type) {
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
                        // for debug
                        targetUbo.updateBufferData(structElementName, new Float32Array(data));
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
                            data.push(...(v as UniformBufferObjectElementValueNoNeedsPadding).elements);
                        }
                    });
                    targetUbo.updateBufferData(uniformName, new Float32Array(data));
                } else {
                    targetUbo.updateBufferData(
                        uniformName,
                        typeof value === 'number'
                            ? new Float32Array([value])
                            : (value as Vector2 | Vector3 | Vector4 | Matrix4 | Color).elements
                    );
                }
                break;
        }
    }

    updateCommonUniforms({ time }: { time: number }) {
        // passMaterial.uniforms.setValue(UniformNames.Time, time);
        this.updateUniformBlockValue(UniformBlockNames.Common, UniformNames.Time, time);
        this.updateUniformBlockValue(
            UniformBlockNames.Common,
            UniformNames.Viewport,
            new Vector4(this.realWidth, this.realHeight, this.realWidth / this.realHeight, 0)
        );
    }

    updateDirectionalLightUniforms(directionalLight: DirectionalLight) {
        this.updateUniformBlockValue(UniformBlockNames.DirectionalLight, UniformNames.DirectionalLight, [
            {
                name: UniformNames.LightDirection,
                type: UniformTypes.Vector3,
                // pattern3: normalizeし、光源の位置から降り注ぐとみなす
                value: directionalLight.transform.position.clone().negate().normalize(),
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

    /**
     *
     * @param spotLights
     */
    updateSpotLightsUniforms(spotLights: SpotLight[]) {
        //const colors = spotLights.map((spotLight) => spotLight.color);
        //const intencities = spotLights.map((spotLight) => spotLight.intensity);
        // this.setUniformBlockValue(UniformBlockNames.SpotLight, UniformNames.SpotLightColor, colors);
        // this.setUniformBlockValue(UniformBlockNames.SpotLight, UniformNames.SpotLightIntensity, intencities);

        this.updateUniformBlockValue(
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
                        value: spotLight.transform.position,
                    },
                    {
                        name: UniformNames.LightDirection,
                        type: UniformTypes.Vector3,
                        value: spotLight.transform.worldForward.clone(),
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
                        value: spotLight.coneCos,
                    },
                    {
                        name: UniformNames.LightPenumbraCos,
                        type: UniformTypes.Float,
                        value: spotLight.penumbraCos,
                    },
                    {
                        name: UniformNames.ShadowMapProjectionMatrix,
                        type: UniformTypes.Matrix4,
                        value: spotLight.shadowMapProjectionMatrix,
                        // value: spotLight.lightViewProjectionMatrix,
                    },
                ];
            })
        );
    }

    /**
     *
     * @param sortedRenderMeshInfos
     * @param camera
     * @param lightActors
     * @param clear
     * @private
     */
    private transparentPass(
        sortedRenderMeshInfos: RenderMeshInfo[],
        camera: Camera,
        lightActors: LightActors
        // clear: boolean
    ) {
        // console.log("--------- transparent pass ---------");

        // TODO: 常にclearしない、で良い気がする
        // if (clear) {
        //     // this.clear(camera.clearColor.x, camera.clearColor.y, camera.clearColor.z, camera.clearColor.w);
        //     this.gpu.clear(camera.clearColor.x, camera.clearColor.y, camera.clearColor.z, camera.clearColor.w);
        // }

        // this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.ViewMatrix, camera.viewMatrix);
        // this.setUniformBlockValue(
        //     UniformBlockNames.Transformations,
        //     UniformNames.ProjectionMatrix,
        //     camera.projectionMatrix
        // );
        this.updateCameraUniforms(camera);

        sortedRenderMeshInfos.forEach(({ actor, materialIndex }) => {
            const targetMaterial = actor.materials[materialIndex];

            // // targetMaterial.uniforms.setValue(UniformNames.WorldMatrix, actor.transform.worldMatrix);
            // this.globalUniformBufferObjects.find((ubo) => ubo.blockName === UniformBlockNames.Transformations)?.updateBufferData(UniformNames.WorldMatrix, actor.transform.worldMatrix.elements);
            // // targetMaterial.uniforms.setValue(UniformNames.ViewMatrix, camera.viewMatrix);
            // this.globalUniformBufferObjects.find((ubo) => ubo.blockName === UniformBlockNames.Transformations)?.updateBufferData(UniformNames.ViewMatrix, camera.viewMatrix.elements);
            // // targetMaterial.uniforms.setValue(UniformNames.ProjectionMatrix, camera.projectionMatrix);
            // this.globalUniformBufferObjects.find((ubo) => ubo.blockName === UniformBlockNames.Transformations)?.updateBufferData(UniformNames.ProjectionMatrix, camera.projectionMatrix.elements);
            // this.updateUniformBlockTransformations(actor, camera);
            // this.setUniformBlockValue(
            //     UniformBlockNames.Transformations,
            //     UniformNames.WorldMatrix,
            //     actor.transform.worldMatrix
            // );
            // this.setUniformBlockValue(
            //     UniformBlockNames.Transformations,
            //     UniformNames.InverseWorldMatrix,
            //     actor.transform.inverseWorldMatrix
            // );
            // this.setUniformBlockValue(
            //     UniformBlockNames.Transformations,
            //     UniformNames.NormalMatrix,
            //     actor.transform.normalMatrix
            // );
            this.updateActorTransformUniforms(actor);
            // targetMaterial.uniforms.setValue(
            //     UniformNames.NormalMatrix,
            //     actor.transform.worldMatrix.clone().invert().transpose()
            // );
            // targetMaterial.uniforms.setValue(UniformNames.ViewPosition, camera.transform.worldMatrix.position);

            // TODO:
            // - light actor の中で lightの種類別に処理を分ける
            // - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意
            // - opaqueと共通処理なのでまとめたい
            // lightActors.forEach((light) => {
            //     light.applyUniformsValues(targetMaterial);
            // });
            // TODO: transparentで必要？使わないことを強制してもいい気がする
            applyLightShadowMapUniformValues(targetMaterial, lightActors);

            this.renderMesh(actor.geometry, targetMaterial);

            if (this.stats) {
                this.stats.addPassInfo('transparent pass', actor.name, actor.geometry);
            }
        });
    }
}
