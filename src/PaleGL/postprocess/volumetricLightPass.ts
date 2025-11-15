import { NeedsShorten } from '@/Marionetter/types';
import { createShortenKit, makeLongKeyMap, ShortNamesFor } from '@/Marionetter/types/makePropMap.ts';
import { SpotLight } from '@/PaleGL/actors/lights/spotLight.ts';
import {
    ATTRIBUTE_NAME_POSITION,
    BLEND_TYPE_OPAQUE,
    DEPTH_FUNC_TYPE_LEQUAL,
    FACE_SIDE_DOUBLE,
    MAX_SPOT_LIGHT_COUNT,
    POST_PROCESS_PASS_TYPE_VOLUMETRIC_LIGHT,
    PRIMITIVE_TYPE_TRIANGLES,
    RENDER_TARGET_TYPE_DEPTH,
    RENDER_TARGET_TYPE_RGBA16F,
    TEXTURE_DEPTH_PRECISION_TYPE_HIGH,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_BLOCK_NAME_SPOT_LIGHT,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_VECTOR3,
    UNIFORM_TYPE_MATRIX4,
    UNIFORM_TYPE_TEXTURE_ARRAY,
    UNIFORM_NAME_WORLD_MATRIX,
    UNIFORM_NAME_VIEW_MATRIX,
    UNIFORM_NAME_PROJECTION_MATRIX,
    UNIFORM_NAME_TARGET_WIDTH,
    UNIFORM_NAME_TARGET_HEIGHT,
    UNIFORM_NAME_SPOT_LIGHT_SHADOW_MAP,
    UNIFORM_NAME_GBUFFER_A_TEXTURE,
    UNIFORM_NAME_DEPTH_TEXTURE,
    UNIFORM_NAME_BLEND_RATE,
} from '@/PaleGL/constants';
import { renderMesh, setRenderTargetToRendererAndClear, tryStartMaterial } from '@/PaleGL/core/renderer.ts';
import { createRenderTarget, RenderTarget, setRenderTargetSize } from '@/PaleGL/core/renderTarget.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { createMaterial, Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { createVector3, createVector3Zero, Vector3 } from '@/PaleGL/math/vector3.ts';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
    PostProcessSinglePass,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import {
    renderPostProcessSinglePassBehaviour,
    setPostProcessSinglePassSizeBehaviour,
} from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import volumetricLightFragmentShader from '@/PaleGL/shaders/volumetric-light-fragment.glsl';
import { maton } from '@/PaleGL/utilities/maton.ts';

const UNIFORM_VOLUME_DEPTH_TEXTURE = 'uVolumetricDepthTexture';
const UNIFORM_NAME_RAY_STEP = 'uRayStep';
const UNIFORM_NAME_DENSITY_MULTIPLIER = 'uDensityMultiplier';
const UNIFORM_NAME_RAY_JITTER_SIZE = 'uRayJitterSize';

// ---

// ---- Type（既存）----
export type VolumetricLightPassParameters = {
    enabled: boolean;
    rayStep: number;
    blendRate: number;
    densityMultiplier: number;
    rayJitterSize: Vector3;
    ratio: number;
};

// ---- Short names（C#定数に完全一致）----
export const VolumetricLight_ShortNames = {
    enabled: 'vl_on',
    rayStep: 'vl_rs',
    blendRate: 'vl_br',
    densityMultiplier: 'vl_dm',
    rayJitterSize: 'vl_rjs',
    ratio: 'vl_r',
} as const satisfies ShortNamesFor<VolumetricLightPassParameters>;

// ---- 派生（テンプレ同様）----
const VolumetricLight = createShortenKit<VolumetricLightPassParameters>()(VolumetricLight_ShortNames);

// NeedsShorten に応じた「元キー -> 実キー」マップ（short/long 切替）
export const VolumetricLightPassParametersPropertyMap = VolumetricLight.map(NeedsShorten);

// 常に long キーを返す論理キー
export const VolumetricLightPassParametersKey = makeLongKeyMap(VolumetricLight_ShortNames);

// キーのユニオン（必要なら）
export type VolumetricLightPassParametersKey = keyof typeof VolumetricLightPassParametersKey;

// 短縮キーも含む拡張型（必要なら）
export type VolumetricLightPassParametersProperty = typeof VolumetricLight.type;

// ---

export type VolumetricLightPass = PostProcessSinglePass &
    VolumetricLightPassParameters & {
        spotLights: SpotLight[];
        spotLightFrustumMaterial: Material;
        renderTargetSpotLightFrustum: RenderTarget;
        rawWidth: number;
        rawHeight: number;
        materials: Material[];
    };

export type VolumetricLightPassArgs = PostProcessPassParametersBaseArgs & Partial<VolumetricLightPassParameters>;

export const createVolumetricLightPass = (args: VolumetricLightPassArgs): VolumetricLightPass => {
    const { gpu, enabled } = args;

    const rayStep = args.rayStep ?? 0.62;
    const blendRate = args.blendRate ?? 1;
    const densityMultiplier = args.densityMultiplier ?? 1;
    const rayJitterSize = args.rayJitterSize ?? createVector3(0.1, 0.1, 0.1);
    const ratio = args.ratio ?? 0.5;

    const materials: Material[] = [];

    const spotLights: SpotLight[] = [];

    const rawWidth: number = 1;
    const rawHeight: number = 1;

    const fragmentShader = volumetricLightFragmentShader;

    const renderTargetSpotLightFrustum = createRenderTarget({
        // name: 'spot light frustum render target',
        // gpu,
        // type: RenderTargetTypes.R11F_G11F_B10F,
        // useDepthBuffer: true
        gpu,
        type: RENDER_TARGET_TYPE_DEPTH,
        width: 1,
        height: 1,
        depthPrecision: TEXTURE_DEPTH_PRECISION_TYPE_HIGH,
    });

    const spotLightFrustumMaterial = createMaterial({
        vertexShader: `
layout (location = 0) in vec3 ${ATTRIBUTE_NAME_POSITION};
uniform mat4 ${UNIFORM_NAME_WORLD_MATRIX};
uniform mat4 ${UNIFORM_NAME_VIEW_MATRIX};
uniform mat4 ${UNIFORM_NAME_PROJECTION_MATRIX};
void main() {vec4 wp=${UNIFORM_NAME_WORLD_MATRIX}*vec4(${ATTRIBUTE_NAME_POSITION},1.);gl_Position=${UNIFORM_NAME_PROJECTION_MATRIX}*${UNIFORM_NAME_VIEW_MATRIX}*wp;}
`,
        fragmentShader: `
out vec4 o; void main(){o=vec4(1.,0.,0.,1.);}`,
        primitiveType: PRIMITIVE_TYPE_TRIANGLES,
        blendType: BLEND_TYPE_OPAQUE,
        // blendType: BLEND_TYPE_ADDITIVE,
        depthFuncType: DEPTH_FUNC_TYPE_LEQUAL,
        depthWrite: true,
        depthTest: true,
        faceSide: FACE_SIDE_DOUBLE, // TODO: doubleである必要ない？
        uniforms: [
            [UNIFORM_NAME_WORLD_MATRIX, UNIFORM_TYPE_MATRIX4, null],
            [UNIFORM_NAME_VIEW_MATRIX, UNIFORM_TYPE_MATRIX4, null],
            [UNIFORM_NAME_PROJECTION_MATRIX, UNIFORM_TYPE_MATRIX4, null],
        ],
    });
    // TODO: このmaterialは多分pushしなくていいよね
    materials.push(spotLightFrustumMaterial);

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: POST_PROCESS_PASS_TYPE_VOLUMETRIC_LIGHT,
            fragmentShader,
            uniforms: [
                [UNIFORM_NAME_SPOT_LIGHT_SHADOW_MAP, UNIFORM_TYPE_TEXTURE_ARRAY, maton.range(MAX_SPOT_LIGHT_COUNT).map(() => null)],
                [UNIFORM_NAME_RAY_STEP, UNIFORM_TYPE_FLOAT, 0],
                [UNIFORM_NAME_DENSITY_MULTIPLIER, UNIFORM_TYPE_FLOAT, 0],
                [UNIFORM_NAME_RAY_JITTER_SIZE, UNIFORM_TYPE_VECTOR3, createVector3Zero()],
                [UNIFORM_NAME_GBUFFER_A_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
                [UNIFORM_NAME_DEPTH_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
                [UNIFORM_VOLUME_DEPTH_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
                [UNIFORM_NAME_BLEND_RATE, UNIFORM_TYPE_FLOAT, 1],
            ],
            uniformBlockNames: [
                UNIFORM_BLOCK_NAME_COMMON,
                UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
                UNIFORM_BLOCK_NAME_CAMERA,
                UNIFORM_BLOCK_NAME_SPOT_LIGHT,
            ],
            // renderTargetType: RenderTargetTypes.RGBA
            renderTargetType: RENDER_TARGET_TYPE_RGBA16F,
            enabled,
        }),
        spotLights,
        spotLightFrustumMaterial,
        renderTargetSpotLightFrustum,
        rawWidth,
        rawHeight,
        // parameters
        rayStep,
        blendRate,
        densityMultiplier,
        rayJitterSize,
        ratio,
    };
}

export function setVolumetricLightPassSize(postProcessPass: PostProcessPassBase, width: number, height: number) {
    const volumetricLightPass = postProcessPass as VolumetricLightPass;

    volumetricLightPass.rawWidth = width;
    volumetricLightPass.rawHeight = height;
    volumetricLightPass.width = Math.floor(width * volumetricLightPass.ratio);
    volumetricLightPass.height = Math.floor(height * volumetricLightPass.ratio);

    setPostProcessSinglePassSizeBehaviour(volumetricLightPass, volumetricLightPass.width, volumetricLightPass.height);

    setRenderTargetSize(volumetricLightPass.renderTarget, volumetricLightPass.rawWidth, volumetricLightPass.rawHeight);
    // this.renderTargetSpotLightFrustum.setSize(this.width, this.height);

    setMaterialUniformValue(
        volumetricLightPass.spotLightFrustumMaterial,
        UNIFORM_NAME_TARGET_WIDTH,
        volumetricLightPass.width
    );
    setMaterialUniformValue(
        volumetricLightPass.spotLightFrustumMaterial,
        UNIFORM_NAME_TARGET_HEIGHT,
        volumetricLightPass.height
    );
}

export function renderVolumetricLightPass(postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) {
    const volumetricLightPass = postProcessPass as VolumetricLightPass;

    const { gpu, renderer } = options;

    tryStartMaterial(
        gpu,
        renderer,
        volumetricLightPass.spotLights[0].shadowCamera?.visibleFrustumMesh?.geometry as Geometry,
        volumetricLightPass.spotLightFrustumMaterial
    );

    setRenderTargetToRendererAndClear(renderer, volumetricLightPass.renderTargetSpotLightFrustum, false, true);

    setMaterialUniformValue(
        volumetricLightPass.spotLightFrustumMaterial,
        UNIFORM_NAME_VIEW_MATRIX,
        options.targetCamera.viewMatrix
    );
    setMaterialUniformValue(
        volumetricLightPass.spotLightFrustumMaterial,
        UNIFORM_NAME_PROJECTION_MATRIX,
        options.targetCamera.projectionMatrix
    );
    volumetricLightPass.spotLights.forEach((spotLight) => {
        if (spotLight.shadowCamera && spotLight.shadowCamera.visibleFrustumMesh !== null) {
            setMaterialUniformValue(
                volumetricLightPass.spotLightFrustumMaterial,
                UNIFORM_NAME_WORLD_MATRIX,
                spotLight.shadowCamera.transform.worldMatrix
            );
            // TODO: この描画だけでvolumeを計算したい
            renderMesh(
                renderer,
                spotLight.shadowCamera.visibleFrustumMesh.geometry,
                volumetricLightPass.spotLightFrustumMaterial
            );
        }
        console.log("hogehoge", spotLight.shadowCamera)
    });

    setMaterialUniformValue(
        volumetricLightPass.material,
        UNIFORM_NAME_SPOT_LIGHT_SHADOW_MAP,
        volumetricLightPass.spotLights.map((spotLight) =>
            spotLight.shadowMap ? spotLight.shadowMap?.depthTexture : null
        )
    );
    setMaterialUniformValue(
        volumetricLightPass.material,
        UNIFORM_VOLUME_DEPTH_TEXTURE,
        volumetricLightPass.renderTargetSpotLightFrustum.depthTexture
    );
    setMaterialUniformValue(volumetricLightPass.material, UNIFORM_NAME_RAY_STEP, volumetricLightPass.rayStep);
    setMaterialUniformValue(
        volumetricLightPass.material,
        UNIFORM_NAME_DENSITY_MULTIPLIER,
        volumetricLightPass.densityMultiplier
    );
    setMaterialUniformValue(
        volumetricLightPass.material,
        UNIFORM_NAME_RAY_JITTER_SIZE,
        volumetricLightPass.rayJitterSize
    );
    setMaterialUniformValue(volumetricLightPass.material, UNIFORM_NAME_BLEND_RATE, volumetricLightPass.blendRate);


    renderPostProcessSinglePassBehaviour(volumetricLightPass, options);
}

export const setVolumetricLightPassSpotLights = (volumetricLightPass: VolumetricLightPass, spotLights: SpotLight[]) => {
    volumetricLightPass.spotLights = spotLights;
}
