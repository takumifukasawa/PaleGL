import { MaterialArgs, createMaterial, Material } from '@/PaleGL/materials/material.ts';
import {
    DepthFuncTypes,
    FragmentShaderModifierPragmas,
    MaterialTypes,
    ShadingModelIds,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants';
import raymarchVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createVector3One } from '@/PaleGL/math/vector3.ts';
import { Color, createColorBlack, createColorWhite } from '@/PaleGL/math/color.ts';
import litObjectSpaceRaymarchFragmentLayout from '@/PaleGL/shaders/layout/layout-lit-object-space-raymarch-fragment.glsl';
import objectSpaceRaymarchDepthFragmentLayout from '@/PaleGL/shaders/layout/layout-object-space-raymarch-depth-fragment.glsl';
import { Texture } from '@/PaleGL/core/texture.ts';
import { createVector4, Vector4 } from '@/PaleGL/math/vector4.ts';
import {createObjectSpaceRaymarchUniforms} from "@/PaleGL/materials/objectSpaceRaymarchMaterial.ts";

type ObjectSpaceRaymarchGBufferArgs = {
    fragmentShaderTemplate?: string;
    fragmentShaderContent: string;
    depthFragmentShaderTemplate?: string;
    depthFragmentShaderContent: string;
} & {
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

export type ObjectSpaceRaymarchGBufferMaterial = Material;

export function createObjectSpaceRaymarchGBufferMaterial(
    args: ObjectSpaceRaymarchGBufferArgs
): ObjectSpaceRaymarchGBufferMaterial {
    const {
        fragmentShaderTemplate,
        fragmentShaderContent,
        depthFragmentShaderTemplate,
        depthFragmentShaderContent,
        shadingModelId = ShadingModelIds.Lit,
        uniforms = [],
        uniformBlockNames,
    } = args;

    const baseMap = args.baseMap ?? null;
    const baseColor = args.baseColor ?? createColorWhite();
    const baseMapTiling = args.baseMapTiling ?? createVector4(1, 1, 0, 0);
    const roughnessMap = args.roughnessMap ?? null;
    const roughnessMapTiling = args.roughnessMapTiling ?? createVector4(1, 1, 0, 0);
    const roughness = args.roughness ?? 0;
    const metallic = args.metallic ?? 0;
    const metallicMap = args.metallicMap ?? null;
    const metallicMapTiling = args.metallicMapTiling ?? createVector4(1, 1, 0, 0);
    const emissiveColor = args.emissiveColor ?? createColorBlack();

    const commonUniforms: UniformsData = [
        {
            name: UniformNames.ObjectSpaceRaymarchBoundsScale,
            type: UniformTypes.Vector3,
            value: createVector3One(),
        },
        {
            name: UniformNames.DepthTexture,
            type: UniformTypes.Texture,
            value: null,
        },
        {
            name: UniformNames.BaseMap,
            type: UniformTypes.Texture,
            value: baseMap,
        },
        {
            name: UniformNames.BaseColor,
            type: UniformTypes.Color,
            value: baseColor,
        },
        {
            name: UniformNames.BaseMapTiling,
            type: UniformTypes.Vector4,
            // value: Vector2.one,
            value: baseMapTiling,
        },
        {
            name: UniformNames.Metallic,
            type: UniformTypes.Float,
            value: metallic,
        },
        {
            name: UniformNames.MetallicMap,
            type: UniformTypes.Texture,
            value: metallicMap,
        },
        {
            name: UniformNames.MetallicMapTiling,
            type: UniformTypes.Vector4,
            value: metallicMapTiling,
        },

        {
            name: UniformNames.Roughness,
            type: UniformTypes.Float,
            value: roughness,
        },
        {
            name: UniformNames.RoughnessMap,
            type: UniformTypes.Texture,
            value: roughnessMap,
        },
        {
            name: UniformNames.RoughnessMapTiling,
            type: UniformTypes.Vector4,
            value: roughnessMapTiling,
        },

        {
            name: UniformNames.EmissiveColor,
            type: UniformTypes.Color,
            value: emissiveColor,
        },
        ...createObjectSpaceRaymarchUniforms()
    ];
    const shadingUniforms: UniformsData = [
        {
            name: UniformNames.ShadingModelId,
            type: UniformTypes.Int, // float,intどちらでもいい
            value: shadingModelId,
        },
    ];

    const mergedUniforms: UniformsData = [...commonUniforms, ...shadingUniforms, ...(uniforms ? uniforms : [])];

    // TODO: できるだけconstructorの直後に持っていきたい
    return createMaterial({
        ...args,
        // ...options,
        name: 'ObjectSpaceRaymarchGBufferMaterial',
        type: MaterialTypes.ObjectSpaceRaymarch,

        vertexShader: raymarchVert,
        fragmentShader: fragmentShaderTemplate || litObjectSpaceRaymarchFragmentLayout,
        depthFragmentShader: depthFragmentShaderTemplate || objectSpaceRaymarchDepthFragmentLayout,
        
        // NOTE: GBufferMaterialの設定
        // useNormalMap: !!normalMap,
        // depthTest: true,
        // depthWrite: false,
        // depthFuncType: DepthFuncTypes.Equal,

        depthFuncType: args.depthFuncType ?? DepthFuncTypes.Lequal,
        skipDepthPrePass: true,

        uniforms: mergedUniforms,
        depthUniforms: mergedUniforms, // TODO: common, uniforms の2つで十分なはず。alpha test をしない限り
        uniformBlockNames: [
            UniformBlockNames.Common,
            UniformBlockNames.Transformations,
            UniformBlockNames.Camera,
            ...(uniformBlockNames ? uniformBlockNames : []),
        ],

        fragmentShaderModifiers: [
            {
                pragma: FragmentShaderModifierPragmas.RAYMARCH_SCENE,
                value: fragmentShaderContent,
            },
            ...(args.fragmentShaderModifiers ?? [])
        ],
        depthFragmentShaderModifiers: [
            {
                pragma: FragmentShaderModifierPragmas.RAYMARCH_SCENE,
                value: depthFragmentShaderContent,
            },
            ...(args.depthFragmentShaderModifiers ?? [])
        ],
    });
}
