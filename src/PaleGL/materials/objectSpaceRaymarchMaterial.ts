import { MaterialArgs, createMaterial } from '@/PaleGL/materials/material.ts';
import {
    DepthFuncTypes,
    FaceSide,
    MaterialTypes,
    PRAGMA_RAYMARCH_SCENE,
    PrimitiveTypes,
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
    diffuseColor?: Color;
    diffuseMap?: Texture;
    diffuseMapTiling?: Vector4;
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
    const fragmentShader = (fragmentShaderTemplate || litObjectSpaceRaymarchFragmentLayout).replace(
        PRAGMA_RAYMARCH_SCENE,
        fragmentShaderContent
    );
    const depthFragmentShader = (depthFragmentShaderTemplate || gbufferObjectSpaceRaymarchDepthFragmentLayout).replace(
        PRAGMA_RAYMARCH_SCENE,
        depthFragmentShaderContent
    );

    const {
        // TODO: 外部化
        // fragmentShader,
        // depthFragmentShader,
        // rawFragmentShader,
        shadingModelId = ShadingModelIds.Lit,
        diffuseColor,
        diffuseMap,
        diffuseMapTiling, // vec4
        metallic,
        metallicMap,
        metallicMapTiling,
        roughness,
        roughnessMap,
        roughnessMapTiling,
        emissiveColor,
        uniforms = [],
        uniformBlockNames,
    } = materialArgs;

    const _diffuseMap = diffuseMap || null;
    const _diffuseColor = diffuseColor || createColorWhite();
    const _diffuseMapTiling = diffuseMapTiling || createVector4(1, 1, 0, 0);
    const _roughnessMap = roughnessMap || null;
    const _roughnessMapTiling = roughnessMapTiling || createVector4(1, 1, 0, 0);
    const _roughness = roughness || 0;
    const _metallic = metallic || 0;
    const _metallicMap = metallicMap || null;
    const _metallicMapTiling = metallicMapTiling || createVector4(1, 1, 0, 0);
    const _emissiveColor = emissiveColor || createColorBlack();

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
            name: UniformNames.DiffuseMap,
            type: UniformTypes.Texture,
            value: _diffuseMap,
        },
        {
            name: UniformNames.DiffuseColor,
            type: UniformTypes.Color,
            value: _diffuseColor,
        },
        {
            name: UniformNames.DiffuseMapTiling,
            type: UniformTypes.Vector4,
            // value: Vector2.one,
            value: _diffuseMapTiling,
        },
        {
            name: UniformNames.Metallic,
            type: UniformTypes.Float,
            value: _metallic,
        },
        {
            name: UniformNames.MetallicMap,
            type: UniformTypes.Texture,
            value: _metallicMap,
        },
        {
            name: UniformNames.MetallicMapTiling,
            type: UniformTypes.Vector4,
            value: _metallicMapTiling,
        },

        {
            name: UniformNames.Roughness,
            type: UniformTypes.Float,
            value: _roughness,
        },
        {
            name: UniformNames.RoughnessMap,
            type: UniformTypes.Texture,
            value: _roughnessMap,
        },
        {
            name: UniformNames.RoughnessMapTiling,
            type: UniformTypes.Vector4,
            value: _roughnessMapTiling,
        },

        {
            name: UniformNames.EmissiveColor,
            type: UniformTypes.Color,
            value: _emissiveColor,
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
    const material = createMaterial({
        ...materialArgs,
        // ...options,
        name: 'ObjectSpaceRaymarchMaterial',
        type: MaterialTypes.ObjectSpaceRaymarch,

        vertexShader: raymarchVert,
        fragmentShader,
        depthFragmentShader,
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

        uniformBlockNames: [
            UniformBlockNames.Common,
            UniformBlockNames.Transformations,
            UniformBlockNames.Camera,
            ...(uniformBlockNames ? uniformBlockNames : []),
        ],
    });

    return {
        ...material,
    };
}
