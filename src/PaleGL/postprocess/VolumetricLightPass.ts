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
import { SpotLight } from '@/PaleGL/actors/SpotLight.ts';
import { Material } from '@/PaleGL/materials/Material.ts';
import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { AttributeDescriptor } from '@/PaleGL/core/Attribute.ts';
import { Override } from '@/PaleGL/palegl';
import {Vector3} from "@/PaleGL/math/Vector3.ts";

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

        this.spotLightFrustumMaterial = new Material({
            vertexShader: `#version 300 es
layout (location = 0) in vec3 ${AttributeNames.Position};
uniform mat4 ${UniformNames.WorldMatrix};
uniform mat4 ${UniformNames.ViewMatrix};
uniform mat4 ${UniformNames.ProjectionMatrix};
void main() {vec4 wp=${UniformNames.WorldMatrix}*vec4(${AttributeNames.Position},1.);gl_Position=${UniformNames.ProjectionMatrix}*${UniformNames.ViewMatrix}*wp;}
`,
            fragmentShader: `#version 300 es
precision mediump float;
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

        this.material.uniforms.setValue(UniformNames.TargetWidth, this.width);
        this.material.uniforms.setValue(UniformNames.TargetHeight, this.height);
    }

    /**
     *
     * @param options
     */
    render(options: PostProcessPassRenderArgs) {
        const { gpu, renderer } = options;

        if (!this.spotLightFrustumMaterial.isCompiledShader && this.#spotLights.length > 0) {
            this.spotLightFrustumMaterial.start({
                gpu,
                attributeDescriptors:
                    this.#spotLights[0].shadowCamera?.visibleFrustumMesh?.geometry.getAttributeDescriptors() as AttributeDescriptor[],
            });
        }

        // renderer.setRenderTarget(this.renderTargetSpotLightFrustum, false, true);
        renderer.setRenderTarget(this.renderTargetSpotLightFrustum.write, false, true);

        this.spotLightFrustumMaterial.uniforms.setValue(UniformNames.ViewMatrix, options.targetCamera.viewMatrix);
        this.spotLightFrustumMaterial.uniforms.setValue(
            UniformNames.ProjectionMatrix,
            options.targetCamera.projectionMatrix
        );
        this.#spotLights.forEach((spotLight) => {
            if (spotLight.shadowCamera && spotLight.shadowCamera.visibleFrustumMesh !== null) {
                this.spotLightFrustumMaterial.uniforms.setValue(
                    UniformNames.WorldMatrix,
                    spotLight.shadowCamera.transform.worldMatrix
                );
                // TODO: この描画だけでvolumeを計算したい
                renderer.renderMesh(spotLight.shadowCamera.visibleFrustumMesh.geometry, this.spotLightFrustumMaterial);
            }
        });

        this.material.uniforms.setValue(
            UniformNames.SpotLightShadowMap,
            this.#spotLights.map((spotLight) => (spotLight.shadowMap ? spotLight.shadowMap?.read.$getDepthTexture() : null))
        );
        this.material.uniforms.setValue(UNIFORM_VOLUME_DEPTH_TEXTURE, this.renderTargetSpotLightFrustum.$getDepthTexture());
        this.material.uniforms.setValue(UNIFORM_NAME_RAY_STEP, this.parameters.rayStep);
        this.material.uniforms.setValue(UNIFORM_NAME_DENSITY_MULTIPLIER, this.parameters.densityMultiplier);
        this.material.uniforms.setValue(UNIFORM_NAME_RAY_JITTER_SIZE, this.parameters.rayJitterSize);
        this.material.uniforms.setValue(UniformNames.BlendRate, this.parameters.blendRate);
        
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
