import { MaterialArgs, createMaterial } from '@/PaleGL/materials/material.ts';
import {
    DEPTH_FUNC_TYPE_LEQUAL,
    MATERIAL_TYPE_SCREEN_SPACE_RAYMARCH,
    SHADING_MODEL_ID_LIT,
    ShadingModelIds,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_NAME_BASE_COLOR,
    UNIFORM_NAME_BASE_MAP,
    UNIFORM_NAME_BASE_MAP_TILING,
    UNIFORM_NAME_CAMERA_ASPECT,
    UNIFORM_NAME_CAMERA_FOV,
    UNIFORM_NAME_DEPTH_TEXTURE,
    UNIFORM_NAME_EMISSIVE_COLOR,
    UNIFORM_NAME_METALLIC,
    UNIFORM_NAME_METALLIC_MAP,
    UNIFORM_NAME_METALLIC_MAP_TILING,
    UNIFORM_NAME_ROUGHNESS,
    UNIFORM_NAME_ROUGHNESS_MAP,
    UNIFORM_NAME_ROUGHNESS_MAP_TILING,
    UNIFORM_NAME_SHADING_MODEL_ID,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_VECTOR4,
    UNIFORM_TYPE_COLOR,
    UNIFORM_TYPE_INT
} from '@/PaleGL/constants';
import postprocessVert from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';
// import postprocessVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import {Color, createColorBlack, createColorWhite} from '@/PaleGL/math/color.ts';
import { Texture } from '@/PaleGL/core/texture.ts';
import {createVector4, Vector4} from '@/PaleGL/math/vector4.ts';

// TODO: uniformsは一旦まっさらにしている。metallic,smoothnessの各種パラメーター、必要になりそうだったら適宜追加する
export type ScreenSpaceRaymarchMaterialArgs = {
    shadingModelId?: ShadingModelIds;
    baseColor?: Color;
    baseMap?: Texture;
    baseMapTiling?: Vector4;
    metallic?: number;
    metallicMap?: Texture | null;
    metallicMapTiling?: Vector4;
    roughness?: number;
    roughnessMap?: Texture | null;
    roughnessMapTiling?: Vector4;
    emissiveColor?: Color;
    fragmentShader?: string;
    depthFragmentShader?: string;
} & MaterialArgs;

export type ScreenSpaceRaymarchMaterial = ReturnType<typeof createScreenSpaceRaymarchMaterial>;

export function createScreenSpaceRaymarchMaterial({
    // TODO: 外部化
    fragmentShader,
    depthFragmentShader,
    shadingModelId = SHADING_MODEL_ID_LIT,
    uniforms = [],
    baseColor,
    baseMap,
    baseMapTiling, // vec4
    metallic,
    metallicMap,
    metallicMapTiling,
    roughness,
    roughnessMap,
    roughnessMapTiling,
    emissiveColor,
    uniformBlockNames,
    ...options
}: ScreenSpaceRaymarchMaterialArgs) {
    const _baseMap = baseMap || null;
    const _baseColor = baseColor || createColorWhite();
    const _baseMapTiling = baseMapTiling || createVector4(1, 1, 0, 0);
    const _roughnessMap = roughnessMap || null;
    const _roughnessMapTiling = roughnessMapTiling || createVector4(1, 1, 0, 0);
    const _roughness = roughness || 0;
    const _metallic = metallic || 0;
    const _metallicMap = metallicMap || null;
    const _metallicMapTiling = metallicMapTiling || createVector4(1, 1, 0, 0);
    const _emissiveColor = emissiveColor || createColorBlack();

    const commonUniforms: UniformsData = [
        {
            name: UNIFORM_NAME_DEPTH_TEXTURE,
            type: UNIFORM_TYPE_TEXTURE,
            value: null,
        },
        {
            name: UNIFORM_NAME_CAMERA_FOV,
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: UNIFORM_NAME_CAMERA_ASPECT,
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },

        {
            name: UNIFORM_NAME_BASE_MAP,
            type: UNIFORM_TYPE_TEXTURE,
            value: _baseMap,
        },
        {
            name: UNIFORM_NAME_BASE_COLOR,
            type: UNIFORM_TYPE_COLOR,
            value: _baseColor,
        },
        {
            name: UNIFORM_NAME_BASE_MAP_TILING,
            type: UNIFORM_TYPE_VECTOR4,
            // value: Vector2.one,
            value: _baseMapTiling,
        },
        {
            name: UNIFORM_NAME_METALLIC,
            type: UNIFORM_TYPE_FLOAT,
            value: _metallic,
        },
        {
            name: UNIFORM_NAME_METALLIC_MAP,
            type: UNIFORM_TYPE_TEXTURE,
            value: _metallicMap,
        },
        {
            name: UNIFORM_NAME_METALLIC_MAP_TILING,
            type: UNIFORM_TYPE_VECTOR4,
            value: _metallicMapTiling,
        },

        {
            name: UNIFORM_NAME_ROUGHNESS,
            type: UNIFORM_TYPE_FLOAT,
            value: _roughness,
        },
        {
            name: UNIFORM_NAME_ROUGHNESS_MAP,
            type: UNIFORM_TYPE_TEXTURE,
            value: _roughnessMap,
        },
        {
            name: UNIFORM_NAME_ROUGHNESS_MAP_TILING,
            type: UNIFORM_TYPE_VECTOR4,
            value: _roughnessMapTiling,
        },
        {
            name: UNIFORM_NAME_EMISSIVE_COLOR,
            type: UNIFORM_TYPE_COLOR,
            value: _emissiveColor,
        },
    ];
    const shadingUniforms: UniformsData = [
        {
            name: UNIFORM_NAME_SHADING_MODEL_ID,
            type: UNIFORM_TYPE_INT, // float,intどちらでもいい
            value: shadingModelId,
        },
    ];

    const mergedUniforms: UniformsData = [...commonUniforms, ...shadingUniforms, ...(uniforms ? uniforms : [])];

    // TODO: できるだけconstructorの直後に持っていきたい
    const material = createMaterial({
        ...options,
        name: 'ScreenSpaceRaymarchMaterial',
        type: MATERIAL_TYPE_SCREEN_SPACE_RAYMARCH,
        vertexShader: postprocessVert,
        fragmentShader,
        depthFragmentShader,
        uniforms: mergedUniforms,
        // depthUniforms: commonUniforms,
        depthUniforms: mergedUniforms, // TODO: common, uniforms の2つで十分なはず。alpha test をしない限り
        // NOTE: GBufferMaterialの設定
        // useNormalMap: !!normalMap,
        // depthTest: true,
        // depthWrite: false,
        // depthFuncType: DEPTH_FUNC_TYPE_EQUAL,
        // NOTE: GBufferMaterialと違う点
        depthTest: true,
        depthWrite: true,
        depthFuncType: DEPTH_FUNC_TYPE_LEQUAL,
        skipDepthPrePass: true,
        uniformBlockNames: [
            UNIFORM_BLOCK_NAME_COMMON,
            UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
            UNIFORM_BLOCK_NAME_CAMERA,
            ...(uniformBlockNames ? uniformBlockNames : []),
        ],
    });

    return {
        ...material,
    };
}
