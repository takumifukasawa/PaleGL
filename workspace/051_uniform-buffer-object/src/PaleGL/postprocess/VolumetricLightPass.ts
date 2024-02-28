import { MAX_SPOT_LIGHT_COUNT, UniformBlockNames, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import volumetricLightFragmentShader from '@/PaleGL/shaders/volumetric-light-fragment.glsl';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { SpotLight } from '@/PaleGL/actors/SpotLight.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
// import { Color } from '@/PaleGL/math/Color.ts';

export class VolumetricLightPass extends PostProcessPassBase {
    rayStep: number = 0.5;
    blendRate: number = 1;
    densityMultiplier: number = 4;
    rayJitterSizeX: number = 0.2;
    rayJitterSizeY: number = 0.2;

    #spotLights: SpotLight[] = [];

    /**
     *
     * @param gpu
     */
    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = volumetricLightFragmentShader;
        
        console.log(fragmentShader)

        super({
            gpu,
            fragmentShader,
            uniforms: [
                // [UniformNames.TargetWidth]: {
                //     type: UniformTypes.Float,
                //     value: 1,
                // },
                // [UniformNames.TargetHeight]: {
                //     type: UniformTypes.Float,
                //     value: 1,
                // },
                // {
                //     name: UniformNames.InverseProjectionMatrix,
                //     type: UniformTypes.Matrix4,
                //     value: Matrix4.identity,
                // },
                {
                    name: 'uSpotLight',
                    type: UniformTypes.StructArray,
                    value: maton.range(MAX_SPOT_LIGHT_COUNT).map(() => {
                        // TODO: spot light の uniform構造体、関数でまとめて作成して共通化したい
                        return [
                            // TODO: spot light の uniform構造体、関数でまとめて更新したい
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
                            // {
                            //     name: UniformNames.LightColor,
                            //     type: UniformTypes.Color,
                            //     value: Color.black,
                            // },
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
                                name: UniformNames.LightViewProjectionMatrix,
                                type: UniformTypes.Matrix4,
                                value: Matrix4.identity, // TODO: ある前提なのは本当はよくない
                            },
                            {
                                name: UniformNames.ShadowBias,
                                type: UniformTypes.Float,
                                value: 0.001,
                            },
                        ];
                    }),
                },

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
                    // uDepthTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uBlendRate',
                    type: UniformTypes.Float,
                    value: 1,
                },
            ],
            uniformBlockNames: [UniformBlockNames.Transformations, UniformBlockNames.Camera, UniformBlockNames.SpotLight],
        });
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        super.setSize(width, height);
        // this.material.uniforms.uTargetWidth.value = width;
        // this.material.uniforms.uTargetHeight.value = height;
        this.material.uniforms.setValue(UniformNames.TargetWidth, width);
        this.material.uniforms.setValue(UniformNames.TargetHeight, height);
    }

    /**
     *
     * @param options
     */
    render(options: PostProcessPassRenderArgs) {
        this.material.uniforms.setValue(
            'uSpotLight',
            this.#spotLights.map((spotLight) => [
                // TODO: spot light の uniform構造体、関数でまとめて更新したい
                // {
                //     name: UniformNames.LightColor,
                //     type: UniformTypes.Color,
                //     value: spotLight.color,
                // },
                {
                    name: UniformNames.LightIntensity,
                    type: UniformTypes.Float,
                    value: spotLight.intensity,
                },
                {
                    name: UniformNames.LightViewProjectionMatrix,
                    type: UniformTypes.Matrix4,
                    value: spotLight.shadowCamera!.viewProjectionMatrix, // TODO: ある前提なのは本当はよくない
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
            ])
            // true
        );

        this.material.uniforms.setValue(
            UniformNames.SpotLightShadowMap,
            this.#spotLights.map((spotLight) => (spotLight.shadowMap ? spotLight.shadowMap?.read.depthTexture : null))
        );

        this.material.uniforms.setValue('uRayStep', this.rayStep);
        this.material.uniforms.setValue('uDensityMultiplier', this.densityMultiplier);
        this.material.uniforms.setValue('uRayJitterSizeX', this.rayJitterSizeX);
        this.material.uniforms.setValue('uRayJitterSizeY', this.rayJitterSizeY);

        super.render(options);
    }

    setSpotLights(spotLights: SpotLight[]) {
        this.#spotLights = spotLights;
    }
}
