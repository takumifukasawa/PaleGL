import { MaterialArgs, createMaterial, Material } from '@/PaleGL/materials/material.ts';
import {
    DEPTH_FUNC_TYPE_LEQUAL,
    FACE_SIDE_DOUBLE,
    FragmentShaderModifierPragmas,
    MATERIAL_TYPE_OBJECT_SPACE_RAYMARCH,
    PRIMITIVE_TYPE_TRIANGLES,
    RENDER_QUEUE_TYPE_OPAQUE,
    SHADING_MODEL_ID_LIT,
    ShadingModelIds,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_BLOCK_NAME_CAMERA,
    UniformNames,
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
        {
            name: 'uIsPerspective',
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
        {
            name: 'uUseWorld',
            type: UNIFORM_TYPE_FLOAT,
            value: 0,
        },
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
            name: UniformNames.Metallic,
            type: UNIFORM_TYPE_FLOAT,
            value: metallic,
        },
        {
            name: UniformNames.MetallicMap,
            type: UNIFORM_TYPE_TEXTURE,
            value: metallicMap,
        },
        {
            name: UniformNames.MetallicMapTiling,
            type: UNIFORM_TYPE_VECTOR4,
            value: metallicMapTiling,
        },

        {
            name: UniformNames.Roughness,
            type: UNIFORM_TYPE_FLOAT,
            value: roughness,
        },
        {
            name: UniformNames.RoughnessMap,
            type: UNIFORM_TYPE_TEXTURE,
            value: roughnessMap,
        },
        {
            name: UniformNames.RoughnessMapTiling,
            type: UNIFORM_TYPE_VECTOR4,
            value: roughnessMapTiling,
        },

        {
            name: UniformNames.EmissiveColor,
            type: UNIFORM_TYPE_COLOR,
            value: emissiveColor,
        },
        ...createObjectSpaceRaymarchUniforms(),
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
                pragma: FragmentShaderModifierPragmas.RAYMARCH_SCENE,
                value: fragmentShaderContent,
            },
            ...(materialArgs.fragmentShaderModifiers ?? []),
        ],
        depthFragmentShaderModifiers: [
            {
                pragma: FragmentShaderModifierPragmas.RAYMARCH_SCENE,
                value: depthFragmentShaderContent,
            },
            ...(materialArgs.depthFragmentShaderModifiers ?? []),
        ],
    });
}
