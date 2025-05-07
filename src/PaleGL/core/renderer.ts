import {
    ActorTypes,
    BlendTypes,
    LightTypes,
    MAX_POINT_LIGHT_COUNT,
    MAX_SPOT_LIGHT_COUNT,
    MeshTypes,
    RenderQueueType,
    RenderTargetTypes,
    TextureDepthPrecisionType,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants';
import {
    bindGPUUniformBlockAndGetBlockIndex,
    clearGPUColor,
    clearGPUDepth,
    createGPUUniformBufferObject,
    drawGPU,
    flushGPU,
    Gpu,
    setGPUFramebuffer,
    setGPUShader,
    setGPUUniforms,
    setGPUVertexArrayObject,
    setGPUViewport,
} from '@/PaleGL/core/gpu.ts';
import { addDrawVertexCountStats, addPassInfoStats, incrementDrawCallStats, Stats } from '@/PaleGL/utilities/stats.ts';
import { Light } from '@/PaleGL/actors/lights/light.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { getMeshMaterial, updateMeshDepthMaterial, updateMeshMaterial } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { Scene, traverseScene } from '@/PaleGL/core/scene.ts';
import { Camera, CameraRenderTargetType } from '@/PaleGL/actors/cameras/camera.ts';
import { Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import {
    addPostProcessPass,
    createPostProcess,
    getPostProcessLastRenderTarget,
    hasPostProcessPassEnabled,
    PostProcess,
    renderPass,
    renderPostProcess,
    updatePostProcess,
} from '@/PaleGL/postprocess/postProcess.ts';
import {
    blitRenderTarget,
    blitRenderTargetDepth,
    createRenderTarget,
    RenderTarget,
    setRenderTargetDepthTexture,
    setRenderTargetSize,
    setRenderTargetTexture,
} from '@/PaleGL/core/renderTarget.ts';
import {
    createGBufferRenderTargets,
    GBufferRenderTargets,
    setGBufferRenderTargetsDepthTexture,
    setGBufferRenderTargetsSize,
} from '@/PaleGL/core/gBufferRenderTargets.ts';
import { OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import { createFullQuadOrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts';
import { Skybox } from '@/PaleGL/actors/meshes/skybox.ts';
import {
    createDeferredShadingPass,
    DeferredShadingPass,
    updateMaterialSkyboxUniforms,
} from '@/PaleGL/postprocess/deferredShadingPass.ts';
import { createSSAOPass, SsaoPass } from '@/PaleGL/postprocess/ssaoPass.ts';
import { createSSRPass, SsrPass } from '@/PaleGL/postprocess/ssrPass.ts';
import { createToneMappingPass, ToneMappingPass } from '@/PaleGL/postprocess/toneMappingPass.ts';
import { BloomPass, createBloomPass } from '@/PaleGL/postprocess/bloomPass.ts';
import { createDepthOfFieldPass, DepthOfFieldPass } from '@/PaleGL/postprocess/depthOfFieldPass.ts';
import {
    createLightShaftPass,
    getLightShaftPassRenderTarget,
    LightShaftPass,
    setLightShaftPassDirectionalLight,
} from '@/PaleGL/postprocess/lightShaftPass.ts';
import {
    createVolumetricLightPass,
    setVolumetricLightPassSpotLights,
    VolumetricLightPass,
} from '@/PaleGL/postprocess/volumetricLightPass.ts';
import { createFogPass, FogPass, setFogPassTextures } from '@/PaleGL/postprocess/fogPass.ts';
import { DirectionalLight } from '@/PaleGL/actors/lights/directionalLight.ts';
import { getSpotLightConeCos, getSpotLightPenumbraCos, SpotLight } from '@/PaleGL/actors/lights/spotLight.ts';
import {
    cloneMat4,
    createMat4Identity,
    getMat4Position,
    invertMat4,
    Matrix4,
    multiplyMat4Array,
    transposeMat4,
} from '@/PaleGL/math/matrix4.ts';
import { createShader } from '@/PaleGL/core/shader.ts';
import globalUniformBufferObjectVertexShader from '@/PaleGL/shaders/global-uniform-buffer-object-vertex.glsl';
import globalUniformBufferObjectFragmentShader from '@/PaleGL/shaders/global-uniform-buffer-object-fragment.glsl';
import {
    UniformBufferObject,
    updateUniformBufferData,
    updateUniformBufferValue,
} from '@/PaleGL/core/uniformBufferObject.ts';
import {
    cloneVector3,
    createVector3,
    createVector3Zero,
    getVector3Magnitude,
    subVectorsV3,
    Vector3,
} from '@/PaleGL/math/vector3.ts';
import { Actor } from '@/PaleGL/actors/actor.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/cameras/perspectiveCamera.ts';
import { Color, createColorBlack } from '@/PaleGL/math/color.ts';
import {
    addUniformBlock,
    UniformBufferObjectBlockData,
    UniformBufferObjectElementValueArray,
    UniformBufferObjectElementValueNoNeedsPadding,
    UniformBufferObjectStructArrayValue,
    UniformBufferObjectStructValue,
    UniformBufferObjectValue,
} from '@/PaleGL/core/uniforms.ts';
import { Vector2 } from '@/PaleGL/math/vector2.ts';
import { createVector4, createVector4zero, Vector4 } from '@/PaleGL/math/vector4.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import {
    ChromaticAberrationPass,
    createChromaticAberrationPass,
} from '@/PaleGL/postprocess/chromaticAberrationPass.ts';
import { createVignettePass, VignettePass } from '@/PaleGL/postprocess/vignettePass.ts';
import { createStreakPass, StreakPass } from '@/PaleGL/postprocess/streakPass.ts';
import { createFXAAPass, FxaaPass } from '@/PaleGL/postprocess/fxaaPass.ts';
import { createScreenSpaceShadowPass, ScreenSpaceShadowPass } from '@/PaleGL/postprocess/screenSpaceShadowPass.ts';
import { PointLight } from '@/PaleGL/actors/lights/pointLight.ts';
import { Texture } from '@/PaleGL/core/texture.ts';
import { PostProcessVolume } from '@/PaleGL/actors/volumes/postProcessVolume.ts';
import { createGlitchPass, GlitchPass } from '@/PaleGL/postprocess/glitchPass.ts';
import { SharedTextures, SharedTexturesTypes } from '@/PaleGL/core/createSharedTextures.ts';
import { replaceShaderIncludes } from '@/PaleGL/core/buildShader.ts';
import { updateActorTransform } from '@/PaleGL/actors/actorBehaviours.ts';
import { getWorldForward } from '@/PaleGL/core/transform.ts';
import {
    getCameraForward,
    hasEnabledPostProcessPass,
    isPerspectiveCamera,
} from '@/PaleGL/actors/cameras/cameraBehaviours.ts';
import { setPostProcessPassSize } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import { rotateVectorByQuaternion } from '@/PaleGL/math/quaternion.ts';

type RenderMeshInfo = { actor: Mesh; materialIndex: number; queue: RenderQueueType };

type RenderMeshInfoEachQueue = {
    [key in RenderQueueType]: RenderMeshInfo[];
};

export type LightActors = {
    directionalLight: DirectionalLight | null;
    spotLights: SpotLight[];
    pointLights: PointLight[];
};


type RenderMeshInfosEachPass = {
    basePass: RenderMeshInfo[];
    skyboxPass: RenderMeshInfo[];
    afterTonePass: RenderMeshInfo[];
    transparentPass: RenderMeshInfo[];
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
            ? lightActors.directionalLight.shadowMap.depthTexture
            : fallbackTexture
    );

    // spotlights
    const spotLightShadowMaps = maton.range(MAX_SPOT_LIGHT_COUNT).map((_, key) => {
        const spotLight = lightActors.spotLights[key];
        return spotLight && spotLight.shadowMap ? spotLight.shadowMap.depthTexture! : fallbackTexture;
    });
    setMaterialUniformValue(targetMaterial, UniformNames.SpotLightShadowMap, spotLightShadowMaps);
}

// TODO: 処理を復活させる
// function applyPostProcessVolumeParameters(renderer: Renderer, postProcessVolumeActor: PostProcessVolume) {
function applyPostProcessVolumeParameters() {
    // // bloom
    // // renderer.bloomPass.updateParameters(postProcessVolumeActor.findParameter<BloomPassParameters>(PostProcessPassType.Bloom));
    // const bloomParameter = findPostProcessParameter<BloomPassParameters>(
    //     postProcessVolumeActor,
    //     PostProcessPassType.Bloom
    // );
    // if (bloomParameter) {
    //     updateBloomPassParameters(renderer.bloomPass, bloomParameter);
    // }
}

export type Renderer = {
    canvas: HTMLCanvasElement;
    pixelRatio: number;
    globalUniformBufferObjects: {
        uniformBufferObject: UniformBufferObject;
        data: UniformBufferObjectBlockData;
    }[];
    gpu: Gpu;
    realWidth: number;
    realHeight: number;
    stats: Stats | null;
    scenePostProcess: PostProcess;
    screenQuadCamera: Camera;
    depthPrePassRenderTarget: RenderTarget;
    gBufferRenderTargets: GBufferRenderTargets;
    afterDeferredShadingRenderTarget: RenderTarget;
    copyDepthSourceRenderTarget: RenderTarget;
    copyDepthDestRenderTarget: RenderTarget;
    copySceneSourceRenderTarget: RenderTarget;
    copySceneDestRenderTarget: RenderTarget;
    screenSpaceShadowPass: ScreenSpaceShadowPass;
    ambientOcclusionPass: SsaoPass;
    deferredShadingPass: DeferredShadingPass;
    ssrPass: SsrPass;
    lightShaftPass: LightShaftPass;
    volumetricLightPass: VolumetricLightPass;
    fogPass: FogPass;
    depthOfFieldPass: DepthOfFieldPass;
    bloomPass: BloomPass;
    streakPass: StreakPass;
    toneMappingPass: ToneMappingPass;
    chromaticAberrationPass: ChromaticAberrationPass;
    glitchPass: GlitchPass;
    vignettePass: VignettePass;
    fxaaPass: FxaaPass;
    //
    renderTarget: CameraRenderTargetType | null;
    clearColorDirtyFlag: boolean;
};

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
export function createRenderer({
    gpu,
    canvas,
    pixelRatio = 1.5,
}: {
    gpu: Gpu;
    canvas: HTMLCanvasElement;
    pixelRatio: number;
}): Renderer {
    const globalUniformBufferObjects: {
        uniformBufferObject: UniformBufferObject;
        data: UniformBufferObjectBlockData;
    }[] = [];

    const realWidth: number = 1;
    const realHeight: number = 1;
    const stats: Stats | null = null;
    const screenQuadCamera = createFullQuadOrthographicCamera();
    const scenePostProcess = createPostProcess(screenQuadCamera);
    const depthPrePassRenderTarget = createRenderTarget({
        gpu,
        type: RenderTargetTypes.Depth,
        width: 1,
        height: 1,
        name: 'depth pre-pass render target',
        depthPrecision: TextureDepthPrecisionType.High, // 低精度だとマッハバンドのような見た目になるので高精度にしておく
    });
    const gBufferRenderTargets = createGBufferRenderTargets({
        gpu,
        width: 1,
        height: 1,
        name: 'g-buffer render target',
    });
    const afterDeferredShadingRenderTarget = createRenderTarget({
        gpu,
        type: RenderTargetTypes.Empty,
        width: 1,
        height: 1,
        name: 'after g-buffer render target',
    });
    const copyDepthSourceRenderTarget: RenderTarget = createRenderTarget({
        gpu,
        type: RenderTargetTypes.Empty,
        width: 1,
        height: 1,
        name: 'copy depth source render target',
        depthPrecision: TextureDepthPrecisionType.High, // 低精度だとマッハバンドのような見た目になるので高精度にしておく
    });
    const copyDepthDestRenderTarget = createRenderTarget({
        gpu,
        type: RenderTargetTypes.Depth,
        width: 1,
        height: 1,
        name: 'copy depth dest render target',
        depthPrecision: TextureDepthPrecisionType.High, // 低精度だとマッハバンドのような見た目になるので高精度にしておく
    });
    const copySceneSourceRenderTarget = createRenderTarget({
        gpu,
        type: RenderTargetTypes.Empty,
        width: 1,
        height: 1,
        name: 'copy scene source render target',
    });
    const copySceneDestRenderTarget = createRenderTarget({
        gpu,
        type: RenderTargetTypes.R11F_G11F_B10F,
        width: 1,
        height: 1,
        name: 'copy scene dest render target',
    });
    const screenSpaceShadowPass = createScreenSpaceShadowPass({ gpu });
    const ambientOcclusionPass = createSSAOPass({ gpu });
    const deferredShadingPass = createDeferredShadingPass({ gpu });
    const ssrPass = createSSRPass({ gpu });
    const lightShaftPass = createLightShaftPass({ gpu });
    const volumetricLightPass = createVolumetricLightPass({ gpu });
    const fogPass = createFogPass({ gpu });
    const depthOfFieldPass = createDepthOfFieldPass({ gpu });
    const bloomPass = createBloomPass({ gpu });
    const streakPass = createStreakPass({ gpu });
    const toneMappingPass = createToneMappingPass({ gpu });
    const chromaticAberrationPass = createChromaticAberrationPass({ gpu });
    const glitchPass = createGlitchPass({ gpu });
    const vignettePass = createVignettePass({ gpu });
    const fxaaPass = createFXAAPass({ gpu });

    addPostProcessPass(scenePostProcess, fxaaPass);
    addPostProcessPass(scenePostProcess, depthOfFieldPass);
    addPostProcessPass(scenePostProcess, bloomPass);
    addPostProcessPass(scenePostProcess, streakPass);
    addPostProcessPass(scenePostProcess, toneMappingPass);
    addPostProcessPass(scenePostProcess, vignettePass);
    addPostProcessPass(scenePostProcess, chromaticAberrationPass);
    addPostProcessPass(scenePostProcess, glitchPass);

    //
    // initialize global uniform buffer objects
    //

    const uniformBufferObjectShader = createShader({
        gpu,
        vertexShader: replaceShaderIncludes(globalUniformBufferObjectVertexShader),
        fragmentShader: replaceShaderIncludes(globalUniformBufferObjectFragmentShader),
    });

    const transformationsUniformBlockData = [
        {
            name: UniformNames.WorldMatrix,
            type: UniformTypes.Matrix4,
            value: createMat4Identity(),
        },
        {
            name: UniformNames.ViewMatrix,
            type: UniformTypes.Matrix4,
            value: createMat4Identity(),
        },
        {
            name: UniformNames.ProjectionMatrix,
            type: UniformTypes.Matrix4,
            value: createMat4Identity(),
        },
        {
            name: UniformNames.WVPMatrix,
            type: UniformTypes.Matrix4,
            value: createMat4Identity(),
        },
        {
            name: UniformNames.NormalMatrix,
            type: UniformTypes.Matrix4,
            value: createMat4Identity(),
        },
        {
            name: UniformNames.InverseWorldMatrix,
            type: UniformTypes.Matrix4,
            value: createMat4Identity(),
        },
        {
            name: UniformNames.ViewProjectionMatrix,
            type: UniformTypes.Matrix4,
            value: createMat4Identity(),
        },
        {
            name: UniformNames.InverseViewMatrix,
            type: UniformTypes.Matrix4,
            value: createMat4Identity(),
        },
        {
            name: UniformNames.InverseProjectionMatrix,
            type: UniformTypes.Matrix4,
            value: createMat4Identity(),
        },
        {
            name: UniformNames.InverseViewProjectionMatrix,
            type: UniformTypes.Matrix4,
            value: createMat4Identity(),
        },
        {
            name: UniformNames.TransposeInverseViewMatrix,
            type: UniformTypes.Matrix4,
            value: createMat4Identity(),
        },
    ];

    globalUniformBufferObjects.push({
        uniformBufferObject: createGPUUniformBufferObject(
            gpu,
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
            value: createVector3Zero(),
        },
        {
            name: UniformNames.ViewDirection,
            type: UniformTypes.Vector3,
            value: createVector3Zero(),
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
    globalUniformBufferObjects.push({
        uniformBufferObject: createGPUUniformBufferObject(
            gpu,
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
                    value: createVector3Zero(),
                },
                {
                    name: UniformNames.LightIntensity,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: UniformNames.LightColor,
                    type: UniformTypes.Color,
                    value: createColorBlack(),
                },
                {
                    name: UniformNames.ShadowMapProjectionMatrix,
                    type: UniformTypes.Matrix4,
                    value: createMat4Identity(),
                },
            ],
        },
    ];
    globalUniformBufferObjects.push({
        uniformBufferObject: createGPUUniformBufferObject(
            gpu,
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
                    value: createColorBlack(),
                },
                {
                    name: UniformNames.LightPosition,
                    type: UniformTypes.Vector3,
                    value: createVector3Zero(),
                },
                {
                    name: UniformNames.LightDirection,
                    type: UniformTypes.Vector3,
                    value: createVector3Zero(),
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
                    value: createMat4Identity(),
                },
            ]),
        },
    ];
    globalUniformBufferObjects.push({
        uniformBufferObject: createGPUUniformBufferObject(
            gpu,
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
                    value: createColorBlack(),
                },
                {
                    name: UniformNames.LightPosition,
                    type: UniformTypes.Vector3,
                    value: createVector3Zero(),
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
    globalUniformBufferObjects.push({
        uniformBufferObject: createGPUUniformBufferObject(
            gpu,
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
    globalUniformBufferObjects.push({
        uniformBufferObject: createGPUUniformBufferObject(
            gpu,
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
            value: createVector4zero(),
        },
    ];
    // TODO: 一番最初の要素としてpushするとなぜかエラーになる
    globalUniformBufferObjects.push({
        uniformBufferObject: createGPUUniformBufferObject(
            gpu,
            uniformBufferObjectShader,
            UniformBlockNames.Common,
            commonUniformBlockData
        ),
        data: commonUniformBlockData,
    });

    // for debug
    console.log('[createRenderer] global uniform buffer objects', globalUniformBufferObjects);

    const renderTarget: CameraRenderTargetType | null = null;
    const clearColorDirtyFlag = false;

    return {
        canvas,
        pixelRatio,
        globalUniformBufferObjects,
        gpu,
        realWidth,
        realHeight,
        stats,
        scenePostProcess,
        screenQuadCamera,
        depthPrePassRenderTarget,
        gBufferRenderTargets,
        afterDeferredShadingRenderTarget,
        copyDepthSourceRenderTarget,
        copyDepthDestRenderTarget,
        copySceneSourceRenderTarget,
        copySceneDestRenderTarget,
        screenSpaceShadowPass,
        ambientOcclusionPass,
        deferredShadingPass,
        ssrPass,
        lightShaftPass,
        volumetricLightPass,
        fogPass,
        depthOfFieldPass,
        bloomPass,
        streakPass,
        toneMappingPass,
        chromaticAberrationPass,
        glitchPass,
        vignettePass,
        fxaaPass,
        //
        renderTarget,
        clearColorDirtyFlag,
    };
}

export function setRendererStats(renderer: Renderer, stats: Stats | null) {
    renderer.stats = stats;
}

// TODO: materialのstartの中でやりたい
export function checkNeedsBindUniformBufferObjectToMaterial(renderer: Renderer, material: Material) {
    // mesh.materials.forEach((material) => {
    if (material.boundUniformBufferObjects) {
        return;
    }
    material.boundUniformBufferObjects = true;
    // for debug
    material.uniformBlockNames.forEach((blockName) => {
        const targetGlobalUniformBufferObject = renderer.globalUniformBufferObjects.find(
            ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
        );
        if (!targetGlobalUniformBufferObject) {
            return;
        }
        const blockIndex = bindGPUUniformBlockAndGetBlockIndex(
            renderer.gpu,
            targetGlobalUniformBufferObject.uniformBufferObject,
            material.shader!,
            blockName
        );
        // for debug
        // console.log(
        //     material.name,
        //     'addUniformBlock',
        //     material.uniformBlockNames,
        //     targetGlobalUniformBufferObject.data,
        //     blockIndex
        // );
        addUniformBlock(material.uniforms, blockIndex, targetGlobalUniformBufferObject.uniformBufferObject, []);
    });
    // });
}

export function setRendererSize(renderer: Renderer, realWidth: number, realHeight: number) {
    const w = Math.floor(realWidth);
    const h = Math.floor(realHeight);
    renderer.realWidth = w;
    renderer.realHeight = h;
    renderer.canvas.width = w;
    renderer.canvas.height = h;

    setGPUViewport(renderer.gpu, 0, 0, w, h);

    // render targets
    setRenderTargetSize(renderer.depthPrePassRenderTarget, w, h);
    setGBufferRenderTargetsSize(renderer.gBufferRenderTargets, w, h);
    setRenderTargetSize(renderer.afterDeferredShadingRenderTarget, w, h);
    setRenderTargetSize(renderer.copyDepthSourceRenderTarget, w, h);
    setRenderTargetSize(renderer.copyDepthDestRenderTarget, w, h);
    setRenderTargetSize(renderer.copySceneSourceRenderTarget, w, h);
    setRenderTargetSize(renderer.copySceneDestRenderTarget, w, h);
    // passes
    setPostProcessPassSize(renderer.screenSpaceShadowPass, w, h);
    setPostProcessPassSize(renderer.ambientOcclusionPass, w, h);
    setPostProcessPassSize(renderer.deferredShadingPass, w, h);
    setPostProcessPassSize(renderer.ssrPass, w, h);
    setPostProcessPassSize(renderer.lightShaftPass, w, h);
    setPostProcessPassSize(renderer.volumetricLightPass, w, h);
    setPostProcessPassSize(renderer.fogPass, w, h);
    setPostProcessPassSize(renderer.depthOfFieldPass, w, h);
    setPostProcessPassSize(renderer.bloomPass, w, h);
    setPostProcessPassSize(renderer.streakPass, w, h);
    setPostProcessPassSize(renderer.toneMappingPass, w, h);
    setPostProcessPassSize(renderer.chromaticAberrationPass, w, h);
    setPostProcessPassSize(renderer.glitchPass, w, h);
    setPostProcessPassSize(renderer.vignettePass, w, h);
    setPostProcessPassSize(renderer.fxaaPass, w, h);
}

/**
 *
 * @param renderTarget
 * @param clearColor
 * @param clearDepth
 */
// TODO: 本当はclearcolorの色も渡せるとよい
export function setRendererRenderTarget(
    renderer: Renderer,
    renderTarget: CameraRenderTargetType,
    clearColor: boolean = false,
    clearDepth: boolean = false
) {
    if (renderTarget) {
        renderer.renderTarget = renderTarget;
        setGPUFramebuffer(renderer.gpu, renderTarget.framebuffer);
        setGPUViewport(renderer.gpu, 0, 0, renderTarget.width, renderTarget.height);
    } else {
        renderer.renderTarget = null;
        setGPUFramebuffer(renderer.gpu, null);
        setGPUViewport(renderer.gpu, 0, 0, renderer.realWidth, renderer.realHeight);
    }
    if (clearColor) {
        clearGPUColor(renderer.gpu, 0, 0, 0, 0);
        renderer.clearColorDirtyFlag = true;
    } else {
        renderer.clearColorDirtyFlag = false;
    }
    if (clearDepth) {
        clearGPUDepth(renderer.gpu, 1, 1, 1, 1);
    }
}

export function flushRenderer(renderer: Renderer) {
    flushGPU(renderer.gpu);
}

export function clearRendererColor(renderer: Renderer, r: number, g: number, b: number, a: number) {
    clearGPUColor(renderer.gpu, r, g, b, a);
}

export function clearRendererDepth(renderer: Renderer, r: number, g: number, b: number, a: number) {
    clearGPUDepth(renderer.gpu, r, g, b, a);
}

export function beforeRenderRenderer(renderer: Renderer, time: number, deltaTime: number) {
    updateCommonUniforms(renderer, { time, deltaTime });
}

export function renderRenderer(
    renderer: Renderer,
    scene: Scene,
    camera: Camera,
    sharedTextures: SharedTextures,
    {
        time,
        // timelineTime,
        // timeDeltaTime,
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
        [RenderQueueType.Opaque]: [],
        [RenderQueueType.AlphaTest]: [],
        [RenderQueueType.Skybox]: [],
        [RenderQueueType.Transparent]: [],
        [RenderQueueType.AfterTone]: [],
    };

    const lightActors: LightActors = {
        directionalLight: null,
        spotLights: [],
        pointLights: [],
    };

    let postProcessVolumeActor: PostProcessVolume | null = null;

    // TODO: material側から設定したrenderQueueをどうやって考慮するか
    // build render mesh info each queue
    traverseScene(scene, (actor) => {
        switch (actor.type) {
            case ActorTypes.Skybox:
                if (!actor.enabled) {
                    return;
                }
                renderMeshInfoEachQueue[RenderQueueType.Skybox].push(
                    buildRenderMeshInfo(actor as Skybox, RenderQueueType.Skybox)
                );
                // TODO: skyboxの中で処理したい
                // actor.transform.parent = cameras.transform;
                return;
            case ActorTypes.Mesh:
                // case ActorTypes.SkinnedMesh:
                if (!actor.enabled) {
                    return;
                }
                const mesh = actor as Mesh;
                if (!mesh.renderEnabled) {
                    // skip
                    return;
                }
                mesh.materials.forEach((material, i) => {
                    if (mesh.meshType === MeshTypes.UI) {
                        renderMeshInfoEachQueue[RenderQueueType.AfterTone].push(
                            buildRenderMeshInfo(mesh, RenderQueueType.AfterTone, i)
                        );
                    } else {
                        if (material.alphaTest != null) {
                            renderMeshInfoEachQueue[RenderQueueType.AlphaTest].push(
                                buildRenderMeshInfo(mesh, RenderQueueType.AlphaTest, i)
                            );
                            return;
                        }
                        switch (material.blendType) {
                            case BlendTypes.Opaque:
                                renderMeshInfoEachQueue[RenderQueueType.Opaque].push(
                                    buildRenderMeshInfo(mesh, RenderQueueType.Opaque, i)
                                );
                                return;
                            case BlendTypes.Transparent:
                            case BlendTypes.Additive:
                                renderMeshInfoEachQueue[RenderQueueType.Transparent].push(
                                    buildRenderMeshInfo(mesh, RenderQueueType.Transparent, i)
                                );
                                return;
                            default:
                                console.error('[Renderer.render] invalid blend type');
                        }
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

    const currentCameraRenderMeshInfoEachPass = createRenderMeshInfosEachPass(renderMeshInfoEachQueue, camera);

    // override postprocess parameters
    if (postProcessVolumeActor) {
        // TODO: 処理を復活させる
        // applyPostProcessVolumeParameters(renderer, postProcessVolumeActor);
        applyPostProcessVolumeParameters();
    }

    //
    // TODO: depth sort
    //

    // ------------------------------------------------------------------------------
    // update common uniforms
    // ------------------------------------------------------------------------------

    // this.updateCommonUniforms({ time, deltaTime });
    // TODO: このままだと directional-light がなくなったときも directional-light が残ることになる
    if (lightActors.directionalLight) {
        updateDirectionalLightUniforms(renderer, lightActors.directionalLight);
    }
    // TODO: このままだと spot-light がなくなったときも spot-light が残ることになる
    if (lightActors.spotLights.length > 0) {
        updateSpotLightsUniforms(renderer, lightActors.spotLights);
    }
    // TODO: このままだと point-light がなくなったときも point-light が残ることになる
    if (lightActors.pointLights.length > 0) {
        updatePointLightsUniforms(renderer, lightActors.pointLights);
    }

    // ------------------------------------------------------------------------------
    // depth pre-pass
    // ------------------------------------------------------------------------------

    depthPrePass(renderer, currentCameraRenderMeshInfoEachPass.basePass, camera);

    // ------------------------------------------------------------------------------
    // skybox pass
    // g-buffer opaque pass
    // ------------------------------------------------------------------------------

    setGBufferRenderTargetsDepthTexture(renderer.gBufferRenderTargets, renderer.depthPrePassRenderTarget.depthTexture!);
    setRendererRenderTarget(renderer, renderer.gBufferRenderTargets, true);

    // TODO: 本当はskyboxをshadingの後にしたい
    skyboxPass(renderer, currentCameraRenderMeshInfoEachPass.skyboxPass, camera);
    renderBasePass(
        renderer,
        camera,
        currentCameraRenderMeshInfoEachPass.basePass,
        currentCameraRenderMeshInfoEachPass.skyboxPass
    );

    // ------------------------------------------------------------------------------
    // shadow pass
    // ------------------------------------------------------------------------------

    // cast shadow 用のライト管理は配列にしちゃう
    const castShadowLightActors: Light[] = [];
    if (lightActors.directionalLight && lightActors.directionalLight.castShadow) {
        castShadowLightActors.push(lightActors.directionalLight);
    }
    lightActors.spotLights.forEach((light) => {
        if (light.castShadow) {
            castShadowLightActors.push(light);
        }
    });

    if (castShadowLightActors.length > 0) {
        // const castShadowRenderMeshInfos = sortedBasePassRenderMeshInfos.filter(({ actor }) => {
        //     if (actor.type === ActorTypes.Skybox) {
        //         return false;
        //     }
        //     return actor.castShadow;
        // });
        // shadowPass(renderer, castShadowLightActors, castShadowRenderMeshInfos);
        shadowPass(renderer, camera, castShadowLightActors, renderMeshInfoEachQueue);
    }

    // ------------------------------------------------------------------------------
    // screen space shadow pass
    // ------------------------------------------------------------------------------

    const postProcessCamera = renderer.scenePostProcess.postProcessCamera;

    if (renderer.screenSpaceShadowPass.enabled) {
        renderPass({
            pass: renderer.screenSpaceShadowPass,
            renderer,
            targetCamera: camera,
            gpu: renderer.gpu,
            camera: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: null,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });
    }

    // ------------------------------------------------------------------------------
    // ambient occlusion pass
    // ------------------------------------------------------------------------------

    if (renderer.ambientOcclusionPass.enabled) {
        renderPass({
            pass: renderer.ambientOcclusionPass,
            renderer,
            targetCamera: camera,
            gpu: renderer.gpu,
            camera: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: null,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });
    }

    // ------------------------------------------------------------------------------
    // deferred lighting pass
    // ------------------------------------------------------------------------------

    // update cubemap to deferred lighting pass
    // TODO: skyboxは一個だけ想定のいいはず
    renderMeshInfoEachQueue[RenderQueueType.Skybox].forEach((skyboxRenderMeshInfo) => {
        const skyboxActor = skyboxRenderMeshInfo.actor as Skybox;
        updateMaterialSkyboxUniforms(renderer.deferredShadingPass.material, skyboxActor);
    });

    applyLightShadowMapUniformValues(
        renderer.deferredShadingPass.material,
        lightActors,
        renderer.gpu.dummyTextureBlack
    );

    // set sss texture
    setMaterialUniformValue(
        renderer.deferredShadingPass.material,
        'uScreenSpaceShadowTexture',
        renderer.screenSpaceShadowPass.enabled
            ? renderer.screenSpaceShadowPass.renderTarget.texture
            : renderer.gpu.dummyTextureBlack
    );

    // set ao texture
    setMaterialUniformValue(
        renderer.deferredShadingPass.material,
        'uAmbientOcclusionTexture',
        renderer.ambientOcclusionPass.enabled
            ? renderer.ambientOcclusionPass.renderTarget.texture
            : renderer.gpu.dummyTexture
    );

    renderPass({
        pass: renderer.deferredShadingPass,
        renderer,
        targetCamera: camera,
        gpu: renderer.gpu,
        camera: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
        prevRenderTarget: null,
        isLastPass: false,
        time, // TODO: engineから渡したい
        lightActors,
    });

    // ------------------------------------------------------------------------------
    // ssr pass
    // ------------------------------------------------------------------------------

    if (renderer.ssrPass.enabled) {
        renderPass({
            pass: renderer.ssrPass,
            renderer,
            targetCamera: camera,
            gpu: renderer.gpu,
            camera: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: renderer.deferredShadingPass.renderTarget,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });
    }

    // ------------------------------------------------------------------------------
    // light shaft pass
    // ------------------------------------------------------------------------------

    if (lightActors.directionalLight && renderer.lightShaftPass.enabled) {
        setLightShaftPassDirectionalLight(renderer.lightShaftPass, lightActors.directionalLight);
        renderPass({
            pass: renderer.lightShaftPass,
            renderer,
            targetCamera: camera,
            gpu: renderer.gpu,
            camera: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: renderer.deferredShadingPass.renderTarget,
            isLastPass: false,
            time, // TODO: engineから渡したい
        });
    } else {
        // TODO: directional light ないときの対応。黒く塗りたい
    }

    // ------------------------------------------------------------------------------
    // volumetric light pass
    // ------------------------------------------------------------------------------

    if (lightActors.spotLights.length > 0) {
        setVolumetricLightPassSpotLights(renderer.volumetricLightPass, lightActors.spotLights);
        renderPass({
            pass: renderer.volumetricLightPass,
            renderer,
            targetCamera: camera,
            gpu: renderer.gpu,
            camera: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: renderer.deferredShadingPass.renderTarget,
            isLastPass: false,
            time, // TODO: engineから渡したい
        });
    }

    // ------------------------------------------------------------------------------
    // fog pass
    // ------------------------------------------------------------------------------

    setFogPassTextures(
        renderer.fogPass,
        renderer.lightShaftPass.enabled
            ? getLightShaftPassRenderTarget(renderer.lightShaftPass).texture!
            : renderer.gpu.dummyTextureBlack,
        // CUSTOM
        //  this._gpu.dummyTextureBlack,
        //
        renderer.volumetricLightPass.renderTarget.texture!,
        renderer.screenSpaceShadowPass.enabled
            ? renderer.screenSpaceShadowPass.renderTarget.texture!
            : renderer.gpu.dummyTextureBlack,
        sharedTextures.get(SharedTexturesTypes.FBM_NOISE)!.texture
    );

    // fog pass の段階で合成
    renderPass({
        pass: renderer.fogPass,
        renderer,
        targetCamera: camera,
        gpu: renderer.gpu,
        camera: postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
        prevRenderTarget: renderer.ssrPass.enabled
            ? renderer.ssrPass.renderTarget
            : renderer.deferredShadingPass.renderTarget,
        isLastPass: false,
        time, // TODO: engineから渡したい
        // lightActors,
    });
    // return;

    // ------------------------------------------------------------------------------
    // transparent pass
    // ------------------------------------------------------------------------------

    // TODO: 直前のパスを明示的に指定する必要があるのはめんどうなのでうまいこと管理したい
    const sceneTexture = renderer.fogPass.renderTarget.texture!;

    setRenderTargetTexture(renderer.afterDeferredShadingRenderTarget, sceneTexture);

    // pattern1: g-buffer depth
    // this._afterDeferredShadingRenderTarget.setDepthTexture(this._gBufferRenderTargets.depthTexture!);
    // pattern2: depth prepass
    setRenderTargetDepthTexture(
        renderer.afterDeferredShadingRenderTarget,
        renderer.depthPrePassRenderTarget.depthTexture!
    );

    copySceneTexture(renderer, sceneTexture);
    copyDepthTexture(renderer);

    // TODO: set depth to transparent meshes
    renderMeshInfoEachQueue[RenderQueueType.Transparent].forEach((renderMeshInfo) => {
        setMaterialUniformValue(
            getMeshMaterial(renderMeshInfo.actor),
            UniformNames.DepthTexture,
            renderer.copyDepthDestRenderTarget.depthTexture
        );
    });

    setRendererRenderTarget(renderer, renderer.afterDeferredShadingRenderTarget);

    renderTransparentPass(
        renderer,
        camera,
        renderMeshInfoEachQueue[RenderQueueType.Transparent],
        renderMeshInfoEachQueue[RenderQueueType.Skybox],
        lightActors,
        renderer.copySceneDestRenderTarget.texture!
    );

    // ------------------------------------------------------------------------------
    // full screen pass
    // TODO: mainCameraかつcameraにpostProcessがあるときの対応
    // ------------------------------------------------------------------------------

    if (onBeforePostProcess) {
        onBeforePostProcess();
    }

    if (!hasPostProcessPassEnabled(renderer.scenePostProcess)) {
        // 何もenabledがないのはおかしい. tonemappingは最低限有効化されていないとおかしい(HDRなので)
        console.error('invalid postprocess');
    }

    // console.log("--------- postprocess pass ---------");

    let prevRenderTarget: RenderTarget = renderer.afterDeferredShadingRenderTarget;
    const isCameraLastPassAndHasNotPostProcess = !camera.renderTarget && !hasEnabledPostProcessPass(camera);
    updatePostProcess(renderer.scenePostProcess);
    renderPostProcess(renderer.scenePostProcess, {
        gpu: renderer.gpu,
        renderer,
        prevRenderTarget,
        gBufferRenderTargets: renderer.gBufferRenderTargets,
        targetCamera: camera,
        time, // TODO: engineから渡したい
        isCameraLastPass: isCameraLastPassAndHasNotPostProcess,
        onAfterRenderPass: (pass) => {
            if (pass === renderer.toneMappingPass) {
                renderAfterToneMappingPass(
                    renderer,
                    camera,
                    renderMeshInfoEachQueue[RenderQueueType.AfterTone],
                    renderMeshInfoEachQueue[RenderQueueType.Skybox],
                    lightActors,
                    renderer.copySceneDestRenderTarget.texture!
                );
            }
        }
        // lightActors,
    });

    if (isCameraLastPassAndHasNotPostProcess) {
        return;
    }

    prevRenderTarget = getPostProcessLastRenderTarget(renderer.scenePostProcess)!;

    if (hasEnabledPostProcessPass(camera)) {
        if (camera.postProcess) {
            updatePostProcess(camera.postProcess);
            renderPostProcess(camera.postProcess, {
                gpu: renderer.gpu,
                renderer,
                prevRenderTarget,
                // tone mapping 挟む場合
                // prevRenderTarget: this._toneMappingPass.renderTarget,
                gBufferRenderTargets: renderer.gBufferRenderTargets,
                targetCamera: camera,
                time, // TODO: engineから渡したい
                isCameraLastPass: !camera.renderTarget,
                lightActors,
            });
        }
    }
}

/**
 *
 * @param geometry
 * @param material
 */
export function renderMesh(renderer: Renderer, geometry: Geometry, material: Material) {
    // geometry.update();

    if (renderer.stats) {
        addDrawVertexCountStats(renderer.stats, geometry);
        incrementDrawCallStats(renderer.stats);
    }

    // console.log("===========")
    // console.log(`[Renderer.renderMesh] geometry`, geometry);
    // console.log(`[Renderer.renderMesh] mat: ${material.getName()}`, material.getShader());

    // vertex
    setGPUVertexArrayObject(renderer.gpu, geometry.vertexArrayObject);
    // material
    if (!material.shader) {
        // console.error('invalid material shader');
        return;
    }
    setGPUShader(renderer.gpu, material.shader); // TODO: ない場合を判定したい
    // uniforms
    setGPUUniforms(renderer.gpu, material.uniforms);

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
                console.error('invalid depth write');
                return;
        }
    }

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
    drawGPU(
        renderer.gpu,
        geometry.drawCount,
        material.primitiveType,
        !!material.depthTest,
        depthWrite,
        material.depthFuncType,
        material.blendType,
        material.faceSide,
        geometry.instanceCount
    );
}

export function buildRenderMeshInfo(actor: Mesh, queue: RenderQueueType, materialIndex: number = 0): RenderMeshInfo {
    return {
        actor,
        queue,
        materialIndex,
    };
}

export function setUniformBlockValue(
    renderer: Renderer,
    blockName: string,
    uniformName: string,
    value: UniformBufferObjectValue
) {
    const targetGlobalUniformBufferObject = renderer.globalUniformBufferObjects.find(
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

    updateUniformBufferValue(targetUbo, uniformName, targetUniformData.type, value);
}

export function depthPrePass(renderer: Renderer, depthPrePassRenderMeshInfos: RenderMeshInfo[], camera: Camera) {
    // console.log("--------- depth pre pass ---------");

    setRendererRenderTarget(renderer, renderer.depthPrePassRenderTarget, false, true);
    updateRendererCameraUniforms(renderer, camera);

    depthPrePassRenderMeshInfos.forEach(({ actor, materialIndex }) => {
        updateActorTransformUniforms(renderer, actor, camera);

        actor.depthMaterials.forEach((depthMaterial, i) => {
            if (!depthMaterial) {
                console.error('[Renderer.depthPrePass] invalid depth material');
                return;
            }

            if (!depthMaterial.canRender) {
                return;
            }

            if (i !== materialIndex) {
                return;
            }

            if (actor.materials[i].skipDepthPrePass) {
                return;
            }

            renderMesh(renderer, actor.geometry, depthMaterial);

            if (renderer.stats) {
                addPassInfoStats(renderer.stats, 'depth pre pass', actor.name, actor.geometry);
            }
        });
    });
}

function copyDepthTexture(renderer: Renderer) {
    setRenderTargetDepthTexture(renderer.copyDepthSourceRenderTarget, renderer.depthPrePassRenderTarget.depthTexture!);
    blitRenderTargetDepth(
        renderer.gpu,
        renderer.copyDepthSourceRenderTarget,
        renderer.copyDepthDestRenderTarget,
        renderer.realWidth,
        renderer.realHeight
    );
}

function copySceneTexture(renderer: Renderer, sceneTexture: Texture) {
    const tmpRenderTarget = renderer.renderTarget;
    setRendererRenderTarget(renderer, null, false, false);
    setRenderTargetTexture(renderer.copySceneSourceRenderTarget, sceneTexture);
    blitRenderTarget(
        renderer.gpu,
        renderer.copySceneSourceRenderTarget,
        renderer.copySceneDestRenderTarget,
        renderer.realWidth,
        renderer.realHeight
    );
    setRendererRenderTarget(renderer, tmpRenderTarget);
}

function shadowPass(
    renderer: Renderer,
    camera: Camera,
    castShadowLightActors: Light[],
    renderMeshInfoEachQueue: RenderMeshInfoEachQueue
) {
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

        // TODO: sortするのはbasepassだけでいい
        const currentCameraRenderMeshInfoEachPass = createRenderMeshInfosEachPass(
            renderMeshInfoEachQueue,
            lightActor.shadowCamera
        );

        const castShadowRenderMeshInfos = currentCameraRenderMeshInfoEachPass.basePass.filter(({ actor }) => {
            return actor.castShadow;
        });

        if (castShadowRenderMeshInfos.length < 1) {
            return;
        }

        setRendererRenderTarget(renderer, lightActor.shadowMap, false, true);
        // this.clear(0, 0, 0, 1);
        // this._gpu.clearDepth(0, 0, 0, 1);

        updateRendererCameraUniforms(renderer, lightActor.shadowCamera);

        castShadowRenderMeshInfos.forEach(({ actor, materialIndex }) => {
            // TODO: material 側でやった方がよい？
            updateActorTransformUniforms(renderer, actor, camera);

            updateMeshDepthMaterial(actor, { camera: lightActor.shadowCamera! });

            actor.depthMaterials.forEach((depthMaterial, i) => {
                // TODO: material 側でやった方がよい？
                if (!depthMaterial) {
                    console.error('invalid target material');
                    return;
                }

                if (i !== materialIndex) {
                    return;
                }

                if (!depthMaterial.canRender) {
                    return;
                }

                setMaterialUniformValue(
                    depthMaterial,
                    UniformNames.DepthTexture,
                    renderer.copyDepthDestRenderTarget.depthTexture
                );

                renderMesh(renderer, actor.geometry, depthMaterial);
                if (renderer.stats) {
                    addPassInfoStats(renderer.stats, 'shadow pass', actor.name, actor.geometry);
                }
            });
        });
    });
}

function skyboxPass(renderer: Renderer, sortedSkyboxPassRenderMeshInfos: RenderMeshInfo[], camera: Camera) {
    updateRendererCameraUniforms(renderer, camera);

    sortedSkyboxPassRenderMeshInfos.forEach(({ actor, materialIndex }) => {
        if (!(actor as Skybox).renderMesh) {
            return;
        }

        // TODO: skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
        // TODO: engineでやるべき
        updateActorTransform(actor, camera);

        actor.materials.forEach((targetMaterial, i) => {
            if (i !== materialIndex) {
                return;
            }

            if (!targetMaterial.canRender) {
                return;
            }

            // TODO: material 側でやった方がよい？
            updateActorTransformUniforms(renderer, actor, camera);

            updateMeshMaterial(actor, { camera });

            renderMesh(renderer, actor.geometry, targetMaterial);

            if (renderer.stats) {
                addPassInfoStats(renderer.stats, 'skybox pass', actor.name, actor.geometry);
            }
        });
    });
}

function renderBasePass(
    renderer: Renderer,
    camera: Camera,
    sortedBasePassRenderMeshInfos: RenderMeshInfo[],
    sortedSkyboxPassRenderMeshInfos: RenderMeshInfo[]
) {
    // console.log("--------- scene pass ---------");

    // setGBufferRenderTargetsDepthTexture(renderer.gBufferRenderTargets, renderer.depthPrePassRenderTarget.depthTexture!);
    // setRendererRenderTarget(renderer, renderer.gBufferRenderTargets);

    // setRenderTargetDepthTexture(renderer.deferredShadingPass.renderTarget, renderer.depthPrePassRenderTarget.depthTexture!)
    // setRendererRenderTarget(renderer, renderer.deferredShadingPass.renderTarget, false, false);

    // TODO: depth prepass しない場合は必要
    // if (clear) {
    //     this.clear(cameras.clearColor.x, cameras.clearColor.y, cameras.clearColor.z, cameras.clearColor.w);
    // }

    updateRendererCameraUniforms(renderer, camera);

    sortedBasePassRenderMeshInfos.forEach(({ actor, materialIndex }) => {
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

        actor.materials.forEach((targetMaterial, i) => {
            if (i !== materialIndex) {
                return;
            }

            if (!targetMaterial.canRender) {
                return;
            }

            // pre-passしてないmaterialの場合はdepthをcopy.
            // pre-passしてないmaterialが存在する度にdepthをcopyする必要があるので、使用は最小限にとどめる（raymarch以外では使わないなど）
            if (targetMaterial.skipDepthPrePass) {
                setRendererRenderTarget(renderer, null, false, false);
                copyDepthTexture(renderer);
                setRendererRenderTarget(renderer, renderer.gBufferRenderTargets, false, false);
            }

            // TODO: material 側でやった方がよい？
            updateActorTransformUniforms(renderer, actor, camera);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            setMaterialUniformValue(
                targetMaterial,
                UniformNames.DepthTexture,
                renderer.copyDepthDestRenderTarget.depthTexture
            );

            // TODO:
            // - light actor の中で lightの種類別に処理を分ける
            // - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意
            // lightActors.forEach((light) => {
            //     light.applyUniformsValues(targetMaterial);
            // });
            // TODO: g-bufferの時にはlightのuniformsを設定しなくて大丈夫になったのでいらないはず
            // applyLightShadowMapUniformValues(targetMaterial, lightActors);

            // TODO: skyboxは一個という前提にしているが・・・
            updateMeshMaterial(actor, {
                camera,
                skybox:
                    sortedSkyboxPassRenderMeshInfos.length !== 0
                        ? (sortedSkyboxPassRenderMeshInfos[0].actor as Skybox)
                        : null,
            });
            // updateMeshMaterial(actor, { camera });

            renderMesh(renderer, actor.geometry, targetMaterial);

            if (renderer.stats) {
                addPassInfoStats(renderer.stats, 'scene pass', actor.name, actor.geometry);
            }
        });
    });
}

function renderTransparentPass(
    renderer: Renderer,
    camera: Camera,
    sortedRenderMeshInfos: RenderMeshInfo[],
    sortedSkyboxPassRenderMeshInfos: RenderMeshInfo[],
    lightActors: LightActors,
    sceneTexture: Texture
) {
    // console.log("--------- transparent pass ---------");

    // TODO: 常にclearしない、で良い気がする
    // if (clear) {
    //     this._gpu.clear(cameras.clearColor.x, cameras.clearColor.y, cameras.clearColor.z, cameras.clearColor.w);
    // }
    updateRendererCameraUniforms(renderer, camera);

    sortedRenderMeshInfos.forEach(({ actor, materialIndex }) => {
        actor.materials.forEach((targetMaterial, i) => {
            if (i !== materialIndex) {
                return;
            }

            updateActorTransformUniforms(renderer, actor, camera);

            applyLightShadowMapUniformValues(targetMaterial, lightActors, renderer.gpu.dummyTextureBlack);

            setMaterialUniformValue(targetMaterial, UniformNames.SceneTexture, sceneTexture);

            // TODO: skyboxは一個という前提にしているが・・・
            updateMeshMaterial(actor, {
                camera,
                skybox:
                    sortedSkyboxPassRenderMeshInfos.length !== 0
                        ? (sortedSkyboxPassRenderMeshInfos[0].actor as Skybox)
                        : null,
            });
            // updateMeshMaterial(actor, { camera });

            renderMesh(renderer, actor.geometry, targetMaterial);

            if (renderer.stats) {
                addPassInfoStats(renderer.stats, 'transparent pass', actor.name, actor.geometry);
            }
        });
    });
}

function renderAfterToneMappingPass(
    renderer: Renderer,
    camera: Camera,
    sortedRenderMeshInfos: RenderMeshInfo[],
    sortedSkyboxPassRenderMeshInfos: RenderMeshInfo[],
    lightActors: LightActors,
    sceneTexture: Texture
) {
    // console.log("--------- transparent pass ---------");

    // TODO: 常にclearしない、で良い気がする
    // if (clear) {
    //     this._gpu.clear(cameras.clearColor.x, cameras.clearColor.y, cameras.clearColor.z, cameras.clearColor.w);
    // }
    updateRendererCameraUniforms(renderer, camera);

    sortedRenderMeshInfos.forEach(({ actor, materialIndex }) => {
        actor.materials.forEach((targetMaterial, i) => {
            if (i !== materialIndex) {
                return;
            }

            updateActorTransformUniforms(renderer, actor, camera);

            applyLightShadowMapUniformValues(targetMaterial, lightActors, renderer.gpu.dummyTextureBlack);

            setMaterialUniformValue(targetMaterial, UniformNames.SceneTexture, sceneTexture);

            // TODO: skyboxは一個という前提にしているが・・・
            updateMeshMaterial(actor, {
                camera,
                skybox:
                    sortedSkyboxPassRenderMeshInfos.length !== 0
                        ? (sortedSkyboxPassRenderMeshInfos[0].actor as Skybox)
                        : null,
            });
            // updateMeshMaterial(actor, { camera });

            renderMesh(renderer, actor.geometry, targetMaterial);

            if (renderer.stats) {
                addPassInfoStats(renderer.stats, 'after tone mapping pass', actor.name, actor.geometry);
            }
        });
    });
}



function updateActorTransformUniforms(renderer: Renderer, actor: Actor, camera: Camera) {
    setUniformBlockValue(
        renderer,
        UniformBlockNames.Transformations,
        UniformNames.WorldMatrix,
        actor.transform.worldMatrix
    );
    setUniformBlockValue(
        renderer,
        UniformBlockNames.Transformations,
        UniformNames.InverseWorldMatrix,
        actor.transform.worldMatrix
        // invertMat4(actor.transform.worldMatrix) // TODO: こっちの方が正しいが・・・
    );
    setUniformBlockValue(
        renderer,
        UniformBlockNames.Transformations,
        UniformNames.WVPMatrix,
        multiplyMat4Array(camera.viewProjectionMatrix, actor.transform.worldMatrix)
    );
    setUniformBlockValue(
        renderer,
        UniformBlockNames.Transformations,
        UniformNames.NormalMatrix,
        actor.transform.normalMatrix
    );
}

export function updateRendererCameraUniforms(renderer: Renderer, camera: Camera) {
    setUniformBlockValue(renderer, UniformBlockNames.Transformations, UniformNames.ViewMatrix, camera.viewMatrix);
    setUniformBlockValue(
        renderer,
        UniformBlockNames.Transformations,
        UniformNames.ProjectionMatrix,
        camera.projectionMatrix
    );
    setUniformBlockValue(
        renderer,
        UniformBlockNames.Camera,
        UniformNames.ViewPosition,
        getMat4Position(camera.transform.worldMatrix)
    );
    setUniformBlockValue(renderer, UniformBlockNames.Camera, UniformNames.ViewDirection, getCameraForward(camera));
    setUniformBlockValue(renderer, UniformBlockNames.Camera, UniformNames.CameraNear, camera.near);
    setUniformBlockValue(renderer, UniformBlockNames.Camera, UniformNames.CameraFar, camera.far);
    setUniformBlockValue(
        renderer,
        UniformBlockNames.Camera,
        UniformNames.CameraAspect,
        isPerspectiveCamera(camera) ? (camera as PerspectiveCamera).aspect : (camera as OrthographicCamera).aspect
    );
    setUniformBlockValue(
        renderer,
        UniformBlockNames.Camera,
        UniformNames.CameraFov,
        isPerspectiveCamera(camera) ? (camera as PerspectiveCamera).fov : 0
    );
    setUniformBlockValue(
        renderer,
        UniformBlockNames.Transformations,
        UniformNames.ViewProjectionMatrix,
        camera.viewProjectionMatrix
    );
    setUniformBlockValue(
        renderer,
        UniformBlockNames.Transformations,
        UniformNames.InverseViewMatrix,
        camera.inverseViewMatrix
    );
    setUniformBlockValue(
        renderer,
        UniformBlockNames.Transformations,
        UniformNames.InverseProjectionMatrix,
        camera.inverseProjectionMatrix
    );
    setUniformBlockValue(
        renderer,
        UniformBlockNames.Transformations,
        UniformNames.InverseViewProjectionMatrix,
        camera.inverseViewProjectionMatrix
    );
    setUniformBlockValue(
        renderer,
        UniformBlockNames.Transformations,
        UniformNames.TransposeInverseViewMatrix,
        transposeMat4(invertMat4(cloneMat4(camera.viewMatrix)))
    );
}

function updateUniformBlockValue(
    renderer: Renderer,
    blockName: string,
    uniformName: string,
    value: UniformBufferObjectValue,
    showLog: boolean = false
) {
    const targetGlobalUniformBufferObject = renderer.globalUniformBufferObjects.find(
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
                updateUniformBufferData(targetUbo, structElementName, new Float32Array(data));
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
                    updateUniformBufferData(targetUbo, structElementName, new Float32Array(data), showLog);
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
                updateUniformBufferData(targetUbo, uniformName, new Float32Array(data));
            } else {
                updateUniformBufferData(
                    targetUbo,
                    uniformName,
                    typeof value === 'number'
                        ? new Float32Array([value])
                        : (value as Vector2 | Vector3 | Vector4 | Matrix4 | Color).e
                );
            }
            break;
    }
}

function updateCommonUniforms(renderer: Renderer, { time, deltaTime }: { time: number; deltaTime: number }) {
    // passMaterial.uniforms.setValue(UniformNames.Time, time);
    updateUniformBlockValue(renderer, UniformBlockNames.Common, UniformNames.Time, time);
    updateUniformBlockValue(renderer, UniformBlockNames.Common, UniformNames.DeltaTime, deltaTime);
    updateUniformBlockValue(
        renderer,
        UniformBlockNames.Common,
        UniformNames.Viewport,
        createVector4(renderer.realWidth, renderer.realHeight, renderer.realWidth / renderer.realHeight, 0)
    );
}

export function updateTimelineUniforms(renderer: Renderer, timelineTime: number, timelineDeltaTime: number) {
    // passMaterial.uniforms.setValue(UniformNames.Time, time);
    updateUniformBlockValue(renderer, UniformBlockNames.Timeline, UniformNames.TimelineTime, timelineTime);
    updateUniformBlockValue(renderer, UniformBlockNames.Timeline, UniformNames.TimelineDeltaTime, timelineDeltaTime);
    // for debug
    // console.log(timelineTime, timelineDeltaTime);
}

function updateDirectionalLightUniforms(renderer: Renderer, directionalLight: DirectionalLight) {
    updateUniformBlockValue(renderer, UniformBlockNames.DirectionalLight, UniformNames.DirectionalLight, [
        {
            name: UniformNames.LightDirection,
            type: UniformTypes.Vector3,
            // // pattern: normalizeし、光源の位置から降り注ぐとみなす
            // value: normalizeVector3(negateVector3(cloneVector3(directionalLight.transform.position))),
            // pattern: 回転を適用
            value: rotateVectorByQuaternion(createVector3(0, 0, -1), directionalLight.transform.rotation.quaternion),
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

function updateSpotLightsUniforms(renderer: Renderer, spotLights: SpotLight[]) {
    updateUniformBlockValue(
        renderer,
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
                    value: cloneVector3(getWorldForward(spotLight.transform)),
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

function updatePointLightsUniforms(renderer: Renderer, pointLights: PointLight[]) {
    updateUniformBlockValue(
        renderer,
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
                    value: pointLight.transform.position,
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

function createRenderMeshInfosEachPass(
    renderMeshInfoEachQueue: RenderMeshInfoEachQueue,
    camera: Camera
): RenderMeshInfosEachPass {
    const basePass = [RenderQueueType.Opaque, RenderQueueType.AlphaTest]
        .map((queue) => {
            return [...renderMeshInfoEachQueue[queue]].sort((a, b) => {
                const al = getVector3Magnitude(subVectorsV3(camera.transform.position, a.actor.transform.position));
                const bl = getVector3Magnitude(subVectorsV3(camera.transform.position, b.actor.transform.position));
                return al < bl ? -1 : 1;
            });
        })
        .flat();

    const skyboxPass = [...renderMeshInfoEachQueue[RenderQueueType.Skybox]].sort((a, b) => {
        const al = getVector3Magnitude(subVectorsV3(camera.transform.position, a.actor.transform.position));
        const bl = getVector3Magnitude(subVectorsV3(camera.transform.position, b.actor.transform.position));
        return al < bl ? -1 : 1;
    });
    
    const afterTonePass = [...renderMeshInfoEachQueue[RenderQueueType.AfterTone]].sort((a, b) => {
        const al = getVector3Magnitude(subVectorsV3(camera.transform.position, a.actor.transform.position));
        const bl = getVector3Magnitude(subVectorsV3(camera.transform.position, b.actor.transform.position));
        return al >= bl ? -1 : 1;
    });

    const transparentPass = [...renderMeshInfoEachQueue[RenderQueueType.Transparent]].sort((a, b) => {
        const al = getVector3Magnitude(subVectorsV3(camera.transform.position, a.actor.transform.position));
        const bl = getVector3Magnitude(subVectorsV3(camera.transform.position, b.actor.transform.position));
        return al >= bl ? -1 : 1;
    });

    return {
        basePass,
        skyboxPass,
        afterTonePass,
        transparentPass,
    };
}
