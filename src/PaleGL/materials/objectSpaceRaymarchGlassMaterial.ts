import { MaterialArgs, createMaterial, Material } from '@/PaleGL/materials/material.ts';
import {
    DEPTH_FUNC_TYPE_LEQUAL,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE,
    MATERIAL_TYPE_OBJECT_SPACE_RAYMARCH,
    SHADING_MODEL_ID_UNLIT,
    ShadingModelIds,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_NAME_BASE_COLOR,
    UNIFORM_NAME_BASE_MAP,
    UNIFORM_NAME_BASE_MAP_TILING,
    UNIFORM_NAME_DEPTH_TEXTURE,
    UNIFORM_NAME_EMISSIVE_COLOR,
    UNIFORM_NAME_OBJECT_SPACE_RAYMARCH_BOUNDS_SCALE,
    UNIFORM_NAME_SHADING_MODEL_ID,
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
import glassObjectSpaceRaymarchFragmentLayout from '@/PaleGL/shaders/layout/layout-glass-object-space-raymarch-fragment.glsl';
import objectSpaceRaymarchDepthFragmentLayout from '@/PaleGL/shaders/layout/layout-object-space-raymarch-depth-fragment.glsl';
import { Texture } from '@/PaleGL/core/texture.ts';
import { createVector4, Vector4 } from '@/PaleGL/math/vector4.ts';
import { createObjectSpaceRaymarchUniforms } from '@/PaleGL/materials/objectSpaceRaymarchMaterial.ts';
import { createSkyboxUniforms } from '@/PaleGL/postprocess/deferredShadingPass.ts';

type ObjectSpaceRaymarchGlassArgs = {
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

export type ObjectSpaceRaymarchGlassMaterial = Material;

export function createObjectSpaceRaymarchGlassMaterial(
    args: ObjectSpaceRaymarchGlassArgs
): ObjectSpaceRaymarchGlassMaterial {
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
        [UNIFORM_NAME_OBJECT_SPACE_RAYMARCH_BOUNDS_SCALE, UNIFORM_TYPE_VECTOR3, createVector3One()],
        [UNIFORM_NAME_DEPTH_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
        [UNIFORM_NAME_BASE_MAP, UNIFORM_TYPE_TEXTURE, baseMap],
        [UNIFORM_NAME_BASE_COLOR, UNIFORM_TYPE_COLOR, baseColor],
        [UNIFORM_NAME_BASE_MAP_TILING, UNIFORM_TYPE_VECTOR4, baseMapTiling],
        // value: Vector2.one,
        [UNIFORM_NAME_EMISSIVE_COLOR, UNIFORM_TYPE_COLOR, emissiveColor],
        ...createObjectSpaceRaymarchUniforms(),
        ...createSkyboxUniforms(),
    ] as UniformsData;
    const shadingUniforms: UniformsData = [
        [UNIFORM_NAME_SHADING_MODEL_ID, UNIFORM_TYPE_INT, shadingModelId],
        // float,intどちらでもいい
    ];

    const mergedUniforms: UniformsData = [...commonUniforms, ...shadingUniforms, ...(uniforms ? uniforms : [])];

    // TODO: できるだけconstructorの直後に持っていきたい
    return createMaterial({
        ...args,
        // ...options,
        name: 'ObjectSpaceRaymarchGlassMaterial',
        type: MATERIAL_TYPE_OBJECT_SPACE_RAYMARCH,

        vertexShader: raymarchVert,
        fragmentShader: fragmentShaderTemplate || glassObjectSpaceRaymarchFragmentLayout,
        depthFragmentShader: depthFragmentShaderTemplate || objectSpaceRaymarchDepthFragmentLayout,
        uniforms: mergedUniforms,
        depthUniforms: mergedUniforms, // TODO: common, uniforms の2つで十分なはず。alpha test をしない限り
        depthTest: args.depthTest ?? true,
        depthWrite: args.depthWrite ?? false,
        depthFuncType: args.depthFuncType ?? DEPTH_FUNC_TYPE_LEQUAL,

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
            ...(args.fragmentShaderModifiers ?? []),
        ],
        depthFragmentShaderModifiers: [
            {
                pragma: FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE,
                value: depthFragmentShaderContent,
            },
            ...(args.depthFragmentShaderModifiers ?? []),
        ],
    });
}
