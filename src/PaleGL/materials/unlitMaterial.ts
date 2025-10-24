import {
    DEPTH_FUNC_TYPE_EQUAL,
    MATERIAL_TYPE_UNLIT,
    SHADING_MODEL_ID_UNLIT,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_NAME_BASE_COLOR,
    UNIFORM_NAME_BASE_MAP,
    UNIFORM_NAME_BASE_MAP_TILING,
    UNIFORM_NAME_SHADING_MODEL_ID,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_VECTOR4,
    UNIFORM_TYPE_INT,
    UNIFORM_TYPE_COLOR,

    VertexShaderModifiers,
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
    baseMapTiling?: Vector4;
    baseColor?: Color;
    vertexShaderModifiers?: VertexShaderModifiers;
    uniforms?: UniformsData;
} & MaterialArgs;

export type UnlitMaterial = Material;

export function createUnlitMaterial(args: UnlitMaterialArgs = {}): UnlitMaterial {
    const {
        baseMap,
        baseMapTiling, // vec4
        baseColor,
        // TODO: 外部化
        vertexShaderModifiers = [],
        uniforms = [],
        uniformBlockNames = [],
        ...options
    } = args;

    const baseUniforms: UniformsData = [
        {
            name: UNIFORM_NAME_BASE_MAP,
            type: UNIFORM_TYPE_TEXTURE,
            value: baseMap || null,
        },
        {
            name: UNIFORM_NAME_BASE_MAP_TILING,
            type: UNIFORM_TYPE_VECTOR4,
            value: baseMapTiling || createVector4(1, 1, 0, 0),
        },
        {
            name: UNIFORM_NAME_BASE_COLOR,
            type: UNIFORM_TYPE_COLOR,
            value: baseColor || createColorWhite(),
        },
        {
            name: UNIFORM_NAME_SHADING_MODEL_ID,
            type: UNIFORM_TYPE_INT,
            value: SHADING_MODEL_ID_UNLIT,
        },
    ];

    const mergedUniforms: UniformsData = [...baseUniforms, ...uniforms];

    const depthUniforms: UniformsData = [
        {
            name: UNIFORM_NAME_BASE_MAP,
            type: UNIFORM_TYPE_TEXTURE,
            value: baseMap || null,
        },
        {
            name: UNIFORM_NAME_BASE_MAP_TILING,
            type: UNIFORM_TYPE_VECTOR4,
            value: baseMapTiling || createVector4(1, 1, 0, 0),
        },
        {
            name: UNIFORM_NAME_BASE_COLOR,
            type: UNIFORM_TYPE_COLOR,
            value: baseColor || createColorWhite(),
        },
        ...uniforms,
    ];

    const material = createMaterial({
        name: 'UnlitMaterial',
        type: MATERIAL_TYPE_UNLIT,
        vertexShaderModifiers,
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
