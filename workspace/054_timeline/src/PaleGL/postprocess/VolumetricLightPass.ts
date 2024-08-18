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
// import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
// import spotLightFrustumVertex from '@/PaleGL/shaders/spotlight-frustum-vertex.glsl';
import { SpotLight } from '@/PaleGL/actors/SpotLight.ts';
import { Material } from '@/PaleGL/materials/Material.ts';
import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { AttributeDescriptor } from '@/PaleGL/core/Attribute.ts';
import { Override } from '@/PaleGL/palegl';
// import { Vector3 } from '@/PaleGL/math/Vector3.ts';
// import { Color } from '@/PaleGL/math/Color.ts';

export type VolumetricLightPassParametersBase = {
    rayStep: number;
    blendRate: number;
    densityMultiplier: number;
    rayJitterSizeX: number;
    rayJitterSizeY: number;
    ratio: number;
};

export type VolumetricLightPassParameters = PostProcessPassParametersBase & VolumetricLightPassParametersBase;

export type VolumetricLightPassParametersArgs = Partial<VolumetricLightPassParameters>;

export function generateVolumetricLightParameters(params: VolumetricLightPassParametersArgs = {}): VolumetricLightPassParameters {
    return {
        type: PostProcessPassType.VolumetricLight,
        enabled: params.enabled ?? true,
        rayStep: params.rayStep ?? 0.5,
        blendRate: params.blendRate ?? 1,
        densityMultiplier: params.densityMultiplier ?? 1,
        rayJitterSizeX: params.rayJitterSizeX ?? 0.1,
        rayJitterSizeY: params.rayJitterSizeY ?? 0.1,
        ratio: params.ratio ?? 0.5,
    };
}

export class VolumetricLightPass extends PostProcessPassBase {
    // rayStep: number = 0.5;
    // blendRate: number = 1;
    // densityMultiplier: number = 1;
    // rayJitterSizeX: number = 0.1;
    // rayJitterSizeY: number = 0.1;
    // ratio: number = 0.5;
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
            fragmentShader,
            uniforms: [
                {
                    name: UniformNames.SpotLightShadowMap,
                    type: UniformTypes.TextureArray,
                    value: maton.range(MAX_SPOT_LIGHT_COUNT).map(() => null),
                },
                {
                    name: 'uRayStep',
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: 'uDensityMultiplier',
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: 'uRayJitterSizeX',
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: 'uRayJitterSizeY',
                    type: UniformTypes.Float,
                    value: 0,
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
                    name: 'uVolumetricDepthTexture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uBlendRate',
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

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
                    
                    // out vec4 vWorldPosition;
                   
                    void main() {
                        vec4 worldPosition = ${UniformNames.WorldMatrix} * vec4(${AttributeNames.Position}, 1.);
                        // vWorldPosition = worldPosition;
                        gl_Position = ${UniformNames.ProjectionMatrix} * ${UniformNames.ViewMatrix} * worldPosition;
                    }
                    `,
            fragmentShader: `#version 300 es
                   
                    precision mediump float;

                    // in vec4 vWorldPosition; 
                    out vec4 outColor;
                 
                    void main() {
                        outColor = vec4(1., 0., 0., 1.);
                        // outColor = vec4(vWorldPosition.xyz, 1.);
                    }
                    `,
            primitiveType: PrimitiveTypes.Triangles,
            blendType: BlendTypes.Opaque,
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

        // this.renderTargetSpotLightFrustum.setSize(this.width, this.height);
        this.renderTargetSpotLightFrustum.setSize(this.rawWidth, this.rawHeight);

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
            this.#spotLights.map((spotLight) => (spotLight.shadowMap ? spotLight.shadowMap?.read.depthTexture : null))
        );
        this.material.uniforms.setValue('uVolumetricDepthTexture', this.renderTargetSpotLightFrustum.depthTexture);
        this.material.uniforms.setValue('uRayStep', this.parameters.rayStep);
        this.material.uniforms.setValue('uDensityMultiplier', this.parameters.densityMultiplier);
        this.material.uniforms.setValue('uRayJitterSizeX', this.parameters.rayJitterSizeX);
        this.material.uniforms.setValue('uRayJitterSizeY', this.parameters.rayJitterSizeY);
        this.material.uniforms.setValue('uBlendRate', this.parameters.blendRate);

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
