import { MaterialArgs, createMaterial } from '@/PaleGL/materials/material.ts';
import {
    DEPTH_FUNC_TYPE_LEQUAL,
    MATERIAL_TYPE_SCREEN_SPACE_RAYMARCH,
    SHADING_MODEL_ID_LIT,
    ShadingModelIds,
    UniformBlockNames,
    UniformNames,
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
            name: UniformNames.DepthTexture,
            type: UNIFORM_TYPE_TEXTURE,
            value: null,
        },
        {
            name: UniformNames.CameraFov,
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: UniformNames.CameraAspect,
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },

        {
            name: UniformNames.BaseMap,
            type: UNIFORM_TYPE_TEXTURE,
            value: _baseMap,
        },
        {
            name: UniformNames.BaseColor,
            type: UNIFORM_TYPE_COLOR,
            value: _baseColor,
        },
        {
            name: UniformNames.BaseMapTiling,
            type: UNIFORM_TYPE_VECTOR4,
            // value: Vector2.one,
            value: _baseMapTiling,
        },
        {
            name: UniformNames.Metallic,
            type: UNIFORM_TYPE_FLOAT,
            value: _metallic,
        },
        {
            name: UniformNames.MetallicMap,
            type: UNIFORM_TYPE_TEXTURE,
            value: _metallicMap,
        },
        {
            name: UniformNames.MetallicMapTiling,
            type: UNIFORM_TYPE_VECTOR4,
            value: _metallicMapTiling,
        },

        {
            name: UniformNames.Roughness,
            type: UNIFORM_TYPE_FLOAT,
            value: _roughness,
        },
        {
            name: UniformNames.RoughnessMap,
            type: UNIFORM_TYPE_TEXTURE,
            value: _roughnessMap,
        },
        {
            name: UniformNames.RoughnessMapTiling,
            type: UNIFORM_TYPE_VECTOR4,
            value: _roughnessMapTiling,
        },
        {
            name: UniformNames.EmissiveColor,
            type: UNIFORM_TYPE_COLOR,
            value: _emissiveColor,
        },
    ];
    const shadingUniforms: UniformsData = [
        {
            name: UniformNames.ShadingModelId,
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
            UniformBlockNames.Common,
            UniformBlockNames.Transformations,
            UniformBlockNames.Camera,
            ...(uniformBlockNames ? uniformBlockNames : []),
        ],
    });

    return {
        ...material,
    };
}
