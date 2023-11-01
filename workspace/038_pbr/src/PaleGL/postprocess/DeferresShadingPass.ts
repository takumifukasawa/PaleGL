import { GPU } from '@/PaleGL/core/GPU';
// import { Uniforms } from '@/PaleGL/materials/Material';
import { PostProcessPassBase } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import deferredShadingFragmentShader from '@/PaleGL/shaders/deferred-shading-fragment.glsl';
import { Skybox } from '@/PaleGL/actors/Skybox.ts';

export class DeferredShadingPass extends PostProcessPassBase {
    constructor({
        gpu, // fragmentShader,
        // uniforms,
    } // name,
    : {
        gpu: GPU;
        // fragmentShader: string;
        // uniforms?: Uniforms;
        // name?: string;
    }) {
        const uniforms = {
            // TODO: passのuniformのいくつかは強制的に全部渡すようにしちゃって良い気がする
            [UniformNames.GBufferATexture]: {
                type: UniformTypes.Texture,
                value: null,
            },
            [UniformNames.GBufferBTexture]: {
                type: UniformTypes.Texture,
                value: null,
            },
            [UniformNames.GBufferCTexture]: {
                type: UniformTypes.Texture,
                value: null,
            },
            [UniformNames.DepthTexture]: {
                type: UniformTypes.Texture,
                value: null,
            },
            [UniformNames.ShadowMap]: {
                type: UniformTypes.Texture,
                value: null,
            },
            uAmbientOcclusionTexture: {
                type: UniformTypes.Texture,
                value: null,
            },

            // TODO: pass all lights
            [UniformNames.DirectionalLight]: {
                type: UniformTypes.Struct,
                value: {
                    // direction: Vector3.zero,
                    // intensity: 0,
                    // color: new Vector4(0, 0, 0, 0),
                    direction: {
                        type: UniformTypes.Vector3,
                        value: Vector3.zero,
                    },
                    intensity: {
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    color: {
                        type: UniformTypes.Color,
                        value: new Color(0, 0, 0, 1),
                    },
                },
            },

            [UniformNames.Skybox]: {
                type: UniformTypes.Struct,
                value: {
                    cubeMap: {
                        type: UniformTypes.CubeMap,
                        value: null,
                    },
                    diffuseIntensity: {
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    specularIntensity: {
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    rotationOffset: {
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    maxLodLevel: {
                        type: UniformTypes.Float,
                        value: 0,
                    },
                },
            },

            // // TODO: pass skybox env
            // uEnvMap: {
            //     type: UniformTypes.CubeMap,
            //     value: null,
            // },
        };

        super({
            gpu,
            name: 'DeferredShadingPass',
            fragmentShader: deferredShadingFragmentShader,
            uniforms,
            // useEnvMap: true, // TODO: これはいらないようにしたい. 確実にshadingするので
            receiveShadow: true, // TODO: これはいらないようにしたい. 確実にshadingするので
            // renderTargetType: RenderTargetTypes.RGBA16F,
            renderTargetType: RenderTargetTypes.RGBA
        });
    }

    updateSkyboxUniforms(skybox: Skybox) {
        this.material.updateUniform(UniformNames.Skybox, {
            cubeMap: {
                type: UniformTypes.CubeMap,
                value: skybox.cubeMap,
            },
            diffuseIntensity: {
                type: UniformTypes.Float,
                value: skybox.diffuseIntensity,
            },
            specularIntensity: {
                type: UniformTypes.Float,
                value: skybox.specularIntensity,
            },
            rotationOffset: {
                type: UniformTypes.Float,
                value: skybox.rotationOffset,
            },
            maxLodLevel: {
                type: UniformTypes.Float,
                value: skybox.cubeMap.maxLodLevel,
            },
        });
    }

    // render(options: PostProcessPassRenderArgs) {
    //     super.render(options);
    //     console.log(this.material.uniforms)
    // }
}
