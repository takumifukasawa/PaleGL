import {
    AttributeNames,
    BlendTypes,
    DepthFuncTypes,
    FaceSide,
    MAX_SPOT_LIGHT_COUNT, PostProcessPassType,
    PrimitiveTypes,
    RenderTargetTypes,
    TextureDepthPrecisionType,
    // TextureDepthPrecisionType,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import volumetricLightFragmentShader from '@/PaleGL/shaders/volumetric-light-fragment.glsl';
import {
    PostProcessPassBase, PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { SpotLight } from '@/PaleGL/actors/lights/spotLight.ts';
import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { Override } from '@/PaleGL/palegl';
import {Vector3} from "@/PaleGL/math/Vector3.ts";
import {
    createMaterial,
    isCompiledMaterialShader,
    Material,
    setMaterialUniformValue,
    startMaterial
} from "@/PaleGL/materials/material.ts";
import { getGeometryAttributeDescriptors } from '@/PaleGL/geometries/geometryBehaviours.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';

const UNIFORM_VOLUME_DEPTH_TEXTURE = 'uVolumetricDepthTexture';
const UNIFORM_NAME_RAY_STEP = 'uRayStep';
const UNIFORM_NAME_DENSITY_MULTIPLIER = 'uDensityMultiplier';
const UNIFORM_NAME_RAY_JITTER_SIZE = 'uRayJitterSize';

export type VolumetricLightPassParametersBase = {
    rayStep: number;
    blendRate: number;
    densityMultiplier: number;
    rayJitterSize: Vector3;
    ratio: number;
};

export type VolumetricLightPassParameters = PostProcessPassParametersBase & VolumetricLightPassParametersBase;

export type VolumetricLightPassParametersArgs = Partial<VolumetricLightPassParameters>;

export function generateVolumetricLightParameters(params: VolumetricLightPassParametersArgs = {}): VolumetricLightPassParameters {
    return {
        enabled: params.enabled ?? true,
        rayStep: params.rayStep ?? 0.62,
        blendRate: params.blendRate ?? 1,
        densityMultiplier: params.densityMultiplier ?? 1,
        rayJitterSize: params.rayJitterSize ?? new Vector3(0.1, 0.1, 0.1),
        ratio: params.ratio ?? 0.5,
    };
}

export class VolumetricLightPass extends PostProcessPassBase {
    parameters: Override<PostProcessPassParametersBase, VolumetricLightPassParameters>;

    #spotLights: SpotLight[] = [];

    spotLightFrustumMaterial: Material;

    renderTargetSpotLightFrustum: RenderTarget;

    rawWidth: number = 1;
    rawHeight: number = 1;

    /**
     *
     * @param args
     */
    constructor(args: { gpu: GPU; parameters?: VolumetricLightPassParametersArgs }) {
        const { gpu } = args;
        const parameters = generateVolumetricLightParameters(args.parameters ?? {});

        const fragmentShader = volumetricLightFragmentShader;

        super({
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
                    value: Vector3.zero,
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
            parameters,
        });

        // if (ratio !== undefined) {
        //     this.ratio = ratio;
        // }
        this.parameters = parameters;

        this.renderTargetSpotLightFrustum = new RenderTarget({
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

        this.spotLightFrustumMaterial = createMaterial({
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
        this.materials.push(this.spotLightFrustumMaterial);
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        this.rawWidth = width;
        this.rawHeight = height;
        this.width = Math.floor(width * this.parameters.ratio);
        this.height = Math.floor(height * this.parameters.ratio);

        super.setSize(this.width, this.height);

        this.renderTargetSpotLightFrustum.setSize(this.rawWidth, this.rawHeight);
        // this.renderTargetSpotLightFrustum.setSize(this.width, this.height);

        setMaterialUniformValue(this.spotLightFrustumMaterial, UniformNames.TargetWidth, this.width);
        setMaterialUniformValue(this.spotLightFrustumMaterial, UniformNames.TargetHeight, this.height);
    }

    /**
     *
     * @param options
     */
    render(options: PostProcessPassRenderArgs) {
        const { gpu, renderer } = options;

        if (!isCompiledMaterialShader(this.spotLightFrustumMaterial) && this.#spotLights.length > 0) {
            // TODO: shadow map ないケースがあるはず
            const geo = this.#spotLights[0].shadowCamera?.visibleFrustumMesh?.geometry as Geometry;
            startMaterial(this.spotLightFrustumMaterial, {
                gpu,
                attributeDescriptors:
                getGeometryAttributeDescriptors(geo) 
            });
        }

        renderer.setRenderTarget(this.renderTargetSpotLightFrustum.write, false, true);

        setMaterialUniformValue(this.spotLightFrustumMaterial, UniformNames.ViewMatrix, options.targetCamera.viewMatrix);
        setMaterialUniformValue(this.spotLightFrustumMaterial, UniformNames.ProjectionMatrix, options.targetCamera.projectionMatrix);
        this.#spotLights.forEach((spotLight) => {
            if (spotLight.shadowCamera && spotLight.shadowCamera.visibleFrustumMesh !== null) {
                setMaterialUniformValue(this.spotLightFrustumMaterial, UniformNames.WorldMatrix, spotLight.shadowCamera.transform.worldMatrix);
                // TODO: この描画だけでvolumeを計算したい
                renderer.renderMesh(spotLight.shadowCamera.visibleFrustumMesh.geometry, this.spotLightFrustumMaterial);
            }
        });

        setMaterialUniformValue(this.material, UniformNames.SpotLightShadowMap, this.#spotLights.map((spotLight) => (spotLight.shadowMap ? spotLight.shadowMap?.read.$getDepthTexture() : null)));
        setMaterialUniformValue(this.material, UNIFORM_VOLUME_DEPTH_TEXTURE, this.renderTargetSpotLightFrustum.$getDepthTexture());
        setMaterialUniformValue(this.material, UNIFORM_NAME_RAY_STEP, this.parameters.rayStep);
        setMaterialUniformValue(this.material, UNIFORM_NAME_DENSITY_MULTIPLIER, this.parameters.densityMultiplier);
        setMaterialUniformValue(this.material, UNIFORM_NAME_RAY_JITTER_SIZE, this.parameters.rayJitterSize);
        setMaterialUniformValue(this.material, UniformNames.BlendRate, this.parameters.blendRate);
        
        // console.log(this.material.uniforms)

        super.render(options);
    }

    /**
     *
     * @param spotLights
     */
    setSpotLights(spotLights: SpotLight[]) {
        this.#spotLights = spotLights;
    }
}
