import { MAX_SPOT_LIGHT_COUNT, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import volumetricLightFragmentShader from '@/PaleGL/shaders/volumetric-light-fragment.glsl';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { SpotLight } from '@/PaleGL/actors/SpotLight.ts';

export class VolumetricLightPass extends PostProcessPassBase {
    blendRate: number = 1;

    #spotLights: SpotLight[] = [];

    /**
     *
     * @param gpu
     */
    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = volumetricLightFragmentShader;

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
                {
                    name: 'uSpotLight',
                    type: UniformTypes.StructArray,
                    value: maton.range(MAX_SPOT_LIGHT_COUNT).map(() => {
                        return [
                            {
                                name: 'lightViewProjectionMatrix',
                                type: UniformTypes.Matrix4,
                                value: Matrix4.identity,
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
                {
                    name: 'lightViewProjectionMatrix',
                    type: UniformTypes.Matrix4,
                    value: spotLight.shadowCamera!.viewProjectionMatrix, // TODO: ある前提なのは本当はよくない
                },
            ])
        );
        this.material.uniforms.setValue(
            UniformNames.SpotLightShadowMap,
            this.#spotLights.map((spotLight) => (spotLight.shadowMap ? spotLight.shadowMap?.read.depthTexture : null))
        );

        super.render(options);
    }

    setSpotLights(spotLights: SpotLight[]) {
        this.#spotLights = spotLights;
    }
}
