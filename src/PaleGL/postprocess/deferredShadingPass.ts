import {
    createPostProcessSinglePass,
    PostProcessSinglePass,
    PostProcessPassParametersBaseArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';

import {
    MAX_SPOT_LIGHT_COUNT,
    PostProcessPassType,
    RenderTargetTypes,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
import deferredShadingFragmentShader from '@/PaleGL/shaders/deferred-shading-fragment.glsl';
import { Skybox } from '@/PaleGL/actors/meshes/skybox.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';

const CUBE_MAP_UNIFORM_NAME = 'cubeMap';
const BASE_INTENSITY_UNIFORM_NAME = 'baseIntensity';
const SPECULAR_INTENSITY_UNIFORM_NAME = 'specularIntensity';
const ROTATION_OFFSET_UNIFORM_NAME = 'rotationOffset';
const MAX_LOD_LEVEL_UNIFORM_NAME = 'maxLodLevel';

export type DeferredShadingPassArgs = PostProcessPassParametersBaseArgs;

export type DeferredShadingPass = PostProcessSinglePass;

export function createDeferredShadingPass(args: DeferredShadingPassArgs): DeferredShadingPass {
    const { gpu } = args;

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

        ...createSkyboxUniforms(),
    ];

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: PostProcessPassType.DeferredShading,
            name: 'DeferredShadingPass',
            fragmentShader: deferredShadingFragmentShader,
            uniforms,
            useEnvMap: true, // TODO: これはいらないようにしたい. 確実にshadingするので
            receiveShadow: true, // TODO: これはいらないようにしたい. 確実にshadingするので
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniformBlockNames: [
                UniformBlockNames.Camera,
                UniformBlockNames.DirectionalLight,
                UniformBlockNames.SpotLight,
                UniformBlockNames.PointLight,
            ],
            enabled: args.enabled,
        }),
    };
}

export function createSkyboxUniforms(): UniformsData {
    return [
        {
            name: UniformNames.Skybox,
            type: UniformTypes.Struct,
            value: [
                {
                    name: CUBE_MAP_UNIFORM_NAME,
                    type: UniformTypes.CubeMap,
                    value: null,
                },
                {
                    name: BASE_INTENSITY_UNIFORM_NAME,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: SPECULAR_INTENSITY_UNIFORM_NAME,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: ROTATION_OFFSET_UNIFORM_NAME,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: MAX_LOD_LEVEL_UNIFORM_NAME,
                    type: UniformTypes.Float,
                    value: 0,
                },
            ],
        },
    ];
}

export function updateMaterialSkyboxUniforms(material: Material, skybox: Skybox) {
    setMaterialUniformValue(material, UniformNames.Skybox, [
        {
            name: CUBE_MAP_UNIFORM_NAME,
            type: UniformTypes.CubeMap,
            value: skybox.cubeMap,
        },
        {
            name: BASE_INTENSITY_UNIFORM_NAME,
            type: UniformTypes.Float,
            value: skybox.baseIntensity,
        },
        {
            name: SPECULAR_INTENSITY_UNIFORM_NAME,
            type: UniformTypes.Float,
            value: skybox.specularIntensity,
        },
        {
            name: ROTATION_OFFSET_UNIFORM_NAME,
            type: UniformTypes.Float,
            value: skybox.rotationOffset,
        },
        {
            name: MAX_LOD_LEVEL_UNIFORM_NAME,
            type: UniformTypes.Float,
            value: skybox.cubeMap.maxLodLevel,
        },
    ]);
}
