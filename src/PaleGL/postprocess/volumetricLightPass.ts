import {
    AttributeNames,
    BlendTypes,
    DepthFuncTypes,
    FaceSide,
    MAX_SPOT_LIGHT_COUNT,
    PostProcessPassType,
    PrimitiveTypes,
    RenderTargetTypes,
    TextureDepthPrecisionType,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants';
import volumetricLightFragmentShader from '@/PaleGL/shaders/volumetric-light-fragment.glsl';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessSinglePass,
    PostProcessPassRenderArgs,
    PostProcessPassParametersBaseArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { SpotLight } from '@/PaleGL/actors/lights/spotLight.ts';
import { createRenderTarget, RenderTarget, setRenderTargetSize } from '@/PaleGL/core/renderTarget.ts';
import { createVector3, createVector3Zero, Vector3 } from '@/PaleGL/math/vector3.ts';
import {
    createMaterial,
    isCompiledMaterialShader,
    Material,
    setMaterialUniformValue,
    startMaterial,
} from '@/PaleGL/materials/material.ts';
import { getGeometryAttributeDescriptors } from '@/PaleGL/geometries/geometryBehaviours.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { renderMesh, setRendererRenderTarget } from '@/PaleGL/core/renderer.ts';
import {
    renderPostProcessSinglePassBehaviour,
    setPostProcessSinglePassSizeBehaviour,
} from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';

const UNIFORM_VOLUME_DEPTH_TEXTURE = 'uVolumetricDepthTexture';
const UNIFORM_NAME_RAY_STEP = 'uRayStep';
const UNIFORM_NAME_DENSITY_MULTIPLIER = 'uDensityMultiplier';
const UNIFORM_NAME_RAY_JITTER_SIZE = 'uRayJitterSize';

export type VolumetricLightPassParameters = {
    rayStep: number;
    blendRate: number;
    densityMultiplier: number;
    rayJitterSize: Vector3;
    ratio: number;
};

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

export function createVolumetricLightPass(args: VolumetricLightPassArgs): VolumetricLightPass {
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
        type: RenderTargetTypes.Depth,
        width: 1,
        height: 1,
        depthPrecision: TextureDepthPrecisionType.High,
    });

    const spotLightFrustumMaterial = createMaterial({
        vertexShader: `
layout (location = 0) in vec3 ${AttributeNames.Position};
uniform mat4 ${UniformNames.WorldMatrix};
uniform mat4 ${UniformNames.ViewMatrix};
uniform mat4 ${UniformNames.ProjectionMatrix};
void main() {vec4 wp=${UniformNames.WorldMatrix}*vec4(${AttributeNames.Position},1.);gl_Position=${UniformNames.ProjectionMatrix}*${UniformNames.ViewMatrix}*wp;}
`,
        fragmentShader: `
out vec4 o; void main(){o=vec4(1.,0.,0.,1.);}`,
        primitiveType: PrimitiveTypes.Triangles,
        blendType: BlendTypes.Opaque,
        // blendType: BlendTypes.Additive,
        depthFuncType: DepthFuncTypes.Lequal,
        depthWrite: true,
        depthTest: true,
        faceSide: FaceSide.Double, // TODO: doubleである必要ない？
        uniforms: [
            {
                name: UniformNames.WorldMatrix,
                type: UniformTypes.Matrix4,
                value: null,
            },
            {
                name: UniformNames.ViewMatrix,
                type: UniformTypes.Matrix4,
                value: null,
            },
            {
                name: UniformNames.ProjectionMatrix,
                type: UniformTypes.Matrix4,
                value: null,
            },
        ],
    });
    // TODO: このmaterialは多分pushしなくていいよね
    materials.push(spotLightFrustumMaterial);

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: PostProcessPassType.VolumetricLight,
            fragmentShader,
            uniforms: [
                {
                    name: UniformNames.SpotLightShadowMap,
                    type: UniformTypes.TextureArray,
                    value: maton.range(MAX_SPOT_LIGHT_COUNT).map(() => null),
                },
                {
                    name: UNIFORM_NAME_RAY_STEP,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: UNIFORM_NAME_DENSITY_MULTIPLIER,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: UNIFORM_NAME_RAY_JITTER_SIZE,
                    type: UniformTypes.Vector3,
                    value: createVector3Zero(),
                },
                {
                    name: UniformNames.GBufferATexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UniformNames.DepthTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UNIFORM_VOLUME_DEPTH_TEXTURE,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UniformNames.BlendRate,
                    type: UniformTypes.Float,
                    value: 1,
                },
            ],
            uniformBlockNames: [
                UniformBlockNames.Common,
                UniformBlockNames.Transformations,
                UniformBlockNames.Camera,
                UniformBlockNames.SpotLight,
            ],
            // renderTargetType: RenderTargetTypes.RGBA
            renderTargetType: RenderTargetTypes.RGBA16F,
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
        UniformNames.TargetWidth,
        volumetricLightPass.width
    );
    setMaterialUniformValue(
        volumetricLightPass.spotLightFrustumMaterial,
        UniformNames.TargetHeight,
        volumetricLightPass.height
    );
}

export function renderVolumetricLightPass(postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) {
    const volumetricLightPass = postProcessPass as VolumetricLightPass;

    const { gpu, renderer } = options;

    if (
        !isCompiledMaterialShader(volumetricLightPass.spotLightFrustumMaterial) &&
        volumetricLightPass.spotLights.length > 0
    ) {
        // TODO: shadow map ないケースがあるはず
        const geo = volumetricLightPass.spotLights[0].shadowCamera?.visibleFrustumMesh?.geometry as Geometry;
        startMaterial(volumetricLightPass.spotLightFrustumMaterial, {
            gpu,
            attributeDescriptors: getGeometryAttributeDescriptors(geo),
        });
    }

    setRendererRenderTarget(renderer, volumetricLightPass.renderTargetSpotLightFrustum, false, true);

    setMaterialUniformValue(
        volumetricLightPass.spotLightFrustumMaterial,
        UniformNames.ViewMatrix,
        options.targetCamera.viewMatrix
    );
    setMaterialUniformValue(
        volumetricLightPass.spotLightFrustumMaterial,
        UniformNames.ProjectionMatrix,
        options.targetCamera.projectionMatrix
    );
    volumetricLightPass.spotLights.forEach((spotLight) => {
        if (spotLight.shadowCamera && spotLight.shadowCamera.visibleFrustumMesh !== null) {
            setMaterialUniformValue(
                volumetricLightPass.spotLightFrustumMaterial,
                UniformNames.WorldMatrix,
                spotLight.shadowCamera.transform.worldMatrix
            );
            // TODO: この描画だけでvolumeを計算したい
            renderMesh(
                renderer,
                spotLight.shadowCamera.visibleFrustumMesh.geometry,
                volumetricLightPass.spotLightFrustumMaterial
            );
        }
    });

    setMaterialUniformValue(
        volumetricLightPass.material,
        UniformNames.SpotLightShadowMap,
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
    setMaterialUniformValue(volumetricLightPass.material, UniformNames.BlendRate, volumetricLightPass.blendRate);

    // console.log(this.material.uniforms)

    renderPostProcessSinglePassBehaviour(volumetricLightPass, options);
}

export function setVolumetricLightPassSpotLights(volumetricLightPass: VolumetricLightPass, spotLights: SpotLight[]) {
    volumetricLightPass.spotLights = spotLights;
}
