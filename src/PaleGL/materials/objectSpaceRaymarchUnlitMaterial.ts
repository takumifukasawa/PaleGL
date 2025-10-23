import { MaterialArgs, createMaterial, Material } from '@/PaleGL/materials/material.ts';
import {
    FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE,
    MATERIAL_TYPE_OBJECT_SPACE_RAYMARCH,
    ShadingModelIds,
    SHADING_MODEL_ID_UNLIT,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_BLOCK_NAME_CAMERA,
    UniformNames,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_VECTOR3,
    UNIFORM_TYPE_VECTOR4,
    UNIFORM_TYPE_INT,
    UNIFORM_TYPE_COLOR,

} from '@/PaleGL/constants';
import raymarchVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createVector3One } from '@/PaleGL/math/vector3.ts';
import { Color, createColorBlack, createColorWhite } from '@/PaleGL/math/color.ts';
import unlitObjectSpaceRaymarchFragmentLayout from '@/PaleGL/shaders/layout/layout-unlit-object-space-raymarch-fragment.glsl';
import objectSpaceRaymarchDepthFragmentLayout from '@/PaleGL/shaders/layout/layout-object-space-raymarch-depth-fragment.glsl';
import { Texture } from '@/PaleGL/core/texture.ts';
import { createVector4, Vector4 } from '@/PaleGL/math/vector4.ts';
import {createObjectSpaceRaymarchUniforms} from "@/PaleGL/materials/objectSpaceRaymarchMaterial.ts";

type ObjectSpaceRaymarchUnlitArgs = {
    fragmentShaderTemplate?: string;
    fragmentShaderContent: string;
    depthFragmentShaderTemplate?: string;
    depthFragmentShaderContent: string;
} & {
    shadingModelId?: ShadingModelIds;
    baseColor?: Color;
    baseMap?: Texture;
    baseMapTiling?: Vector4;
    emissiveColor?: Color;
    fragmentShader?: string;
    depthFragmentShader?: string;
    // rawFragmentShader?: string;
} & MaterialArgs;

export type ObjectSpaceRaymarchUnlitMaterial = Material;

export function createObjectSpaceRaymarchUnlitMaterial(
    args: ObjectSpaceRaymarchUnlitArgs
): ObjectSpaceRaymarchUnlitMaterial {
    const {
        fragmentShaderTemplate,
        fragmentShaderContent,
        depthFragmentShaderTemplate,
        depthFragmentShaderContent,
        shadingModelId = SHADING_MODEL_ID_UNLIT,
        uniforms = [],
        uniformBlockNames,
    } = args;

    const baseMap = args.baseMap ?? null;
    const baseColor = args.baseColor ?? createColorWhite();
    const baseMapTiling = args.baseMapTiling ?? createVector4(1, 1, 0, 0);
    const emissiveColor = args.emissiveColor ?? createColorBlack();

    const commonUniforms: UniformsData = [
        {
            name: UniformNames.ObjectSpaceRaymarchBoundsScale,
            type: UNIFORM_TYPE_VECTOR3,
            value: createVector3One(),
        },
        {
            name: UniformNames.DepthTexture,
            type: UNIFORM_TYPE_TEXTURE,
            value: null,
        },
        {
            name: UniformNames.BaseMap,
            type: UNIFORM_TYPE_TEXTURE,
            value: baseMap,
        },
        {
            name: UniformNames.BaseColor,
            type: UNIFORM_TYPE_COLOR,
            value: baseColor,
        },
        {
            name: UniformNames.BaseMapTiling,
            type: UNIFORM_TYPE_VECTOR4,
            // value: Vector2.one,
            value: baseMapTiling,
        },
        {
            name: UniformNames.EmissiveColor,
            type: UNIFORM_TYPE_COLOR,
            value: emissiveColor,
        },
        ...createObjectSpaceRaymarchUniforms()
    ] as UniformsData;
    const shadingUniforms: UniformsData = [
        {
            name: UniformNames.ShadingModelId,
            type: UNIFORM_TYPE_INT, // float,intどちらでもいい
            value: shadingModelId,
        },
    ];

    const mergedUniforms: UniformsData = [...commonUniforms, ...shadingUniforms, ...(uniforms ? uniforms : [])];

    // TODO: できるだけconstructorの直後に持っていきたい
    return createMaterial({
        ...args,
        // ...options,
        name: 'ObjectSpaceRaymarchUnlitMaterial',
        type: MATERIAL_TYPE_OBJECT_SPACE_RAYMARCH,

        vertexShader: raymarchVert,
        fragmentShader: fragmentShaderTemplate || unlitObjectSpaceRaymarchFragmentLayout,
        depthFragmentShader: depthFragmentShaderTemplate || objectSpaceRaymarchDepthFragmentLayout,
        uniforms: mergedUniforms,
        depthUniforms: mergedUniforms, // TODO: common, uniforms の2つで十分なはず。alpha test をしない限り
        depthTest: args.depthTest ?? true,
        depthWrite: args.depthWrite ?? false,

        uniformBlockNames: [
            UNIFORM_BLOCK_NAME_COMMON,
            UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
            UNIFORM_BLOCK_NAME_CAMERA,
            ...(uniformBlockNames ? uniformBlockNames : []),
        ],

        fragmentShaderModifiers: [
            {
                pragma: FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE,
                value: fragmentShaderContent,
            },
            ...(args.fragmentShaderModifiers ?? [])
        ],
        depthFragmentShaderModifiers: [
            {
                pragma: FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE,
                value: depthFragmentShaderContent,
            },
            ...(args.depthFragmentShaderModifiers ?? [])
        ],
    });
}
