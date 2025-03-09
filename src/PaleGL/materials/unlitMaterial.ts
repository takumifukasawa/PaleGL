import {MaterialArgs, createMaterial, Material} from '@/PaleGL/materials/material.ts';
import {
    ShadingModelIds,
    DepthFuncTypes,
    UniformNames,
    UniformTypes,
    VertexShaderModifier,
    UniformBlockNames,
} from '@/PaleGL/constants';
import { Vector2 } from '@/PaleGL/math/Vector2';
import { Color } from '@/PaleGL/math/Color';
import { Texture } from '@/PaleGL/core/texture.ts';

import gBufferVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import unlitFrag from '@/PaleGL/shaders/unlit-fragment.glsl';
import gBufferDepthFrag from '@/PaleGL/shaders/gbuffer-depth-fragment.glsl';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';

export type UnlitMaterialArgs = {
    diffuseColor?: Color;
    diffuseMap?: Texture;
    diffuseMapUvScale?: Vector2;
    diffuseMapUvOffset?: Vector2;
    emissiveColor?: Color;
    vertexShaderModifier?: VertexShaderModifier;
    uniforms?: UniformsData;
} & MaterialArgs;

export type UnlitMaterial = Material;

export function createUnlitMaterial({
    diffuseColor,
    diffuseMap,
    diffuseMapUvScale, // vec2
    diffuseMapUvOffset, // vec2
    emissiveColor,
    // TODO: 外部化
    vertexShaderModifier = {},
    uniforms = [],
    ...options
}: UnlitMaterialArgs = {}) {
    const baseUniforms: UniformsData = [
        {
            name: 'uDiffuseColor',
            type: UniformTypes.Color,
            value: diffuseColor || Color.black,
        },
        {
            name: 'uDiffuseMap',
            type: UniformTypes.Texture,
            value: diffuseMap || null,
        },
        {
            name: 'uDiffuseMapUvScale',
            type: UniformTypes.Vector2,
            value: diffuseMapUvScale || Vector2.one,
        },
        {
            name: 'uDiffuseMapUvOffset',
            type: UniformTypes.Vector2,
            value: diffuseMapUvOffset || Vector2.one,
        },
        {
            name: 'uEmissiveColor',
            type: UniformTypes.Color,
            value: emissiveColor || Color.black,
        },
        {
            name: UniformNames.ShadingModelId,
            type: UniformTypes.Int,
            value: ShadingModelIds.Unlit,
        },
    ];

    const mergedUniforms: UniformsData = [...baseUniforms, ...(uniforms ? uniforms : [])];

    const depthUniforms: UniformsData = [
        {
            name: 'uDiffuseMap',
            type: UniformTypes.Texture,
            value: diffuseMap || null,
        },
        {
            name: 'uDiffuseMapUvScale',
            type: UniformTypes.Vector2,
            value: Vector2.one,
        },
        {
            name: 'uDiffuseMapUvOffset',
            type: UniformTypes.Vector2,
            value: Vector2.one,
        },
    ];

    const material = createMaterial({
        ...options,
        name: 'UnlitMaterial',
        vertexShaderModifier,
        vertexShader: gBufferVert,
        fragmentShader: unlitFrag,
        depthFragmentShader: gBufferDepthFrag,
        uniforms: mergedUniforms,
        depthUniforms,
        useNormalMap: false,
        depthTest: true,
        depthWrite: false, // TODO: これはGBufferの場合. unlitはtransparentの場合も対処すべき
        depthFuncType: DepthFuncTypes.Equal, // TODO: これはGBufferの場合
        uniformBlockNames: [UniformBlockNames.Transformations, UniformBlockNames.Camera],
    });
    
    return {
        ...material,
    };
}
