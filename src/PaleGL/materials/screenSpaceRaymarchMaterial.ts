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

export const createScreenSpaceRaymarchMaterial = ({
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
}: ScreenSpaceRaymarchMaterialArgs) => {
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
        [UNIFORM_NAME_DEPTH_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
        [UNIFORM_NAME_CAMERA_FOV, UNIFORM_TYPE_FLOAT, 0],
        [UNIFORM_NAME_CAMERA_ASPECT, UNIFORM_TYPE_FLOAT, 0],

        [UNIFORM_NAME_BASE_MAP, UNIFORM_TYPE_TEXTURE, _baseMap],
        [UNIFORM_NAME_BASE_COLOR, UNIFORM_TYPE_COLOR, _baseColor],
        [UNIFORM_NAME_BASE_MAP_TILING, UNIFORM_TYPE_VECTOR4, _baseMapTiling],
        // value: Vector2.one,
        [UNIFORM_NAME_METALLIC, UNIFORM_TYPE_FLOAT, _metallic],
        [UNIFORM_NAME_METALLIC_MAP, UNIFORM_TYPE_TEXTURE, _metallicMap],
        [UNIFORM_NAME_METALLIC_MAP_TILING, UNIFORM_TYPE_VECTOR4, _metallicMapTiling],

        [UNIFORM_NAME_ROUGHNESS, UNIFORM_TYPE_FLOAT, _roughness],
        [UNIFORM_NAME_ROUGHNESS_MAP, UNIFORM_TYPE_TEXTURE, _roughnessMap],
        [UNIFORM_NAME_ROUGHNESS_MAP_TILING, UNIFORM_TYPE_VECTOR4, _roughnessMapTiling],
        [UNIFORM_NAME_EMISSIVE_COLOR, UNIFORM_TYPE_COLOR, _emissiveColor],
    ];
    const shadingUniforms: UniformsData = [
        [UNIFORM_NAME_SHADING_MODEL_ID, UNIFORM_TYPE_INT, shadingModelId],
        // float,intどちらでもいい
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
