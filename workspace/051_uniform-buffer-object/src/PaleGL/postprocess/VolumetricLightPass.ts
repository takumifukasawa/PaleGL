import {
    MAX_SPOT_LIGHT_COUNT,
    RenderTargetTypes,
    UniformBlockNames,
    UniformNames,
    UniformTypes
} from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import volumetricLightFragmentShader from '@/PaleGL/shaders/volumetric-light-fragment.glsl';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
// import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { SpotLight } from '@/PaleGL/actors/SpotLight.ts';
// import { Vector3 } from '@/PaleGL/math/Vector3.ts';
// import { Color } from '@/PaleGL/math/Color.ts';

export class VolumetricLightPass extends PostProcessPassBase {
    rayStep: number = 0.5;
    blendRate: number = 1;
    densityMultiplier: number = 4;
    rayJitterSizeX: number = 0.1;
    rayJitterSizeY: number = 0.1;

    #spotLights: SpotLight[] = [];
    
    ratio: number;

    /**
     *
     * @param gpu
     * @param ratio
     */
    constructor({ gpu, ratio = 0.5 }: { gpu: GPU, ratio?: number }) {
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
                    name: 'uBlendRate',
                    type: UniformTypes.Float,
                    value: 1,
                },
            ],
            uniformBlockNames: [UniformBlockNames.Common, UniformBlockNames.Transformations, UniformBlockNames.Camera, UniformBlockNames.SpotLight],
            // renderTargetType: RenderTargetTypes.RGBA
            renderTargetType: RenderTargetTypes.RGBA16F
        });
        
        this.ratio = ratio;
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        this.width = Math.floor(width * this.ratio);
        this.height = Math.floor(height * this.ratio);
        super.setSize(this.width, this.height);
        this.material.uniforms.setValue(UniformNames.TargetWidth, this.width);
        this.material.uniforms.setValue(UniformNames.TargetHeight, this.height);
    }

    /**
     *
     * @param options
     */
    render(options: PostProcessPassRenderArgs) {
        this.material.uniforms.setValue(
            UniformNames.SpotLightShadowMap,
            this.#spotLights.map((spotLight) => (spotLight.shadowMap ? spotLight.shadowMap?.read.depthTexture : null))
        );

        this.material.uniforms.setValue('uRayStep', this.rayStep);
        this.material.uniforms.setValue('uDensityMultiplier', this.densityMultiplier);
        this.material.uniforms.setValue('uRayJitterSizeX', this.rayJitterSizeX);
        this.material.uniforms.setValue('uRayJitterSizeY', this.rayJitterSizeY);
        this.material.uniforms.setValue('uBlendRate', this.blendRate);

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
