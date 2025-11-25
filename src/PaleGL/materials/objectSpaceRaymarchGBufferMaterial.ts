import {
    DEPTH_FUNC_TYPE_LEQUAL,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_GBUFFER_BUILDER_RAYMARCH,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE,
    MATERIAL_TYPE_OBJECT_SPACE_RAYMARCH,
    SHADING_MODEL_ID_LIT,
    ShadingModelIds,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_NAME_BASE_COLOR,
    UNIFORM_NAME_BASE_MAP,
    UNIFORM_NAME_DEPTH_TEXTURE,
    UNIFORM_NAME_EMISSIVE_COLOR,
    UNIFORM_NAME_HEIGHT_MAP,
    UNIFORM_NAME_HEIGHT_SCALE,
    UNIFORM_NAME_MAP_TILING,
    UNIFORM_NAME_METALLIC,
    UNIFORM_NAME_METALLIC_MAP,
    UNIFORM_NAME_NORMAL_MAP,
    UNIFORM_NAME_OBJECT_SPACE_RAYMARCH_BOUNDS_SCALE,
    UNIFORM_NAME_ROUGHNESS,
    UNIFORM_NAME_ROUGHNESS_MAP,
    UNIFORM_NAME_SHADING_MODEL_ID,
    UNIFORM_TYPE_COLOR,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_INT,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_VECTOR3,
    UNIFORM_TYPE_VECTOR4,
} from '@/PaleGL/constants';
import { Texture } from '@/PaleGL/core/texture.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createMaterial, Material, MaterialArgs } from '@/PaleGL/materials/material.ts';
import { createObjectSpaceRaymarchUniforms } from '@/PaleGL/materials/objectSpaceRaymarchMaterial.ts';
import { Color, createColorBlack, createColorWhite } from '@/PaleGL/math/color.ts';
import { createVector3One } from '@/PaleGL/math/vector3.ts';
import { createVector4, Vector4 } from '@/PaleGL/math/vector4.ts';
import raymarchVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import litObjectSpaceRaymarchFragmentLayout from '@/PaleGL/shaders/layout/layout-lit-object-space-raymarch-fragment.glsl';
import objectSpaceRaymarchDepthFragmentLayout from '@/PaleGL/shaders/layout/layout-object-space-raymarch-depth-fragment.glsl';

type ObjectSpaceRaymarchGBufferArgs = {
    fragmentShaderTemplate?: string;
    fragmentShaderContent: string;
    depthFragmentShaderTemplate?: string;
    depthFragmentShaderContent: string;
    deleteGBufferBuilderPragma?: boolean;
} & {
    shadingModelId?: ShadingModelIds;
    fragmentShader?: string;
    depthFragmentShader?: string;
    baseColor?: Color;
    baseMap?: Texture;
    mapTiling?: Vector4;
    metallic?: number;
    metallicMap?: Texture;
    roughness?: number;
    roughnessMap?: Texture;
    emissiveColor?: Color;
    normalMap?: Texture;
    normalMapTiling?: Vector4;
    heightMap?: Texture;
    heightScale?: number;
} & MaterialArgs;

export type ObjectSpaceRaymarchGBufferMaterial = Material;

export const createObjectSpaceRaymarchGBufferMaterial = (
    args: ObjectSpaceRaymarchGBufferArgs
): ObjectSpaceRaymarchGBufferMaterial => {
    const {
        fragmentShaderTemplate,
        fragmentShaderContent,
        depthFragmentShaderTemplate,
        depthFragmentShaderContent,
        // shadingModelId = SHADING_MODEL_ID_LIT,
        uniforms = [],
        uniformBlockNames,
        deleteFragmentShaderPragmas = [],
    } = args;

    const baseColor: Color = args.baseColor || createColorWhite();
    const baseMap: Texture | undefined = args.baseMap;
    const mapTiling: Vector4 = args.mapTiling || createVector4(1, 1, 0, 0);
    const metallic: number = args.metallic || 0;
    const metallicMap: Texture | undefined = args.metallicMap;
    const roughness: number = args.roughness !== undefined ? args.roughness : 0;
    const roughnessMap: Texture | undefined = args.roughnessMap;
    const normalMap: Texture | undefined = args.normalMap;
    const heightMap: Texture | undefined = args.heightMap;
    const heightScale: number = args.heightScale || 1.0;
    const emissiveColor: Color = args.emissiveColor || createColorBlack();
    const shadingModelId: ShadingModelIds = args.shadingModelId || SHADING_MODEL_ID_LIT;

    const commonUniforms: UniformsData = [
        [UNIFORM_NAME_OBJECT_SPACE_RAYMARCH_BOUNDS_SCALE, UNIFORM_TYPE_VECTOR3, createVector3One()],
        [UNIFORM_NAME_DEPTH_TEXTURE, UNIFORM_TYPE_TEXTURE],

        // gbuffer共通
        [UNIFORM_NAME_BASE_MAP, UNIFORM_TYPE_TEXTURE, baseMap],
        [UNIFORM_NAME_MAP_TILING, UNIFORM_TYPE_VECTOR4, mapTiling],
        [UNIFORM_NAME_HEIGHT_MAP, UNIFORM_TYPE_TEXTURE, heightMap],
        [UNIFORM_NAME_HEIGHT_SCALE, UNIFORM_TYPE_FLOAT, heightScale],

        ...createObjectSpaceRaymarchUniforms(),
    ] as UniformsData;

    const gbufferUniforms: UniformsData = [
        // gbuffer共通
        [UNIFORM_NAME_BASE_COLOR, UNIFORM_TYPE_COLOR, baseColor || createColorWhite()],
        [UNIFORM_NAME_METALLIC, UNIFORM_TYPE_FLOAT, metallic],
        [UNIFORM_NAME_METALLIC_MAP, UNIFORM_TYPE_TEXTURE, metallicMap],
        [UNIFORM_NAME_ROUGHNESS, UNIFORM_TYPE_FLOAT, roughness],
        [UNIFORM_NAME_ROUGHNESS_MAP, UNIFORM_TYPE_TEXTURE, roughnessMap],
        [UNIFORM_NAME_METALLIC_MAP, UNIFORM_TYPE_TEXTURE, metallicMap],
        [UNIFORM_NAME_NORMAL_MAP, UNIFORM_TYPE_TEXTURE, normalMap],
        [UNIFORM_NAME_EMISSIVE_COLOR, UNIFORM_TYPE_COLOR, emissiveColor],
        [UNIFORM_NAME_SHADING_MODEL_ID, UNIFORM_TYPE_INT, shadingModelId],
    ];

    const shadingUniforms: UniformsData = [
        [UNIFORM_NAME_SHADING_MODEL_ID, UNIFORM_TYPE_INT, shadingModelId],
        // float,intどちらでもいい
    ];

    const mergedUniforms: UniformsData = [
        ...commonUniforms,
        ...gbufferUniforms,
        ...shadingUniforms,
        ...(uniforms ? uniforms : []),
    ];

    // templateが片方しか指定されていない場合はおそらく想定していない
    if (
        (fragmentShaderTemplate && !depthFragmentShaderTemplate) ||
        (!fragmentShaderTemplate && depthFragmentShaderTemplate)
    ) {
        console.warn(`difference template!`);
    }

    // gbuffer builder を消すオプションを適用してるなら消しちゃう
    if (args.deleteGBufferBuilderPragma) {
        deleteFragmentShaderPragmas.push(FRAGMENT_SHADER_MODIFIER_PRAGMA_GBUFFER_BUILDER_RAYMARCH);
    }
    
    console.log("hogehoge", args)

    // TODO: できるだけconstructorの直後に持っていきたい
    return createMaterial({
        ...args,
        // ...options,
        // CUSTOM_BEGIN comment out
        // name: 'ObjectSpaceRaymarchGBufferMaterial',
        // CUSTOM_END
        type: MATERIAL_TYPE_OBJECT_SPACE_RAYMARCH,

        // faceSide: FaceSide.Double,

        vertexShader: raymarchVert,
        fragmentShader: fragmentShaderTemplate || litObjectSpaceRaymarchFragmentLayout,
        depthFragmentShader: depthFragmentShaderTemplate || objectSpaceRaymarchDepthFragmentLayout,

        deleteFragmentShaderPragmas,

        // NOTE: GBufferMaterialの設定
        // useNormalMap: !!normalMap,
        // depthTest: true,
        // depthWrite: false,
        // depthFuncType: DEPTH_FUNC_TYPE_EQUAL,

        // default
        depthFuncType: args.depthFuncType ?? DEPTH_FUNC_TYPE_LEQUAL,
        skipDepthPrePass: true,

        // depthTest: false,
        // depthWrite: false,
        // depthFuncType: DEPTH_FUNC_TYPE_EQUAL,
        // // depthFuncType: DEPTH_FUNC_TYPE_ALWAYS,

        uniforms: mergedUniforms,
        depthUniforms: mergedUniforms, // TODO: common, uniforms の2つで十分なはず。alpha test をしない限り
        uniformBlockNames: [
            UNIFORM_BLOCK_NAME_COMMON,
            UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
            UNIFORM_BLOCK_NAME_CAMERA,
            ...(uniformBlockNames ? uniformBlockNames : []),
        ],

        fragmentShaderModifiers: [
            [FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE, fragmentShaderContent],
            ...(args.fragmentShaderModifiers ?? []),
        ],
        depthFragmentShaderModifiers: [
            [FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE, depthFragmentShaderContent],
            ...(args.depthFragmentShaderModifiers ?? []),
        ],
    });
};
