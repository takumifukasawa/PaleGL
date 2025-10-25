import { MaterialArgs, createMaterial, Material } from '@/PaleGL/materials/material.ts';
import {
    DEPTH_FUNC_TYPE_LEQUAL,
    FACE_SIDE_DOUBLE,
    FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE,
    MATERIAL_TYPE_OBJECT_SPACE_RAYMARCH,
    PRIMITIVE_TYPE_TRIANGLES,
    RENDER_QUEUE_TYPE_OPAQUE,
    SHADING_MODEL_ID_LIT,
    ShadingModelIds,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_NAME_BASE_COLOR,
    UNIFORM_NAME_BASE_MAP,
    UNIFORM_NAME_BASE_MAP_TILING,
    UNIFORM_NAME_DEPTH_TEXTURE,
    UNIFORM_NAME_EMISSIVE_COLOR,
    UNIFORM_NAME_METALLIC,
    UNIFORM_NAME_METALLIC_MAP,
    UNIFORM_NAME_METALLIC_MAP_TILING,
    UNIFORM_NAME_OBJECT_SPACE_RAYMARCH_BOUNDS_SCALE,
    UNIFORM_NAME_ROUGHNESS,
    UNIFORM_NAME_ROUGHNESS_MAP,
    UNIFORM_NAME_ROUGHNESS_MAP_TILING,
    UNIFORM_NAME_SHADING_MODEL_ID,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_VECTOR3,
    UNIFORM_TYPE_VECTOR4,
    UNIFORM_TYPE_INT,
    UNIFORM_TYPE_COLOR,

} from '@/PaleGL/constants';
import raymarchVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createVector3One } from '@/PaleGL/math/vector3.ts';
import { Color, createColorBlack, createColorWhite } from '@/PaleGL/math/color.ts';
import litObjectSpaceRaymarchFragmentLayout from '@/PaleGL/shaders/layout/layout-lit-object-space-raymarch-fragment.glsl';
import objectSpaceRaymarchDepthFragmentLayout from '@/PaleGL/shaders/layout/layout-object-space-raymarch-depth-fragment.glsl';
import { Texture } from '@/PaleGL/core/texture.ts';
import { createVector4, Vector4 } from '@/PaleGL/math/vector4.ts';

if (import.meta.hot) {
   import.meta.hot.accept(['@/PaleGL/shaders/layout/layout-lit-object-space-raymarch-fragment.glsl'], mods => {
       console.log(mods);
       });
}

export function createObjectSpaceRaymarchUniforms() {
    return [
        ['uIsPerspective', UNIFORM_TYPE_FLOAT, 0],
        ['uUseWorld', UNIFORM_TYPE_FLOAT, 0],
    ];
}

// TODO: uniformsは一旦まっさらにしている。metallic,smoothnessの各種パラメーター、必要になりそうだったら適宜追加する
export type ObjectSpaceRaymarchMaterialArgs = {
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
    // rawFragmentShader?: string;
} & MaterialArgs;

export type ObjectSpaceRaymarchMaterial = Material;

export function createObjectSpaceRaymarchMaterial({
    fragmentShaderTemplate,
    fragmentShaderContent,
    depthFragmentShaderTemplate,
    depthFragmentShaderContent,
    materialArgs,
}: {
    fragmentShaderTemplate?: string;
    fragmentShaderContent: string;
    depthFragmentShaderTemplate?: string;
    depthFragmentShaderContent: string;
    materialArgs: ObjectSpaceRaymarchMaterialArgs;
}) {
    const { shadingModelId = SHADING_MODEL_ID_LIT, uniforms = [], uniformBlockNames } = materialArgs;

    const baseMap = materialArgs.baseMap ?? null;
    const baseColor = materialArgs.baseColor ?? createColorWhite();
    const baseMapTiling = materialArgs.baseMapTiling ?? createVector4(1, 1, 0, 0);
    const roughnessMap = materialArgs.roughnessMap ?? null;
    const roughnessMapTiling = materialArgs.roughnessMapTiling ?? createVector4(1, 1, 0, 0);
    const roughness = materialArgs.roughness ?? 0;
    const metallic = materialArgs.metallic ?? 0;
    const metallicMap = materialArgs.metallicMap ?? null;
    const metallicMapTiling = materialArgs.metallicMapTiling ?? createVector4(1, 1, 0, 0);
    const emissiveColor = materialArgs.emissiveColor ?? createColorBlack();

    const commonUniforms: UniformsData = [
        [UNIFORM_NAME_OBJECT_SPACE_RAYMARCH_BOUNDS_SCALE, UNIFORM_TYPE_VECTOR3, createVector3One()],
        [UNIFORM_NAME_DEPTH_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
        [UNIFORM_NAME_BASE_MAP, UNIFORM_TYPE_TEXTURE, baseMap],
        [UNIFORM_NAME_BASE_COLOR, UNIFORM_TYPE_COLOR, baseColor],
        [UNIFORM_NAME_BASE_MAP_TILING, UNIFORM_TYPE_VECTOR4, baseMapTiling],
        // value: Vector2.one,
        [UNIFORM_NAME_METALLIC, UNIFORM_TYPE_FLOAT, metallic],
        [UNIFORM_NAME_METALLIC_MAP, UNIFORM_TYPE_TEXTURE, metallicMap],
        [UNIFORM_NAME_METALLIC_MAP_TILING, UNIFORM_TYPE_VECTOR4, metallicMapTiling],

        [UNIFORM_NAME_ROUGHNESS, UNIFORM_TYPE_FLOAT, roughness],
        [UNIFORM_NAME_ROUGHNESS_MAP, UNIFORM_TYPE_TEXTURE, roughnessMap],
        [UNIFORM_NAME_ROUGHNESS_MAP_TILING, UNIFORM_TYPE_VECTOR4, roughnessMapTiling],

        [UNIFORM_NAME_EMISSIVE_COLOR, UNIFORM_TYPE_COLOR, emissiveColor],
        ...createObjectSpaceRaymarchUniforms(),
    ] as UniformsData;

    const shadingUniforms: UniformsData = [
        [UNIFORM_NAME_SHADING_MODEL_ID, UNIFORM_TYPE_INT, shadingModelId],
        // float,intどちらでもいい
    ];

    const mergedUniforms: UniformsData = [...commonUniforms, ...shadingUniforms, ...(uniforms ? uniforms : [])];

    // TODO: できるだけconstructorの直後に持っていきたい
    return createMaterial({
        ...materialArgs, // TODO: 上書きするためにできるだけ後ろに持っていきたい
        // ...options,
        name: 'ObjectSpaceRaymarchMaterial',
        type: MATERIAL_TYPE_OBJECT_SPACE_RAYMARCH,

        vertexShader: raymarchVert,
        fragmentShader: fragmentShaderTemplate || litObjectSpaceRaymarchFragmentLayout,
        depthFragmentShader: depthFragmentShaderTemplate || objectSpaceRaymarchDepthFragmentLayout,
        primitiveType: PRIMITIVE_TYPE_TRIANGLES,
        faceSide: FACE_SIDE_DOUBLE,

        // rawFragmentShader,
        uniforms: mergedUniforms,
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
        renderQueueType: RENDER_QUEUE_TYPE_OPAQUE,
        // renderQueueType: RenderQueueType.Transparent,
        // blendType: BlendTypes.Transparent,

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
            ...(materialArgs.fragmentShaderModifiers ?? []),
        ],
        depthFragmentShaderModifiers: [
            {
                pragma: FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE,
                value: depthFragmentShaderContent,
            },
            ...(materialArgs.depthFragmentShaderModifiers ?? []),
        ],
    });
}
