import { MaterialArgs, createMaterial } from '@/PaleGL/materials/material.ts';
import {
    DepthFuncTypes,
    FaceSide, FragmentShaderModifierPragmas,
    MaterialTypes,
    PrimitiveTypes, RenderQueueType,
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
import gbufferObjectSpaceRaymarchDepthFragmentLayout from '@/PaleGL/shaders/layout/layout-gbuffer-object-space-raymarch-depth-fragment.glsl';
import { Texture } from '@/PaleGL/core/texture.ts';
import { createVector4, Vector4 } from '@/PaleGL/math/vector4.ts';

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

export type ObjectSpaceRaymarchMaterial = ReturnType<typeof createObjectSpaceRaymarchMaterial>;

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
    // const pragmaKey = `#pragma ${PRAGMA_RAYMARCH_SCENE}`;

    // const fragmentShader = (fragmentShaderTemplate || litObjectSpaceRaymarchFragmentLayout).replace(
    //     pragmaKey,
    //     fragmentShaderContent
    // );
    // const depthFragmentShader = (depthFragmentShaderTemplate || gbufferObjectSpaceRaymarchDepthFragmentLayout).replace(
    //     pragmaKey,
    //     depthFragmentShaderContent
    // );

    const {
        // TODO: 外部化
        // fragmentShader,
        // depthFragmentShader,
        // rawFragmentShader,
        shadingModelId = ShadingModelIds.Lit,
        // baseColor,
        // baseMap,
        // baseMapTiling, // vec4
        // metallic,
        // metallicMap,
        // metallicMapTiling,
        // roughness,
        // roughnessMap,
        // roughnessMapTiling,
        // emissiveColor,
        uniforms = [],
        uniformBlockNames,
    } = materialArgs;

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
        {
            name: 'uIsPerspective',
            type: UniformTypes.Float,
            value: 0,
        },
        {
            name: 'uUseWorld',
            type: UniformTypes.Float,
            value: 0,
        },
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
        ...materialArgs,
        // ...options,
        name: 'ObjectSpaceRaymarchMaterial',
        type: MaterialTypes.ObjectSpaceRaymarch,

        vertexShader: raymarchVert,
        fragmentShader: fragmentShaderTemplate || litObjectSpaceRaymarchFragmentLayout,
        depthFragmentShader: depthFragmentShaderTemplate || gbufferObjectSpaceRaymarchDepthFragmentLayout,
        primitiveType: PrimitiveTypes.Triangles,
        faceSide: FaceSide.Double,

        // rawFragmentShader,
        uniforms: mergedUniforms,
        depthUniforms: mergedUniforms, // TODO: common, uniforms の2つで十分なはず。alpha test をしない限り
        // NOTE: GBufferMaterialの設定
        // useNormalMap: !!normalMap,
        // depthTest: true,
        // depthWrite: false,
        // depthFuncType: DepthFuncTypes.Equal,
        // NOTE: GBufferMaterialと違う点
        depthTest: true,
        depthWrite: true,
        depthFuncType: DepthFuncTypes.Lequal,
        skipDepthPrePass: true,
        renderQueueType: RenderQueueType.AlphaTest,

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
            }
        ],
        depthFragmentShaderModifiers: [
            {
                pragma: FragmentShaderModifierPragmas.RAYMARCH_SCENE,
                value: depthFragmentShaderContent,
            }
        ],
    });
}
