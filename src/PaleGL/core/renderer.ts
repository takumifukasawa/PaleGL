import { Actor } from '@/PaleGL/actors/actor.ts';
import { updateActorTransform } from '@/PaleGL/actors/actorBehaviours.ts';
import { Camera, CameraRenderTargetType } from '@/PaleGL/actors/cameras/camera.ts';
import {
    getCameraForward,
    hasEnabledPostProcessPass,
    isPerspectiveCamera,
} from '@/PaleGL/actors/cameras/cameraBehaviours.ts';
import { OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import { createFullQuadOrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/cameras/perspectiveCamera.ts';
import { DirectionalLight } from '@/PaleGL/actors/lights/directionalLight.ts';
import { Light } from '@/PaleGL/actors/lights/light.ts';
import { needsCastShadowOfLight } from '@/PaleGL/actors/lights/lightBehaviours.ts';
import { PointLight } from '@/PaleGL/actors/lights/pointLight.ts';
import { getSpotLightConeCos, getSpotLightPenumbraCos, SpotLight } from '@/PaleGL/actors/lights/spotLight.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import {
    getMeshMaterial,
    setUniformValueToAllMeshMaterials,
    updateMeshDepthMaterial,
    updateMeshMaterial,
} from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { Skybox } from '@/PaleGL/actors/meshes/skybox.ts';
import { SpriteAtlasMesh } from '@/PaleGL/actors/meshes/SpriteAtlasMesh.ts';
import { UIMesh } from '@/PaleGL/actors/meshes/uiMesh.ts';
import { PostProcessVolume } from '@/PaleGL/actors/volumes/postProcessVolume.ts';
import {
    // ActorType,
    ACTOR_TYPE_MESH,
    ACTOR_TYPE_LIGHT,
    // ACTOR_TYPE_CAMERA,
    ACTOR_TYPE_SKYBOX,
    // BlendType,
    BLEND_TYPE_OPAQUE,
    BLEND_TYPE_TRANSPARENT,
    BLEND_TYPE_ADDITIVE,
    // LightType,
    LIGHT_TYPE_DIRECTIONAL,
    LIGHT_TYPE_SPOT,
    LIGHT_TYPE_POINT,
    MAX_POINT_LIGHT_COUNT,
    MAX_SPOT_LIGHT_COUNT,
    // MeshType,
    // MESH_TYPE_SKINNED,
    // MESH_TYPE_TEXT,
    MESH_TYPE_SPRITE_ATLAS,
    ACTOR_TYPE_POST_PROCESS_VOLUME,
    RenderQueueType,
    RENDER_QUEUE_TYPE_OPAQUE,
    RENDER_QUEUE_TYPE_ALPHA_TEST,
    RENDER_QUEUE_TYPE_SKYBOX,
    RENDER_QUEUE_TYPE_TRANSPARENT,
    RENDER_QUEUE_TYPE_AFTER_TONE,
    RENDER_QUEUE_TYPE_OVERLAY,
    RENDER_TARGET_TYPE_DEPTH,
    RENDER_TARGET_TYPE_EMPTY,
    RENDER_TARGET_TYPE_R11F_G11F_B10F,
    TEXTURE_DEPTH_PRECISION_TYPE_HIGH,
    // UIQueueType,
    UI_QUEUE_TYPE_AFTER_TONE,
    UI_QUEUE_TYPE_OVERLAY,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_BLOCK_NAME_DIRECTIONAL_LIGHT,
    UNIFORM_BLOCK_NAME_SPOT_LIGHT,
    UNIFORM_BLOCK_NAME_POINT_LIGHT,
    UNIFORM_BLOCK_NAME_TIMELINE,
    UNIFORM_NAME_CAMERA_ASPECT,
    UNIFORM_NAME_CAMERA_FAR,
    UNIFORM_NAME_CAMERA_FOV,
    UNIFORM_NAME_CAMERA_NEAR,
    UNIFORM_NAME_DELTA_TIME,
    UNIFORM_NAME_DEPTH_TEXTURE,
    UNIFORM_NAME_DIRECTIONAL_LIGHT,
    UNIFORM_NAME_DIRECTIONAL_LIGHT_SHADOW_MAP,
    UNIFORM_NAME_FONT_TILING,
    UNIFORM_NAME_INVERSE_PROJECTION_MATRIX,
    UNIFORM_NAME_INVERSE_VIEW_MATRIX,
    UNIFORM_NAME_INVERSE_VIEW_PROJECTION_MATRIX,
    UNIFORM_NAME_INVERSE_WORLD_MATRIX,
    UNIFORM_NAME_LIGHT_ATTENUATION,
    UNIFORM_NAME_LIGHT_COLOR,
    UNIFORM_NAME_LIGHT_CONE_COS,
    UNIFORM_NAME_LIGHT_DIRECTION,
    UNIFORM_NAME_LIGHT_DISTANCE,
    UNIFORM_NAME_LIGHT_INTENSITY,
    UNIFORM_NAME_LIGHT_PENUMBRA_COS,
    UNIFORM_NAME_LIGHT_POSITION,
    UNIFORM_NAME_NORMAL_MATRIX,
    UNIFORM_NAME_POINT_LIGHT,
    UNIFORM_NAME_PROJECTION_MATRIX,
    UNIFORM_NAME_SCENE_TEXTURE,
    UNIFORM_NAME_SHADOW_MAP_PROJECTION_MATRIX,
    UNIFORM_NAME_SPOT_LIGHT,
    UNIFORM_NAME_SPOT_LIGHT_SHADOW_MAP,
    UNIFORM_NAME_TIME,
    UNIFORM_NAME_TIMELINE_DELTA_TIME,
    UNIFORM_NAME_TIMELINE_TIME,
    UNIFORM_NAME_TRANSPOSE_INVERSE_VIEW_MATRIX,
    UNIFORM_NAME_VIEWPORT,
    UNIFORM_NAME_VIEW_DIRECTION,
    UNIFORM_NAME_VIEW_MATRIX,
    UNIFORM_NAME_VIEW_POSITION,
    UNIFORM_NAME_VIEW_PROJECTION_MATRIX,
    UNIFORM_NAME_WORLD_MATRIX,
    UNIFORM_NAME_WVP_MATRIX,

    UNIFORM_TYPE_INT,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_BOOL,
    UNIFORM_TYPE_VECTOR2,
    UNIFORM_TYPE_VECTOR3,
    UNIFORM_TYPE_VECTOR4,
    UNIFORM_TYPE_MATRIX4,
    UNIFORM_TYPE_COLOR,
    UNIFORM_TYPE_STRUCT,
    UNIFORM_TYPE_STRUCT_ARRAY,
    UniformTypes,
} from '@/PaleGL/constants';
import { replaceShaderIncludes } from '@/PaleGL/core/buildShader.ts';
import { SharedTextures, SharedTexturesTypes } from '@/PaleGL/core/createSharedTextures.ts';
import {
    createGBufferRenderTargets,
    GBufferRenderTargets,
    setGBufferRenderTargetsDepthTexture,
    setGBufferRenderTargetsSize,
} from '@/PaleGL/core/gBufferRenderTargets.ts';
import {
    bindGPUUniformBlockAndGetBlockIndex,
    clearGPUColor,
    clearGPUDepth,
    createGPUUniformBufferObject,
    drawGPU,
    flushGPU,
    getDummyBlackTexture,
    getDummyWhiteTexture,
    Gpu,
    setGPUFramebuffer,
    setGPUShader,
    setGPUUniforms,
    setGPUVertexArrayObject,
    setGPUViewport,
} from '@/PaleGL/core/gpu.ts';
import {
    copyRenderTargetColor,
    copyRenderTargetDepth,
    createRenderTarget,
    RenderTarget,
    setRenderTargetDepthTexture,
    setRenderTargetSize,
    setRenderTargetTexture,
} from '@/PaleGL/core/renderTarget.ts';
import { Scene, traverseScene } from '@/PaleGL/core/scene.ts';
import { createShader } from '@/PaleGL/core/shader.ts';
import { Texture } from '@/PaleGL/core/texture.ts';
import { getWorldForward } from '@/PaleGL/core/transform.ts';
import {
    UniformBufferObject,
    updateUniformBufferData,
    updateUniformBufferValue,
} from '@/PaleGL/core/uniformBufferObject.ts';
import {
    addUniformBlock,
    UniformBufferObjectBlockData,
    UniformBufferObjectElementValueArray,
    UniformBufferObjectElementValueNoNeedsPadding,
    UniformBufferObjectStructArrayValue,
    UniformBufferObjectStructValue,
    UniformBufferObjectValue,
} from '@/PaleGL/core/uniforms.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { getGeometryAttributeDescriptors } from '@/PaleGL/geometries/geometryBehaviours.ts';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import {
    isCompiledMaterialShader,
    Material,
    setMaterialUniformValue,
    startMaterial,
} from '@/PaleGL/materials/material.ts';
import { Color, createColorBlack } from '@/PaleGL/math/color.ts';
import {
    cloneMat4,
    createMat4Identity,
    getMat4Position,
    invertMat4,
    Matrix4,
    multiplyMat4Array,
    transposeMat4,
} from '@/PaleGL/math/matrix4.ts';
import { Vector2 } from '@/PaleGL/math/vector2.ts';
import {
    cloneVector3,
    createVector3Zero,
    getVector3Magnitude,
    negateVector3,
    normalizeVector3,
    subVectorsV3,
    subVectorsV3Ref,
    Vector3,
} from '@/PaleGL/math/vector3.ts';
import { createVector4, createVector4zero, Vector4 } from '@/PaleGL/math/vector4.ts';
import { BloomPass, createBloomPass } from '@/PaleGL/postprocess/bloomPass.ts';
import {
    ChromaticAberrationPass,
    createChromaticAberrationPass,
} from '@/PaleGL/postprocess/chromaticAberrationPass.ts';
import {
    createDeferredShadingPass,
    DeferredShadingPass,
    updateMaterialSkyboxUniforms,
} from '@/PaleGL/postprocess/deferredShadingPass.ts';
import { createDepthOfFieldPass, DepthOfFieldPass } from '@/PaleGL/postprocess/depthOfFieldPass.ts';
import { createFogPass, FogPass, setFogPassTextures } from '@/PaleGL/postprocess/fogPass.ts';
import { createFXAAPass, FxaaPass } from '@/PaleGL/postprocess/fxaaPass.ts';
import { createGlitchPass, GlitchPass } from '@/PaleGL/postprocess/glitchPass.ts';
import {
    createLightShaftPass,
    getLightShaftPassRenderTarget,
    LightShaftPass,
    setLightShaftPassDirectionalLight,
} from '@/PaleGL/postprocess/lightShaftPass.ts';
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
import { setPostProcessPassSize } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import { createScreenSpaceShadowPass, ScreenSpaceShadowPass } from '@/PaleGL/postprocess/screenSpaceShadowPass.ts';
import { createSSAOPass, SsaoPass } from '@/PaleGL/postprocess/ssaoPass.ts';
import { createSSRPass, SsrPass } from '@/PaleGL/postprocess/ssrPass.ts';
import { createStreakPass, StreakPass } from '@/PaleGL/postprocess/streakPass.ts';
import { createToneMappingPass, ToneMappingPass } from '@/PaleGL/postprocess/toneMappingPass.ts';
import { createVignettePass, VignettePass } from '@/PaleGL/postprocess/vignettePass.ts';
import {
    createVolumetricLightPass,
    setVolumetricLightPassSpotLights,
    VolumetricLightPass,
} from '@/PaleGL/postprocess/volumetricLightPass.ts';
import globalUniformBufferObjectFragmentShader from '@/PaleGL/shaders/global-uniform-buffer-object-fragment.glsl';
import globalUniformBufferObjectVertexShader from '@/PaleGL/shaders/global-uniform-buffer-object-vertex.glsl';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { addDrawVertexCountStats, addPassInfoStats, incrementDrawCallStats, Stats } from '@/PaleGL/utilities/stats.ts';

type RenderMeshInfo = { actor: Mesh; materialIndex: number; queue: RenderQueueType; cb?: () => void };

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
        UNIFORM_NAME_DIRECTIONAL_LIGHT_SHADOW_MAP,
        lightActors.directionalLight && lightActors.directionalLight.shadowMap
            ? lightActors.directionalLight.shadowMap.depthTexture
            : fallbackTexture
    );

    // spotlights
    const spotLightShadowMaps = maton.range(MAX_SPOT_LIGHT_COUNT).map((_, key) => {
        const spotLight = lightActors.spotLights[key];
        return spotLight && spotLight.shadowMap ? spotLight.shadowMap.depthTexture! : fallbackTexture;
    });
    setMaterialUniformValue(targetMaterial, UNIFORM_NAME_SPOT_LIGHT_SHADOW_MAP, spotLightShadowMaps);
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
    sharedQuad: Geometry;
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
    useDepthPrepass: boolean;
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

    const useDepthPrepass = true;

    const realWidth: number = 1;
    const realHeight: number = 1;
    const stats: Stats | null = null;
    const screenQuadCamera = createFullQuadOrthographicCamera();
    const sharedQuad = createPlaneGeometry({ gpu });
    const scenePostProcess = createPostProcess(screenQuadCamera);
    const depthPrePassRenderTarget = createRenderTarget({
        gpu,
        type: RENDER_TARGET_TYPE_DEPTH,
        width: 1,
        height: 1,
        name: 'depth pre-pass render target',
        depthPrecision: TEXTURE_DEPTH_PRECISION_TYPE_HIGH, // 低精度だとマッハバンドのような見た目になるので高精度にしておく
    });
    const gBufferRenderTargets = createGBufferRenderTargets({
        gpu,
        width: 1,
        height: 1,
        name: 'g-buffer render target',
        generateDepth: !useDepthPrepass,
    });
    const afterDeferredShadingRenderTarget = createRenderTarget({
        gpu,
        type: RENDER_TARGET_TYPE_EMPTY,
        width: 1,
        height: 1,
        name: 'after g-buffer render target',
    });
    const copyDepthSourceRenderTarget: RenderTarget = createRenderTarget({
        gpu,
        type: RENDER_TARGET_TYPE_EMPTY,
        width: 1,
        height: 1,
        name: 'copy depth source render target',
        depthPrecision: TEXTURE_DEPTH_PRECISION_TYPE_HIGH, // 低精度だとマッハバンドのような見た目になるので高精度にしておく
    });
    const copyDepthDestRenderTarget = createRenderTarget({
        gpu,
        type: RENDER_TARGET_TYPE_DEPTH,
        width: 1,
        height: 1,
        name: 'copy depth dest render target',
        depthPrecision: TEXTURE_DEPTH_PRECISION_TYPE_HIGH, // 低精度だとマッハバンドのような見た目になるので高精度にしておく
    });
    const copySceneSourceRenderTarget = createRenderTarget({
        gpu,
        type: RENDER_TARGET_TYPE_EMPTY,
        width: 1,
        height: 1,
        name: 'copy scene source render target',
    });
    const copySceneDestRenderTarget = createRenderTarget({
        gpu,
        type: RENDER_TARGET_TYPE_R11F_G11F_B10F,
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

    const uniformBufferObjectShader = createShader(
        gpu,
        replaceShaderIncludes(globalUniformBufferObjectVertexShader),
        replaceShaderIncludes(globalUniformBufferObjectFragmentShader)
    );

    const transformationsUniformBlockData: UniformBufferObjectBlockData = [
        {
            name: UNIFORM_NAME_WORLD_MATRIX,
            type: UNIFORM_TYPE_MATRIX4,
            value: createMat4Identity(),
        },
        {
            name: UNIFORM_NAME_VIEW_MATRIX,
            type: UNIFORM_TYPE_MATRIX4,
            value: createMat4Identity(),
        },
        {
            name: UNIFORM_NAME_PROJECTION_MATRIX,
            type: UNIFORM_TYPE_MATRIX4,
            value: createMat4Identity(),
        },
        {
            name: UNIFORM_NAME_WVP_MATRIX,
            type: UNIFORM_TYPE_MATRIX4,
            value: createMat4Identity(),
        },
        {
            name: UNIFORM_NAME_NORMAL_MATRIX,
            type: UNIFORM_TYPE_MATRIX4,
            value: createMat4Identity(),
        },
        {
            name: UNIFORM_NAME_INVERSE_WORLD_MATRIX,
            type: UNIFORM_TYPE_MATRIX4,
            value: createMat4Identity(),
        },
        {
            name: UNIFORM_NAME_VIEW_PROJECTION_MATRIX,
            type: UNIFORM_TYPE_MATRIX4,
            value: createMat4Identity(),
        },
        {
            name: UNIFORM_NAME_INVERSE_VIEW_MATRIX,
            type: UNIFORM_TYPE_MATRIX4,
            value: createMat4Identity(),
        },
        {
            name: UNIFORM_NAME_INVERSE_PROJECTION_MATRIX,
            type: UNIFORM_TYPE_MATRIX4,
            value: createMat4Identity(),
        },
        {
            name: UNIFORM_NAME_INVERSE_VIEW_PROJECTION_MATRIX,
            type: UNIFORM_TYPE_MATRIX4,
            value: createMat4Identity(),
        },
        {
            name: UNIFORM_NAME_TRANSPOSE_INVERSE_VIEW_MATRIX,
            type: UNIFORM_TYPE_MATRIX4,
            value: createMat4Identity(),
        },
    ];

    globalUniformBufferObjects.push({
        uniformBufferObject: createGPUUniformBufferObject(
            gpu,
            uniformBufferObjectShader,
            UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
            transformationsUniformBlockData
        ),
        data: transformationsUniformBlockData,
    });

    const cameraUniformBufferData: UniformBufferObjectBlockData = [
        {
            name: UNIFORM_NAME_VIEW_POSITION,
            type: UNIFORM_TYPE_VECTOR3,
            value: createVector3Zero(),
        },
        {
            name: UNIFORM_NAME_VIEW_DIRECTION,
            type: UNIFORM_TYPE_VECTOR3,
            value: createVector3Zero(),
        },
        {
            name: UNIFORM_NAME_CAMERA_NEAR,
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: UNIFORM_NAME_CAMERA_FAR,
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: UNIFORM_NAME_CAMERA_ASPECT,
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: UNIFORM_NAME_CAMERA_FOV,
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
    ];
    globalUniformBufferObjects.push({
        uniformBufferObject: createGPUUniformBufferObject(
            gpu,
            uniformBufferObjectShader,
            UNIFORM_BLOCK_NAME_CAMERA,
            cameraUniformBufferData
        ),
        data: cameraUniformBufferData,
    });

    const directionalLightUniformBufferData: UniformBufferObjectBlockData = [
        {
            name: UNIFORM_NAME_DIRECTIONAL_LIGHT,
            type: UNIFORM_TYPE_STRUCT,
            value: [
                {
                    name: UNIFORM_NAME_LIGHT_DIRECTION,
                    type: UNIFORM_TYPE_VECTOR3,
                    value: createVector3Zero(),
                },
                {
                    name: UNIFORM_NAME_LIGHT_INTENSITY,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 0,
                },
                {
                    name: UNIFORM_NAME_LIGHT_COLOR,
                    type: UNIFORM_TYPE_COLOR,
                    value: createColorBlack(),
                },
                {
                    name: UNIFORM_NAME_SHADOW_MAP_PROJECTION_MATRIX,
                    type: UNIFORM_TYPE_MATRIX4,
                    value: createMat4Identity(),
                },
            ],
        },
    ];
    globalUniformBufferObjects.push({
        uniformBufferObject: createGPUUniformBufferObject(
            gpu,
            uniformBufferObjectShader,
            UNIFORM_BLOCK_NAME_DIRECTIONAL_LIGHT,
            directionalLightUniformBufferData
        ),
        data: directionalLightUniformBufferData,
    });

    const spotLightUniformBufferData: UniformBufferObjectBlockData = [
        {
            name: UNIFORM_NAME_SPOT_LIGHT,
            type: UNIFORM_TYPE_STRUCT_ARRAY,
            value: maton.range(MAX_SPOT_LIGHT_COUNT).map((): UniformBufferObjectStructValue => [
                {
                    name: UNIFORM_NAME_LIGHT_COLOR,
                    type: UNIFORM_TYPE_COLOR,
                    value: createColorBlack(),
                },
                {
                    name: UNIFORM_NAME_LIGHT_POSITION,
                    type: UNIFORM_TYPE_VECTOR3,
                    value: createVector3Zero(),
                },
                {
                    name: UNIFORM_NAME_LIGHT_DIRECTION,
                    type: UNIFORM_TYPE_VECTOR3,
                    value: createVector3Zero(),
                },
                {
                    name: UNIFORM_NAME_LIGHT_INTENSITY,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 0,
                },
                {
                    name: UNIFORM_NAME_LIGHT_DISTANCE,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 0,
                },
                {
                    name: UNIFORM_NAME_LIGHT_ATTENUATION,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 0,
                },
                {
                    name: UNIFORM_NAME_LIGHT_CONE_COS,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 0,
                },
                {
                    name: UNIFORM_NAME_LIGHT_PENUMBRA_COS,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 0,
                },
                {
                    name: UNIFORM_NAME_SHADOW_MAP_PROJECTION_MATRIX,
                    type: UNIFORM_TYPE_MATRIX4,
                    value: createMat4Identity(),
                },
            ]) as UniformBufferObjectStructArrayValue,
        },
    ];
    globalUniformBufferObjects.push({
        uniformBufferObject: createGPUUniformBufferObject(
            gpu,
            uniformBufferObjectShader,
            UNIFORM_BLOCK_NAME_SPOT_LIGHT,
            spotLightUniformBufferData
        ),
        data: spotLightUniformBufferData,
    });

    const pointLightUniformBufferData: UniformBufferObjectBlockData = [
        {
            name: UNIFORM_NAME_POINT_LIGHT,
            type: UNIFORM_TYPE_STRUCT_ARRAY,
            value: maton.range(MAX_POINT_LIGHT_COUNT).map((): UniformBufferObjectStructValue => [
                {
                    name: UNIFORM_NAME_LIGHT_COLOR,
                    type: UNIFORM_TYPE_COLOR,
                    value: createColorBlack(),
                },
                {
                    name: UNIFORM_NAME_LIGHT_POSITION,
                    type: UNIFORM_TYPE_VECTOR3,
                    value: createVector3Zero(),
                },
                {
                    name: UNIFORM_NAME_LIGHT_INTENSITY,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 0,
                },
                {
                    name: UNIFORM_NAME_LIGHT_DISTANCE,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 0,
                },
                {
                    name: UNIFORM_NAME_LIGHT_ATTENUATION,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 0,
                },
            ]) as UniformBufferObjectStructArrayValue,
        },
    ];
    globalUniformBufferObjects.push({
        uniformBufferObject: createGPUUniformBufferObject(
            gpu,
            uniformBufferObjectShader,
            UNIFORM_BLOCK_NAME_POINT_LIGHT,
            pointLightUniformBufferData
        ),
        data: pointLightUniformBufferData,
    });

    const timelineUniformBufferData: UniformBufferObjectBlockData = [
        {
            name: UNIFORM_NAME_TIMELINE_TIME,
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: UNIFORM_NAME_TIMELINE_DELTA_TIME,
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
    ];
    globalUniformBufferObjects.push({
        uniformBufferObject: createGPUUniformBufferObject(
            gpu,
            uniformBufferObjectShader,
            UNIFORM_BLOCK_NAME_TIMELINE,
            timelineUniformBufferData
        ),
        data: timelineUniformBufferData,
    });

    const commonUniformBlockData: UniformBufferObjectBlockData = [
        {
            name: UNIFORM_NAME_TIME,
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: UNIFORM_NAME_DELTA_TIME,
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: UNIFORM_NAME_VIEWPORT,
            type: UNIFORM_TYPE_VECTOR4,
            value: createVector4zero(),
        },
    ];
    // TODO: 一番最初の要素としてpushするとなぜかエラーになる
    globalUniformBufferObjects.push({
        uniformBufferObject: createGPUUniformBufferObject(
            gpu,
            uniformBufferObjectShader,
            UNIFORM_BLOCK_NAME_COMMON,
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
        sharedQuad,
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
        useDepthPrepass,
    };
}

export function setRendererStats(renderer: Renderer, stats: Stats | null) {
    renderer.stats = stats;
}

// TODO: materialのstartの中でやりたい
export function checkNeedsBindUniformBufferObjectToMaterial(renderer: Renderer, material: Material) {
    if (material.boundUniformBufferObjects) {
        return;
    }
    if (!material.shader) {
        return;
    }
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
    material.boundUniformBufferObjects = true;
}

export const tryStartMaterial = (gpu: Gpu, renderer: Renderer, geometry: Geometry, material: Material) => {
    if (!isCompiledMaterialShader(material)) {
        startMaterial(material, {
            gpu,
            attributeDescriptors: getGeometryAttributeDescriptors(geometry),
        });
        checkNeedsBindUniformBufferObjectToMaterial(renderer, material);
    }
};

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

// TODO: 本当はclearcolorの色も渡せるとよい
export function setRenderTargetToRendererAndClear(
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

// render target に焼いて元の状態に戻す
export function blitRenderTarget(
    renderer: Renderer,
    renderTarget: CameraRenderTargetType,
    geometry: Geometry,
    material: Material
) {
    // 前の状態を保持
    const tmpRenderTarget = renderer.renderTarget;
    const tmpClearColorDirtyFlag = renderer.clearColorDirtyFlag;
    setRenderTargetToRendererAndClear(renderer, renderTarget, true, false);
    renderMesh(renderer, geometry, material);
    // アサインし直す
    renderer.renderTarget = tmpRenderTarget;
    renderer.clearColorDirtyFlag = tmpClearColorDirtyFlag;
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
        [RENDER_QUEUE_TYPE_OPAQUE]: [],
        [RENDER_QUEUE_TYPE_ALPHA_TEST]: [],
        [RENDER_QUEUE_TYPE_SKYBOX]: [],
        [RENDER_QUEUE_TYPE_TRANSPARENT]: [],
        [RENDER_QUEUE_TYPE_AFTER_TONE]: [],
        [RENDER_QUEUE_TYPE_OVERLAY]: [],
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
            case ACTOR_TYPE_SKYBOX:
                if (!actor.enabled) {
                    return;
                }
                renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_SKYBOX].push(
                    buildRenderMeshInfo(actor as Skybox, RENDER_QUEUE_TYPE_SKYBOX)
                );
                // TODO: skyboxの中で処理したい
                // actor.transform.parent = cameras.transform;
                return;
            case ACTOR_TYPE_MESH:
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
                    // switch (uiMesh.uiQueueType) {
                    //     case UI_QUEUE_TYPE_AFTER_TONE:
                    //         renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_AFTER_TONE].push(
                    //             buildRenderMeshInfo(mesh, RENDER_QUEUE_TYPE_AFTER_TONE, i)
                    //         );
                    //         break;
                    //     case UI_QUEUE_TYPE_OVERLAY:
                    //         renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_OVERLAY].push(
                    //             buildRenderMeshInfo(mesh, RENDER_QUEUE_TYPE_OVERLAY, i)
                    //         );
                    //         break;
                    //     default:
                    //         console.error('[renderRenderer] invalid ui queue type');
                    //         return;
                    // }
                    if ((mesh as UIMesh).uiQueueType === UI_QUEUE_TYPE_AFTER_TONE) {
                        renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_AFTER_TONE].push(
                            buildRenderMeshInfo(mesh, RENDER_QUEUE_TYPE_AFTER_TONE, i)
                        );
                        return;
                    }
                    if ((mesh as UIMesh).uiQueueType === UI_QUEUE_TYPE_OVERLAY) {
                        renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_OVERLAY].push(
                            buildRenderMeshInfo(mesh, RENDER_QUEUE_TYPE_AFTER_TONE, i)
                        );
                        return;
                    }
                    if (material.alphaTest != null) {
                        renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_ALPHA_TEST].push(
                            buildRenderMeshInfo(mesh, RENDER_QUEUE_TYPE_ALPHA_TEST, i)
                        );
                        return;
                    }
                    switch (material.blendType) {
                        case BLEND_TYPE_OPAQUE:
                            renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_OPAQUE].push(
                                buildRenderMeshInfo(mesh, RENDER_QUEUE_TYPE_OPAQUE, i)
                            );
                            return;
                        case BLEND_TYPE_TRANSPARENT:
                        case BLEND_TYPE_ADDITIVE:
                            renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_TRANSPARENT].push(
                                buildRenderMeshInfo(mesh, RENDER_QUEUE_TYPE_TRANSPARENT, i)
                            );
                            return;
                        default:
                            console.error('[Renderer.render] invalid blend type');
                    }
                });
                break;

            case ACTOR_TYPE_LIGHT:
                if (actor.enabled) {
                    const light = actor as Light;
                    switch (light.lightType) {
                        case LIGHT_TYPE_DIRECTIONAL:
                            lightActors.directionalLight = light;
                            break;
                        case LIGHT_TYPE_SPOT:
                            lightActors.spotLights.push(light as SpotLight);
                            break;
                        case LIGHT_TYPE_POINT:
                            lightActors.pointLights.push(light as PointLight);
                            break;
                    }
                }
                break;

            case ACTOR_TYPE_POST_PROCESS_VOLUME:
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

    if (renderer.useDepthPrepass) {
        depthPrePass(renderer, currentCameraRenderMeshInfoEachPass.basePass, camera);
    }

    // ------------------------------------------------------------------------------
    // skybox pass
    // g-buffer opaque pass
    // ------------------------------------------------------------------------------

    if (renderer.useDepthPrepass) {
        setGBufferRenderTargetsDepthTexture(
            renderer.gBufferRenderTargets,
            renderer.depthPrePassRenderTarget.depthTexture!
        );
    }
    setRenderTargetToRendererAndClear(renderer, renderer.gBufferRenderTargets, true);

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
        //     if (actor.type === ACTOR_TYPE_SKYBOX) {
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
    renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_SKYBOX].forEach((skyboxRenderMeshInfo) => {
        const skyboxActor = skyboxRenderMeshInfo.actor as Skybox;
        updateMaterialSkyboxUniforms(renderer.deferredShadingPass.material, skyboxActor);
    });

    applyLightShadowMapUniformValues(
        renderer.deferredShadingPass.material,
        lightActors,
        renderer.gpu.dummyBlackTextures[0]
    );

    // set sss texture
    setMaterialUniformValue(
        renderer.deferredShadingPass.material,
        'uScreenSpaceShadowTexture',
        renderer.screenSpaceShadowPass.enabled
            ? renderer.screenSpaceShadowPass.renderTarget.texture
            : renderer.gpu.dummyBlackTextures[0]
    );

    // set ao texture
    setMaterialUniformValue(
        renderer.deferredShadingPass.material,
        'uAmbientOcclusionTexture',
        renderer.ambientOcclusionPass.enabled
            ? renderer.ambientOcclusionPass.renderTarget.texture
            : getDummyWhiteTexture(renderer.gpu)
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

    const needsCastShadowSpotLights = lightActors.spotLights.filter((light) => needsCastShadowOfLight(light));

    if (needsCastShadowSpotLights.length > 0) {
        setVolumetricLightPassSpotLights(renderer.volumetricLightPass, needsCastShadowSpotLights);
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
            : getDummyBlackTexture(renderer.gpu),
        needsCastShadowSpotLights
            ? renderer.volumetricLightPass.renderTarget.texture!
            : getDummyBlackTexture(renderer.gpu),
        renderer.screenSpaceShadowPass.enabled
            ? renderer.screenSpaceShadowPass.renderTarget.texture!
            : getDummyBlackTexture(renderer.gpu),
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

    if (renderer.useDepthPrepass) {
        // pattern2: depth prepass
        setRenderTargetDepthTexture(
            renderer.afterDeferredShadingRenderTarget,
            renderer.depthPrePassRenderTarget.depthTexture!
        );
    } else {
        // pattern1: g-buffer depth
        setRenderTargetDepthTexture(
            renderer.afterDeferredShadingRenderTarget,
            renderer.gBufferRenderTargets.depthTexture!
        );
    }

    copySceneTexture(renderer, sceneTexture);
    copyDepthTexture(renderer);

    // TODO: set depth to transparent meshes
    renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_TRANSPARENT].forEach((renderMeshInfo) => {
        setMaterialUniformValue(
            getMeshMaterial(renderMeshInfo.actor),
            UNIFORM_NAME_DEPTH_TEXTURE,
            renderer.copyDepthDestRenderTarget.depthTexture
        );
    });

    setRenderTargetToRendererAndClear(renderer, renderer.afterDeferredShadingRenderTarget);

    renderTransparentPass(
        renderer,
        camera,
        renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_TRANSPARENT],
        renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_SKYBOX],
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
                renderUIPass(
                    'after tone mapping',
                    renderer,
                    // camera,
                    scene.uiCamera || camera, // ui camera があったらそっちを優先
                    renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_AFTER_TONE],
                    renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_SKYBOX],
                    lightActors,
                    renderer.copySceneDestRenderTarget.texture!
                );
            }
        },
        // lightActors,
    });

    if (isCameraLastPassAndHasNotPostProcess) {
        // overlay
        renderUIPass(
            'overlay',
            renderer,
            // camera,
            scene.uiCamera || camera, // ui camera があったらそっちを優先
            renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_OVERLAY],
            renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_SKYBOX],
            lightActors,
            renderer.copySceneDestRenderTarget.texture!
        );

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

    // overlay
    renderUIPass(
        'overlay',
        renderer,
        // camera,
        scene.uiCamera || camera, // ui camera があったらそっちを優先
        renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_OVERLAY],
        renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_SKYBOX],
        lightActors,
        renderer.copySceneDestRenderTarget.texture!
    );
}

/**
 *
 * @param geometry
 * @param material
 */
export function renderMesh(renderer: Renderer, geometry: Geometry, material: Material, cb?: () => void) {
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
            case BLEND_TYPE_OPAQUE:
                depthWrite = true;
                break;
            case BLEND_TYPE_TRANSPARENT:
            case BLEND_TYPE_ADDITIVE:
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

    if (cb) cb();

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
    let cb: (() => void) | undefined;
    if (actor.meshType === MESH_TYPE_SPRITE_ATLAS) {
        const spriteAtlasMesh = actor as SpriteAtlasMesh;
        cb = () => {
            // NOTE: マテリアルは共通でuniformだけrender前に上書き
            // TODO: uniform name の rename
            setUniformValueToAllMeshMaterials(actor, UNIFORM_NAME_FONT_TILING, spriteAtlasMesh.tilingOffset);
        };
    }

    return {
        actor,
        queue,
        materialIndex,
        cb,
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

    setRenderTargetToRendererAndClear(renderer, renderer.depthPrePassRenderTarget, false, true);
    updateRendererCameraUniforms(renderer, camera);

    depthPrePassRenderMeshInfos.forEach(({ actor, materialIndex, cb }) => {
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

            renderMesh(renderer, actor.geometry, depthMaterial, cb);

            if (renderer.stats) {
                addPassInfoStats(renderer.stats, 'depth pre pass', actor.name, actor.geometry);
            }
        });
    });
}

function copyDepthTexture(renderer: Renderer) {
    setRenderTargetDepthTexture(renderer.copyDepthSourceRenderTarget, renderer.depthPrePassRenderTarget.depthTexture!);
    copyRenderTargetDepth(
        renderer.gpu,
        renderer.copyDepthSourceRenderTarget,
        renderer.copyDepthDestRenderTarget,
        renderer.realWidth,
        renderer.realHeight
    );
}

function copySceneTexture(renderer: Renderer, sceneTexture: Texture) {
    const tmpRenderTarget = renderer.renderTarget;
    setRenderTargetToRendererAndClear(renderer, null, false, false);
    setRenderTargetTexture(renderer.copySceneSourceRenderTarget, sceneTexture);
    copyRenderTargetColor(
        renderer.gpu,
        renderer.copySceneSourceRenderTarget,
        renderer.copySceneDestRenderTarget,
        renderer.realWidth,
        renderer.realHeight
    );
    setRenderTargetToRendererAndClear(renderer, tmpRenderTarget);
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

        setRenderTargetToRendererAndClear(renderer, lightActor.shadowMap, false, true);
        // this.clear(0, 0, 0, 1);
        // this._gpu.clearDepth(0, 0, 0, 1);

        updateRendererCameraUniforms(renderer, lightActor.shadowCamera);

        castShadowRenderMeshInfos.forEach(({ actor, materialIndex, cb }) => {
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
                    UNIFORM_NAME_DEPTH_TEXTURE,
                    renderer.copyDepthDestRenderTarget.depthTexture
                );

                renderMesh(renderer, actor.geometry, depthMaterial, cb);
                if (renderer.stats) {
                    addPassInfoStats(renderer.stats, 'shadow pass', actor.name, actor.geometry);
                }
            });
        });
    });
}

function skyboxPass(renderer: Renderer, sortedSkyboxPassRenderMeshInfos: RenderMeshInfo[], camera: Camera) {
    updateRendererCameraUniforms(renderer, camera);

    sortedSkyboxPassRenderMeshInfos.forEach(({ actor, materialIndex, cb }) => {
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

            renderMesh(renderer, actor.geometry, targetMaterial, cb);

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

    sortedBasePassRenderMeshInfos.forEach(({ actor, materialIndex, cb }) => {
        switch (actor.type) {
            case ACTOR_TYPE_SKYBOX:
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
                setRenderTargetToRendererAndClear(renderer, null, false, false);
                copyDepthTexture(renderer);
                setRenderTargetToRendererAndClear(renderer, renderer.gBufferRenderTargets, false, false);
            }

            // TODO: material 側でやった方がよい？
            updateActorTransformUniforms(renderer, actor, camera);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            setMaterialUniformValue(
                targetMaterial,
                UNIFORM_NAME_DEPTH_TEXTURE,
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

            renderMesh(renderer, actor.geometry, targetMaterial, cb);

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

    sortedRenderMeshInfos.forEach(({ actor, materialIndex, cb }) => {
        actor.materials.forEach((targetMaterial, i) => {
            if (i !== materialIndex) {
                return;
            }

            updateActorTransformUniforms(renderer, actor, camera);

            applyLightShadowMapUniformValues(targetMaterial, lightActors, getDummyBlackTexture(renderer.gpu));

            setMaterialUniformValue(targetMaterial, UNIFORM_NAME_SCENE_TEXTURE, sceneTexture);

            // TODO: skyboxは一個という前提にしているが・・・
            updateMeshMaterial(actor, {
                camera,
                skybox:
                    sortedSkyboxPassRenderMeshInfos.length !== 0
                        ? (sortedSkyboxPassRenderMeshInfos[0].actor as Skybox)
                        : null,
            });
            // updateMeshMaterial(actor, { camera });

            renderMesh(renderer, actor.geometry, targetMaterial, cb);

            if (renderer.stats) {
                addPassInfoStats(renderer.stats, 'transparent pass', actor.name, actor.geometry);
            }
        });
    });
}

function renderUIPass(
    passName: string,
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

    // let uiCanvasSize: Vector4 | null = null;

    // switch(camera.cameraType) {
    //     case CameraTypes.Orthographic:
    //         const orthoCamera = camera as OrthographicCamera;
    //         const orthoWidth = orthoCamera.right - orthoCamera.left;
    //         const orthoHeight = orthoCamera.top - orthoCamera.bottom;
    //         uiCanvasSize = createVector4(
    //             orthoWidth,
    //             orthoHeight,
    //             orthoWidth / orthoHeight,
    //             1
    //         );
    //         break;
    // }

    sortedRenderMeshInfos.forEach(({ actor, materialIndex, cb }) => {
        actor.materials.forEach((targetMaterial, i) => {
            if (i !== materialIndex) {
                return;
            }

            updateActorTransformUniforms(renderer, actor, camera);

            applyLightShadowMapUniformValues(targetMaterial, lightActors, getDummyBlackTexture(renderer.gpu));

            setMaterialUniformValue(targetMaterial, UNIFORM_NAME_SCENE_TEXTURE, sceneTexture);

            // switch(camera.cameraType) {
            //     case CameraTypes.Orthographic:
            //         setUniformValueToAllMeshMaterials(actor, UniformNames.UICanvas, uiCanvasSize);
            //         // setUniformValueToAllMeshMaterials(actor, "uUICanvasProjectionMatrix", camera.projectionMatrix);
            //         break;
            // }

            // TODO: skyboxは一個という前提にしているが・・・
            updateMeshMaterial(actor, {
                camera,
                skybox:
                    sortedSkyboxPassRenderMeshInfos.length !== 0
                        ? (sortedSkyboxPassRenderMeshInfos[0].actor as Skybox)
                        : null,
            });
            // updateMeshMaterial(actor, { camera });

            renderMesh(renderer, actor.geometry, targetMaterial, cb);

            if (renderer.stats) {
                addPassInfoStats(renderer.stats, passName, actor.name, actor.geometry);
            }
        });
    });
}

function updateActorTransformUniforms(renderer: Renderer, actor: Actor, camera: Camera) {
    setUniformBlockValue(
        renderer,
        UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
        UNIFORM_NAME_WORLD_MATRIX,
        actor.transform.worldMatrix
    );
    setUniformBlockValue(
        renderer,
        UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
        UNIFORM_NAME_INVERSE_WORLD_MATRIX,
        actor.transform.worldMatrix
        // invertMat4(actor.transform.worldMatrix) // TODO: こっちの方が正しいが・・・
    );
    setUniformBlockValue(
        renderer,
        UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
        UNIFORM_NAME_WVP_MATRIX,
        multiplyMat4Array(camera.viewProjectionMatrix, actor.transform.worldMatrix)
    );
    setUniformBlockValue(
        renderer,
        UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
        UNIFORM_NAME_NORMAL_MATRIX,
        actor.transform.normalMatrix
    );
}

export function updateRendererCameraUniforms(renderer: Renderer, camera: Camera) {
    setUniformBlockValue(renderer, UNIFORM_BLOCK_NAME_TRANSFORMATIONS, UNIFORM_NAME_VIEW_MATRIX, camera.viewMatrix);
    setUniformBlockValue(
        renderer,
        UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
        UNIFORM_NAME_PROJECTION_MATRIX,
        camera.projectionMatrix
    );
    setUniformBlockValue(
        renderer,
        UNIFORM_BLOCK_NAME_CAMERA,
        UNIFORM_NAME_VIEW_POSITION,
        getMat4Position(camera.transform.worldMatrix)
    );
    setUniformBlockValue(renderer, UNIFORM_BLOCK_NAME_CAMERA, UNIFORM_NAME_VIEW_DIRECTION, getCameraForward(camera));
    setUniformBlockValue(renderer, UNIFORM_BLOCK_NAME_CAMERA, UNIFORM_NAME_CAMERA_NEAR, camera.near);
    setUniformBlockValue(renderer, UNIFORM_BLOCK_NAME_CAMERA, UNIFORM_NAME_CAMERA_FAR, camera.far);
    setUniformBlockValue(
        renderer,
        UNIFORM_BLOCK_NAME_CAMERA,
        UNIFORM_NAME_CAMERA_ASPECT,
        isPerspectiveCamera(camera) ? (camera as PerspectiveCamera).aspect : (camera as OrthographicCamera).aspect
    );
    setUniformBlockValue(
        renderer,
        UNIFORM_BLOCK_NAME_CAMERA,
        UNIFORM_NAME_CAMERA_FOV,
        isPerspectiveCamera(camera) ? (camera as PerspectiveCamera).fov : 0
    );
    setUniformBlockValue(
        renderer,
        UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
        UNIFORM_NAME_VIEW_PROJECTION_MATRIX,
        camera.viewProjectionMatrix
    );
    setUniformBlockValue(
        renderer,
        UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
        UNIFORM_NAME_INVERSE_VIEW_MATRIX,
        camera.inverseViewMatrix
    );
    setUniformBlockValue(
        renderer,
        UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
        UNIFORM_NAME_INVERSE_PROJECTION_MATRIX,
        camera.inverseProjectionMatrix
    );
    setUniformBlockValue(
        renderer,
        UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
        UNIFORM_NAME_INVERSE_VIEW_PROJECTION_MATRIX,
        camera.inverseViewProjectionMatrix
    );
    setUniformBlockValue(
        renderer,
        UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
        UNIFORM_NAME_TRANSPOSE_INVERSE_VIEW_MATRIX,
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
            case UNIFORM_TYPE_FLOAT:
            case UNIFORM_TYPE_INT:
                data.push(value as number);
                data.push(0);
                data.push(0);
                data.push(0);
                break;
            case UNIFORM_TYPE_BOOL:
                data.push((value as boolean) ? 1 : 0);
                data.push(0);
                data.push(0);
                data.push(0);
                break;
            case UNIFORM_TYPE_VECTOR2:
                data.push(...(value as Vector2).e);
                data.push(0);
                break;
            case UNIFORM_TYPE_VECTOR3:
                data.push(...(value as Vector3).e);
                data.push(0);
                break;
            case UNIFORM_TYPE_VECTOR4:
                data.push(...(value as Vector4).e);
                break;
            case UNIFORM_TYPE_MATRIX4:
                data.push(...(value as Matrix4).e);
                break;
            case UNIFORM_TYPE_COLOR:
                data.push(...(value as Color).e);
                break;
            default:
                console.error(`invalid uniform type: ${type}`);
        }
        return data;
    };

    switch (targetUniformData.type) {
        // TODO: update struct
        case UNIFORM_TYPE_STRUCT:
            (value as unknown as UniformBufferObjectStructValue).forEach((v) => {
                const structElementName = `${uniformName}.${v.name}`;
                const data: number[] = getStructElementValue(v.type, v.value);
                updateUniformBufferData(targetUbo, structElementName, new Float32Array(data));
            });
            break;
        case UNIFORM_TYPE_STRUCT_ARRAY:
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
    // passMaterial.uniforms.setValue(UNIFORM_NAME_TIME, time);
    updateUniformBlockValue(renderer, UNIFORM_BLOCK_NAME_COMMON, UNIFORM_NAME_TIME, time);
    updateUniformBlockValue(renderer, UNIFORM_BLOCK_NAME_COMMON, UNIFORM_NAME_DELTA_TIME, deltaTime);
    updateUniformBlockValue(
        renderer,
        UNIFORM_BLOCK_NAME_COMMON,
        UNIFORM_NAME_VIEWPORT,
        createVector4(renderer.realWidth, renderer.realHeight, renderer.realWidth / renderer.realHeight, 0)
    );
}

export function updateTimelineUniforms(renderer: Renderer, timelineTime: number, timelineDeltaTime: number) {
    // passMaterial.uniforms.setValue(UNIFORM_NAME_TIME, time);
    updateUniformBlockValue(renderer, UNIFORM_BLOCK_NAME_TIMELINE, UNIFORM_NAME_TIMELINE_TIME, timelineTime);
    updateUniformBlockValue(renderer, UNIFORM_BLOCK_NAME_TIMELINE, UNIFORM_NAME_TIMELINE_DELTA_TIME, timelineDeltaTime);
    // for debug
    // console.log(timelineTime, timelineDeltaTime);
}

function updateDirectionalLightUniforms(renderer: Renderer, directionalLight: DirectionalLight) {
    updateUniformBlockValue(renderer, UNIFORM_BLOCK_NAME_DIRECTIONAL_LIGHT, UNIFORM_NAME_DIRECTIONAL_LIGHT, [
        {
            name: UNIFORM_NAME_LIGHT_DIRECTION,
            type: UNIFORM_TYPE_VECTOR3,
            // pattern: normalizeし、光源の位置から降り注ぐとみなす
            value: normalizeVector3(negateVector3(cloneVector3(directionalLight.transform.position))),
            // pattern: 回転を適用
            // TODO: quaternion側にバグがありそう
            // value: rotateVectorByQuaternion(createVector3(0, 0, -1), directionalLight.transform.rotation.quaternion),
        },
        {
            name: UNIFORM_NAME_LIGHT_INTENSITY,
            type: UNIFORM_TYPE_FLOAT,
            value: directionalLight.intensity,
        },
        {
            name: UNIFORM_NAME_LIGHT_COLOR,
            type: UNIFORM_TYPE_COLOR,
            value: directionalLight.color,
        },
        {
            // name: UniformNames.LightViewProjectionMatrix,
            name: UNIFORM_NAME_SHADOW_MAP_PROJECTION_MATRIX,
            type: UNIFORM_TYPE_MATRIX4,
            value: directionalLight.shadowMapProjectionMatrix,
        },
    ]);
}

function updateSpotLightsUniforms(renderer: Renderer, spotLights: SpotLight[]) {
    updateUniformBlockValue(
        renderer,
        UNIFORM_BLOCK_NAME_SPOT_LIGHT,
        UNIFORM_NAME_SPOT_LIGHT,
        spotLights.map((spotLight): UniformBufferObjectStructValue => {
            return [
                {
                    name: UNIFORM_NAME_LIGHT_COLOR,
                    type: UNIFORM_TYPE_COLOR,
                    value: spotLight.color,
                },
                {
                    name: UNIFORM_NAME_LIGHT_POSITION,
                    type: UNIFORM_TYPE_VECTOR3,
                    value: spotLight.transform.position,
                },
                {
                    name: UNIFORM_NAME_LIGHT_DIRECTION,
                    type: UNIFORM_TYPE_VECTOR3,
                    value: cloneVector3(getWorldForward(spotLight.transform)),
                },
                {
                    name: UNIFORM_NAME_LIGHT_INTENSITY,
                    type: UNIFORM_TYPE_FLOAT,
                    value: spotLight.intensity,
                },
                {
                    name: UNIFORM_NAME_LIGHT_DISTANCE,
                    type: UNIFORM_TYPE_FLOAT,
                    value: spotLight.distance,
                },
                {
                    name: UNIFORM_NAME_LIGHT_ATTENUATION,
                    type: UNIFORM_TYPE_FLOAT,
                    value: spotLight.attenuation,
                },
                {
                    name: UNIFORM_NAME_LIGHT_CONE_COS,
                    type: UNIFORM_TYPE_FLOAT,
                    value: getSpotLightConeCos(spotLight),
                },
                {
                    name: UNIFORM_NAME_LIGHT_PENUMBRA_COS,
                    type: UNIFORM_TYPE_FLOAT,
                    value: getSpotLightPenumbraCos(spotLight),
                },
                {
                    name: UNIFORM_NAME_SHADOW_MAP_PROJECTION_MATRIX,
                    type: UNIFORM_TYPE_MATRIX4,
                    value: spotLight.shadowMapProjectionMatrix,
                },
            ];
        }) as UniformBufferObjectStructArrayValue
    );
}

function updatePointLightsUniforms(renderer: Renderer, pointLights: PointLight[]) {
    updateUniformBlockValue(
        renderer,
        UNIFORM_BLOCK_NAME_POINT_LIGHT,
        UNIFORM_NAME_POINT_LIGHT,
        pointLights.map((pointLight): UniformBufferObjectStructValue => {
            return [
                {
                    name: UNIFORM_NAME_LIGHT_COLOR,
                    type: UNIFORM_TYPE_COLOR,
                    value: pointLight.color,
                },
                {
                    name: UNIFORM_NAME_LIGHT_POSITION,
                    type: UNIFORM_TYPE_VECTOR3,
                    value: pointLight.transform.position,
                },
                {
                    name: UNIFORM_NAME_LIGHT_INTENSITY,
                    type: UNIFORM_TYPE_FLOAT,
                    value: pointLight.intensity,
                },
                {
                    name: UNIFORM_NAME_LIGHT_DISTANCE,
                    type: UNIFORM_TYPE_FLOAT,
                    value: pointLight.distance,
                },
                {
                    name: UNIFORM_NAME_LIGHT_ATTENUATION,
                    type: UNIFORM_TYPE_FLOAT,
                    value: pointLight.attenuation,
                },
            ];
        }) as UniformBufferObjectStructArrayValue,
        true
    );
}

// ソート用の一時変数vec3. GC対策
let tmpSortVA = createVector3Zero();
let tmpSortVB = createVector3Zero();

function createRenderMeshInfosEachPass(
    renderMeshInfoEachQueue: RenderMeshInfoEachQueue,
    camera: Camera
): RenderMeshInfosEachPass {
    const basePass = [RENDER_QUEUE_TYPE_OPAQUE, RENDER_QUEUE_TYPE_ALPHA_TEST]
        .map((queue) => {
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return [...renderMeshInfoEachQueue[queue]].sort((a, b) => {
                // const al = getVector3Magnitude(subVectorsV3(camera.transform.position, a.actor.transform.position));
                // const bl = getVector3Magnitude(subVectorsV3(camera.transform.position, b.actor.transform.position));
                subVectorsV3Ref(tmpSortVA, camera.transform.position, a.actor.transform.position);
                subVectorsV3Ref(tmpSortVB, camera.transform.position, b.actor.transform.position);
                const al = getVector3Magnitude(tmpSortVA);
                const bl = getVector3Magnitude(tmpSortVB);
                return al < bl ? -1 : 1;
            });
        })
        .flat();

    const skyboxPass = [...renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_SKYBOX]].sort((a, b) => {
        // const al = getVector3Magnitude(subVectorsV3(camera.transform.position, a.actor.transform.position));
        // const bl = getVector3Magnitude(subVectorsV3(camera.transform.position, b.actor.transform.position));
        subVectorsV3Ref(tmpSortVA, camera.transform.position, a.actor.transform.position);
        subVectorsV3Ref(tmpSortVB, camera.transform.position, b.actor.transform.position);
        const al = getVector3Magnitude(tmpSortVA);
        const bl = getVector3Magnitude(tmpSortVB);
        return al < bl ? -1 : 1;
    });

    const afterTonePass = [...renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_AFTER_TONE]].sort((a, b) => {
        // const al = getVector3Magnitude(subVectorsV3(camera.transform.position, a.actor.transform.position));
        // const bl = getVector3Magnitude(subVectorsV3(camera.transform.position, b.actor.transform.position));
        subVectorsV3Ref(tmpSortVA, camera.transform.position, a.actor.transform.position);
        subVectorsV3Ref(tmpSortVB, camera.transform.position, b.actor.transform.position);
        const al = getVector3Magnitude(tmpSortVA);
        const bl = getVector3Magnitude(tmpSortVB);
        return al >= bl ? -1 : 1;
    });

    const transparentPass = [...renderMeshInfoEachQueue[RENDER_QUEUE_TYPE_TRANSPARENT]].sort((a, b) => {
        // const al = getVector3Magnitude(subVectorsV3(camera.transform.position, a.actor.transform.position));
        // const bl = getVector3Magnitude(subVectorsV3(camera.transform.position, b.actor.transform.position));
        tmpSortVA = subVectorsV3(camera.transform.position, a.actor.transform.position);
        tmpSortVB = subVectorsV3(camera.transform.position, b.actor.transform.position);
        const al = getVector3Magnitude(tmpSortVA);
        const bl = getVector3Magnitude(tmpSortVB);
        return al >= bl ? -1 : 1;
    });

    return {
        basePass,
        skyboxPass,
        afterTonePass,
        transparentPass,
    };
}
