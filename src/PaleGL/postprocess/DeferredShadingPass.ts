import { GPU } from '@/PaleGL/core/GPU';
import {
    PostProcessPassBase,
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import {
    MAX_SPOT_LIGHT_COUNT,
    PostProcessPassType,
    RenderTargetTypes,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
// import { Vector3 } from '@/PaleGL/math/Vector3.ts';
// import { Color } from '@/PaleGL/math/Color.ts';
import deferredShadingFragmentShader from '@/PaleGL/shaders/deferred-shading-fragment.glsl';
import { Skybox } from '@/PaleGL/actors/Skybox.ts';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
// import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { isDevelopment } from '@/PaleGL/utilities/envUtilities.ts';

export type DeferredShadingParametersBase = PostProcessPassParametersBase;

export type DeferredShadingParameters = PostProcessPassParametersBase;

export type DeferredShadingParametersArgs = Partial<DeferredShadingParameters>;

export class DeferredShadingPass extends PostProcessPassBase {
    constructor(args // name,
    : {
        gpu: GPU;
        parameters?: DeferredShadingParametersArgs;
    }) {
        const { gpu } = args;

        const parameters = { ...args.parameters };

        const uniforms: UniformsData = [
            // TODO: passのuniformのいくつかは強制的に全部渡すようにしちゃって良い気がする
            {
                name: UniformNames.GBufferATexture,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: UniformNames.GBufferBTexture,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: UniformNames.GBufferCTexture,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: UniformNames.GBufferDTexture,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: UniformNames.DepthTexture,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: 'uScreenSpaceShadowTexture',
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: 'uAmbientOcclusionTexture',
                type: UniformTypes.Texture,
                value: null,
            },

            {
                name: UniformNames.DirectionalLightShadowMap,
                type: UniformTypes.Texture,
                value: null,
            },

            {
                name: UniformNames.SpotLightShadowMap,
                type: UniformTypes.TextureArray,
                value: maton.range(MAX_SPOT_LIGHT_COUNT).map(() => null),
            },

            {
                name: UniformNames.Skybox,
                type: UniformTypes.Struct,
                value: [
                    {
                        name: 'cubeMap',
                        type: UniformTypes.CubeMap,
                        value: null,
                    },
                    {
                        name: 'diffuseIntensity',
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: 'specularIntensity',
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: 'rotationOffset',
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: 'maxLodLevel',
                        type: UniformTypes.Float,
                        value: 0,
                    },
                ],
            },
        ];

        super({
            gpu,
            type: PostProcessPassType.DeferredShading,
            parameters,
            name: 'DeferredShadingPass',
            fragmentShader: deferredShadingFragmentShader,
            uniforms,
            // useEnvMap: true, // TODO: これはいらないようにしたい. 確実にshadingするので
            receiveShadow: true, // TODO: これはいらないようにしたい. 確実にshadingするので
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniformBlockNames: [
                UniformBlockNames.Camera,
                UniformBlockNames.DirectionalLight,
                UniformBlockNames.SpotLight,
                UniformBlockNames.PointLight,
            ],
        });
    }

    /**
     *
     * @param skybox
     */
    updateSkyboxUniforms(skybox: Skybox) {
        if (isDevelopment()) {
            this.material.uniforms.setValue(UniformNames.Skybox, [
                {
                    name: 'cubeMap',
                    type: UniformTypes.CubeMap,
                    value: skybox.cubeMap,
                },
                {
                    name: 'diffuseIntensity',
                    type: UniformTypes.Float,
                    value: skybox.diffuseIntensity,
                },
                {
                    name: 'specularIntensity',
                    type: UniformTypes.Float,
                    value: skybox.specularIntensity,
                },
                {
                    name: 'rotationOffset',
                    type: UniformTypes.Float,
                    value: skybox.rotationOffset,
                },
                {
                    name: 'maxLodLevel',
                    type: UniformTypes.Float,
                    value: skybox.cubeMap.maxLodLevel,
                },
            ]);
        }
    }

    /**
     *
     * @param args
     */
    render(args: PostProcessPassRenderArgs) {
        super.render(args);
        // console.log(this.material.uniforms)
    }
}
