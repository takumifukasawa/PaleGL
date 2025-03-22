import { MaterialArgs, createMaterial, Material } from '@/PaleGL/materials/material.ts';
import {
    BlendTypes,
    DepthFuncTypes,
    FaceSide,
    FragmentShaderModifierPragmas,
    MaterialTypes,
    PrimitiveTypes,
    RenderQueueType,
    ShadingModelIds,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
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
        shadingModelId = ShadingModelIds.Unlit,
        uniforms = [],
        uniformBlockNames,
    } = args;

    const baseMap = args.baseMap ?? null;
    const baseColor = args.baseColor ?? createColorWhite();
    const baseMapTiling = args.baseMapTiling ?? createVector4(1, 1, 0, 0);
    const emissiveColor = args.emissiveColor ?? createColorBlack();
    const renderQueueType = args.renderQueueType ?? RenderQueueType.Opaque;
    const blendType = args.blendType ?? BlendTypes.Opaque;

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

    console.log("hogehoge", args)
    
    // TODO: できるだけconstructorの直後に持っていきたい
    return createMaterial({
        ...args,
        // ...options,
        name: 'ObjectSpaceRaymarchUnlitMaterial',
        type: MaterialTypes.ObjectSpaceRaymarch,

        vertexShader: raymarchVert,
        fragmentShader: fragmentShaderTemplate || unlitObjectSpaceRaymarchFragmentLayout,
        depthFragmentShader: depthFragmentShaderTemplate || objectSpaceRaymarchDepthFragmentLayout,
        primitiveType: PrimitiveTypes.Triangles,
        faceSide: FaceSide.Double,
        uniforms: mergedUniforms,
        depthUniforms: mergedUniforms, // TODO: common, uniforms の2つで十分なはず。alpha test をしない限り
        depthTest: args.depthTest ?? true,
        depthWrite: args.depthWrite ?? false,
        depthFuncType: args.depthFuncType ?? DepthFuncTypes.Lequal, 
        renderQueueType,
        blendType,

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
