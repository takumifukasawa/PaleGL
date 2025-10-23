import {
    createPostProcessSinglePass,
    PostProcessSinglePass,
    PostProcessPassParametersBaseArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';

import {
    MAX_SPOT_LIGHT_COUNT,
    POST_PROCESS_PASS_TYPE_DEFERRED_SHADING,
    RENDER_TARGET_TYPE_R11F_G11F_B10F,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_BLOCK_NAME_DIRECTIONAL_LIGHT,
    UNIFORM_BLOCK_NAME_SPOT_LIGHT,
    UNIFORM_BLOCK_NAME_POINT_LIGHT,
    UniformNames,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_TEXTURE_ARRAY,
    UNIFORM_TYPE_CUBE_MAP,
    UNIFORM_TYPE_STRUCT,

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
            type: UNIFORM_TYPE_TEXTURE,
            value: null,
        },
        {
            name: UniformNames.GBufferBTexture,
            type: UNIFORM_TYPE_TEXTURE,
            value: null,
        },
        {
            name: UniformNames.GBufferCTexture,
            type: UNIFORM_TYPE_TEXTURE,
            value: null,
        },
        {
            name: UniformNames.GBufferDTexture,
            type: UNIFORM_TYPE_TEXTURE,
            value: null,
        },
        {
            name: UniformNames.DepthTexture,
            type: UNIFORM_TYPE_TEXTURE,
            value: null,
        },
        {
            name: 'uScreenSpaceShadowTexture',
            type: UNIFORM_TYPE_TEXTURE,
            value: null,
        },
        {
            name: 'uAmbientOcclusionTexture',
            type: UNIFORM_TYPE_TEXTURE,
            value: null,
        },

        {
            name: UniformNames.DirectionalLightShadowMap,
            type: UNIFORM_TYPE_TEXTURE,
            value: null,
        },

        {
            name: UniformNames.SpotLightShadowMap,
            type: UNIFORM_TYPE_TEXTURE_ARRAY,
            value: maton.range(MAX_SPOT_LIGHT_COUNT).map(() => null),
        },

        ...createSkyboxUniforms(),
    ];

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: POST_PROCESS_PASS_TYPE_DEFERRED_SHADING,
            name: 'DeferredShadingPass',
            fragmentShader: deferredShadingFragmentShader,
            uniforms,
            useEnvMap: true, // TODO: これはいらないようにしたい. 確実にshadingするので
            receiveShadow: true, // TODO: これはいらないようにしたい. 確実にshadingするので
            renderTargetType: RENDER_TARGET_TYPE_R11F_G11F_B10F,
            uniformBlockNames: [
                UNIFORM_BLOCK_NAME_CAMERA,
                UNIFORM_BLOCK_NAME_DIRECTIONAL_LIGHT,
                UNIFORM_BLOCK_NAME_SPOT_LIGHT,
                UNIFORM_BLOCK_NAME_POINT_LIGHT,
            ],
            enabled: args.enabled,
        }),
    };
}

export function createSkyboxUniforms(): UniformsData {
    return [
        {
            name: UniformNames.Skybox,
            type: UNIFORM_TYPE_STRUCT,
            value: [
                {
                    name: CUBE_MAP_UNIFORM_NAME,
                    type: UNIFORM_TYPE_CUBE_MAP,
                    value: null,
                },
                {
                    name: BASE_INTENSITY_UNIFORM_NAME,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 0,
                },
                {
                    name: SPECULAR_INTENSITY_UNIFORM_NAME,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 0,
                },
                {
                    name: ROTATION_OFFSET_UNIFORM_NAME,
                    type: UNIFORM_TYPE_FLOAT,
                    value: 0,
                },
                {
                    name: MAX_LOD_LEVEL_UNIFORM_NAME,
                    type: UNIFORM_TYPE_FLOAT,
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
            type: UNIFORM_TYPE_CUBE_MAP,
            value: skybox.cubeMap,
        },
        {
            name: BASE_INTENSITY_UNIFORM_NAME,
            type: UNIFORM_TYPE_FLOAT,
            value: skybox.baseIntensity,
        },
        {
            name: SPECULAR_INTENSITY_UNIFORM_NAME,
            type: UNIFORM_TYPE_FLOAT,
            value: skybox.specularIntensity,
        },
        {
            name: ROTATION_OFFSET_UNIFORM_NAME,
            type: UNIFORM_TYPE_FLOAT,
            value: skybox.rotationOffset,
        },
        {
            name: MAX_LOD_LEVEL_UNIFORM_NAME,
            type: UNIFORM_TYPE_FLOAT,
            value: skybox.cubeMap.maxLodLevel,
        },
    ]);
}
