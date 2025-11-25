import {
    DEPTH_FUNC_TYPE_EQUAL,
    MATERIAL_TYPE_UNLIT,
    SHADING_MODEL_ID_UNLIT,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_NAME_BASE_COLOR,
    UNIFORM_NAME_BASE_MAP,
    UNIFORM_NAME_MAP_TILING,
    UNIFORM_NAME_SHADING_MODEL_ID,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_VECTOR4,
    UNIFORM_TYPE_INT,
    UNIFORM_TYPE_COLOR,
    // CUSTOM_BEGIN comment out
    // VertexShaderModifiers,
    // CUSTOM_END
} from '@/PaleGL/constants';
import { Texture } from '@/PaleGL/core/texture.ts';
import { createMaterial, Material, MaterialArgs } from '@/PaleGL/materials/material.ts';
import { Color, createColorWhite } from '@/PaleGL/math/color.ts';

import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createVector4, Vector4 } from '@/PaleGL/math/vector4.ts';
import gBufferDepthFrag from '@/PaleGL/shaders/gbuffer-depth-fragment.glsl';
import gBufferVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import unlitFrag from '@/PaleGL/shaders/unlit-fragment.glsl';

export type UnlitMaterialArgs = {
    baseMap?: Texture;
    mapTiling?: Vector4;
    baseColor?: Color;
    // CUSTOM_BEGIN comment out
    // vertexShaderModifiers?: VertexShaderModifiers;
    // CUSTOM_END
    uniforms?: UniformsData;
} & MaterialArgs;

export type UnlitMaterial = Material;

export const createUnlitMaterial = (args: UnlitMaterialArgs = {}): UnlitMaterial => {
    const {
        baseMap,
        mapTiling, // vec4
        baseColor,
        // CUSTOM_BEGIN comment out
        // vertexShaderModifiers = [],
        // CUSTOM_END
        uniforms = [],
        uniformBlockNames = [],
        ...options
    } = args;

    const baseUniforms: UniformsData = [
        [UNIFORM_NAME_BASE_MAP, UNIFORM_TYPE_TEXTURE, baseMap],
        [UNIFORM_NAME_MAP_TILING, UNIFORM_TYPE_VECTOR4, mapTiling || createVector4(1, 1, 0, 0)],
        [UNIFORM_NAME_BASE_COLOR, UNIFORM_TYPE_COLOR, baseColor || createColorWhite()],
        [UNIFORM_NAME_SHADING_MODEL_ID, UNIFORM_TYPE_INT, SHADING_MODEL_ID_UNLIT],
    ];

    const mergedUniforms: UniformsData = [...baseUniforms, ...uniforms];

    const depthUniforms: UniformsData = [
        [UNIFORM_NAME_BASE_MAP, UNIFORM_TYPE_TEXTURE, baseMap],
        [UNIFORM_NAME_MAP_TILING, UNIFORM_TYPE_VECTOR4, mapTiling || createVector4(1, 1, 0, 0)],
        [UNIFORM_NAME_BASE_COLOR, UNIFORM_TYPE_COLOR, baseColor || createColorWhite()],
        ...uniforms,
    ];

    const material = createMaterial({
        // CUSTOM_BEGIN comment out
        // name: 'UnlitMaterial',
        // vertexShaderModifiers,
        // CUSTOM_END
        type: MATERIAL_TYPE_UNLIT,
        vertexShader: gBufferVert,
        fragmentShader: unlitFrag,
        depthFragmentShader: gBufferDepthFrag,
        uniforms: mergedUniforms,
        depthUniforms,
        useNormalMap: false,
        depthTest: true,
        depthWrite: false, // TODO: これはGBufferの場合. unlitはtransparentの場合も対処すべき??
        depthFuncType: DEPTH_FUNC_TYPE_EQUAL, // NOTE: これはGBufferの場合
        ...options, // overrides
        uniformBlockNames: [
            UNIFORM_BLOCK_NAME_COMMON,
            UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
            UNIFORM_BLOCK_NAME_CAMERA,
            ...(uniformBlockNames ?? []), // merge
        ],
    });

    return {
        ...material,
    };
}
