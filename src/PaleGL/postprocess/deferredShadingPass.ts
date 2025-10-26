import {
    createPostProcessSinglePass,
    PostProcessPassParametersBaseArgs,
    PostProcessSinglePass,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';

import { Skybox } from '@/PaleGL/actors/meshes/skybox.ts';
import {
    MAX_SPOT_LIGHT_COUNT,
    POST_PROCESS_PASS_TYPE_DEFERRED_SHADING,
    RENDER_TARGET_TYPE_R11F_G11F_B10F,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_BLOCK_NAME_DIRECTIONAL_LIGHT,
    UNIFORM_BLOCK_NAME_POINT_LIGHT,
    UNIFORM_BLOCK_NAME_SPOT_LIGHT,
    UNIFORM_NAME_AMBIENT_OCCLUSION_TEXTURE,
    UNIFORM_NAME_DEPTH_TEXTURE,
    UNIFORM_NAME_DIRECTIONAL_LIGHT_SHADOW_MAP,
    UNIFORM_NAME_GBUFFER_A_TEXTURE,
    UNIFORM_NAME_GBUFFER_B_TEXTURE,
    UNIFORM_NAME_GBUFFER_C_TEXTURE,
    UNIFORM_NAME_GBUFFER_D_TEXTURE,
    UNIFORM_NAME_SCREEN_SPACE_SHADOW_TEXTURE,
    UNIFORM_NAME_SKYBOX,
    UNIFORM_NAME_SPOT_LIGHT_SHADOW_MAP,
    UNIFORM_TYPE_CUBE_MAP,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_STRUCT,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_TEXTURE_ARRAY,
} from '@/PaleGL/constants.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import deferredShadingFragmentShader from '@/PaleGL/shaders/deferred-shading-fragment.glsl';
import { maton } from '@/PaleGL/utilities/maton.ts';

const CUBE_MAP_UNIFORM_NAME = 'cubeMap';
const DIFFUSE_INTENSITY_UNIFORM_NAME = 'diffuseIntensity';
const SPECULAR_INTENSITY_UNIFORM_NAME = 'specularIntensity';
const ROTATION_OFFSET_UNIFORM_NAME = 'rotationOffset';
const MAX_LOD_LEVEL_UNIFORM_NAME = 'maxLodLevel';

export type DeferredShadingPassArgs = PostProcessPassParametersBaseArgs;

export type DeferredShadingPass = PostProcessSinglePass;

export function createDeferredShadingPass(args: DeferredShadingPassArgs): DeferredShadingPass {
    const { gpu } = args;

    const uniforms: UniformsData = [
        // TODO: passのuniformのいくつかは強制的に全部渡すようにしちゃって良い気がする
        [UNIFORM_NAME_GBUFFER_A_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
        [UNIFORM_NAME_GBUFFER_B_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
        [UNIFORM_NAME_GBUFFER_C_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
        [UNIFORM_NAME_GBUFFER_D_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
        [UNIFORM_NAME_DEPTH_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
        [UNIFORM_NAME_SCREEN_SPACE_SHADOW_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
        [UNIFORM_NAME_AMBIENT_OCCLUSION_TEXTURE, UNIFORM_TYPE_TEXTURE, null],

        [UNIFORM_NAME_DIRECTIONAL_LIGHT_SHADOW_MAP, UNIFORM_TYPE_TEXTURE, null],

        [
            UNIFORM_NAME_SPOT_LIGHT_SHADOW_MAP,
            UNIFORM_TYPE_TEXTURE_ARRAY,
            maton.range(MAX_SPOT_LIGHT_COUNT).map(() => null),
        ],

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
        [
            UNIFORM_NAME_SKYBOX,
            UNIFORM_TYPE_STRUCT,
            [
                [CUBE_MAP_UNIFORM_NAME, UNIFORM_TYPE_CUBE_MAP, null],
                [DIFFUSE_INTENSITY_UNIFORM_NAME, UNIFORM_TYPE_FLOAT, 0],
                [SPECULAR_INTENSITY_UNIFORM_NAME, UNIFORM_TYPE_FLOAT, 0],
                [ROTATION_OFFSET_UNIFORM_NAME, UNIFORM_TYPE_FLOAT, 0],
                [MAX_LOD_LEVEL_UNIFORM_NAME, UNIFORM_TYPE_FLOAT, 0],
            ],
        ],
    ];
}

export function updateMaterialSkyboxUniforms(material: Material, skybox: Skybox) {
    setMaterialUniformValue(material, UNIFORM_NAME_SKYBOX, [
        [CUBE_MAP_UNIFORM_NAME, UNIFORM_TYPE_CUBE_MAP, skybox.cubeMap],
        [DIFFUSE_INTENSITY_UNIFORM_NAME, UNIFORM_TYPE_FLOAT, skybox.baseIntensity],
        [SPECULAR_INTENSITY_UNIFORM_NAME, UNIFORM_TYPE_FLOAT, skybox.specularIntensity],
        [ROTATION_OFFSET_UNIFORM_NAME, UNIFORM_TYPE_FLOAT, skybox.rotationOffset],
        [MAX_LOD_LEVEL_UNIFORM_NAME, UNIFORM_TYPE_FLOAT, skybox.cubeMap.maxLodLevel],
    ]);
}
