import { MaterialArgs, MaterialTypes, createMaterial } from '@/PaleGL/materials/material.ts';
import {
    DepthFuncTypes,
    FaceSide,
    PRAGMA_RAYMARCH_SCENE,
    PrimitiveTypes,
    ShadingModelIds,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants';
import raymarchVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Color } from '@/PaleGL/math/Color.ts';
// import { litObjectSpaceRaymarchFragmentTemplate } from '@/PaleGL/shaders/templates/lit-object-space-raymarch-fragment-template.ts';
// import { gbufferObjectSpaceRaymarchDepthFragmentTemplate } from '@/PaleGL/shaders/templates/gbuffer-object-space-raymarch-depth-fragment-template.ts';
import litObjectSpaceRaymarchFragmentLayout from '@/PaleGL/shaders/layout/layout-lit-object-space-raymarch-fragment.glsl';
import gbufferObjectSpaceRaymarchDepthFragmentLayout from '@/PaleGL/shaders/layout/layout-gbuffer-object-space-raymarch-depth-fragment.glsl';
import { Texture } from '@/PaleGL/core/Texture.ts';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';

// TODO: uniformsは一旦まっさらにしている。metallic,smoothnessの各種パラメーター、必要になりそうだったら適宜追加する
export type ObjectSpaceRaymarchMaterialArgs = {
    shadingModelId?: ShadingModelIds;
    diffuseColor?: Color;
    diffuseMap?: Texture;
    diffuseMapUvScale?: Vector2;
    diffuseMapUvOffset?: Vector2;
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

// export function createObjectSpaceRaymarchMaterial({
//     fragmentShaderTemplate,
//     fragmentShaderContent,
//     depthFragmentShaderTemplate,
//     depthFragmentShaderContent,
//     materialArgs,
// }: {
//     fragmentShaderTemplate?: string;
//     fragmentShaderContent: string;
//     depthFragmentShaderTemplate?: string;
//     depthFragmentShaderContent: string;
//     materialArgs: ObjectSpaceRaymarchMaterialArgs;
// }) {
//     const fragmentShader = (fragmentShaderTemplate || litObjectSpaceRaymarchFragmentLayout).replace(
//         PRAGMA_RAYMARCH_SCENE,
//         fragmentShaderContent
//     );
//     const depthFragmentShader = (depthFragmentShaderTemplate || gbufferObjectSpaceRaymarchDepthFragmentLayout).replace(
//         PRAGMA_RAYMARCH_SCENE,
//         depthFragmentShaderContent
//     );
//
//     const material = new ObjectSpaceRaymarchMaterial({
//         fragmentShader,
//         depthFragmentShader,
//         ...materialArgs,
//         primitiveType: PrimitiveTypes.Triangles,
//         faceSide: FaceSide.Double,
//         uniforms: materialArgs.uniforms,
//     });
//
//     return material;
// }
//
// export class ObjectSpaceRaymarchMaterial extends Material {
//     constructor({
//         // TODO: 外部化
//         fragmentShader,
//         depthFragmentShader,
//         // rawFragmentShader,
//         shadingModelId = ShadingModelIds.Lit,
//         diffuseColor,
//         diffuseMap,
//         diffuseMapUvScale, // vec2
//         diffuseMapUvOffset, // vec2
//         metallic,
//         metallicMap,
//         metallicMapTiling,
//         roughness,
//         roughnessMap,
//         roughnessMapTiling,
//         emissiveColor,
//         uniforms = [],
//         uniformBlockNames,
//         ...options
//     }: ObjectSpaceRaymarchMaterialArgs) {
//         const roughnessMapValue = roughnessMap || null;
//         const roughnessMapTilingValue = roughnessMapTiling || new Vector4(1, 1, 0, 0);
//         const roughnessValue = roughness || 0;
//         const metallicMapTilingValue = metallicMapTiling || new Vector4(1, 1, 0, 0);
//         const metallicValue = metallic || 0;
//         const metallicMapValue = metallicMap || null;
//
//         const commonUniforms: UniformsData = [
//             {
//                 name: UniformNames.ObjectSpaceRaymarchBoundsScale,
//                 type: UniformTypes.Vector3,
//                 value: Vector3.one,
//             },
//             {
//                 name: UniformNames.DepthTexture,
//                 type: UniformTypes.Texture,
//                 value: null,
//             },
//             // {
//             //     name: UniformNames.CameraNear,
//             //     type: UniformTypes.Float,
//             //     value: 0,
//             // },
//             // {
//             //     name: UniformNames.CameraFar,
//             //     type: UniformTypes.Float,
//             //     value: 0,
//             // },
//             {
//                 name: UniformNames.DiffuseMap,
//                 type: UniformTypes.Texture,
//                 value: diffuseMap || null,
//             },
//             {
//                 name: UniformNames.DiffuseColor,
//                 type: UniformTypes.Color,
//                 value: diffuseColor || Color.white,
//             },
//             {
//                 name: UniformNames.DiffuseMapUvScale,
//                 type: UniformTypes.Vector2,
//                 // value: Vector2.one,
//                 value: diffuseMapUvScale || Vector2.one,
//             },
//             {
//                 name: UniformNames.DiffuseMapUvOffset,
//                 type: UniformTypes.Vector2,
//                 // value: Vector2.one,
//                 value: diffuseMapUvOffset || Vector2.one,
//             },
//
//             {
//                 name: UniformNames.Metallic,
//                 type: UniformTypes.Float,
//                 value: metallicValue,
//             },
//             {
//                 name: UniformNames.MetallicMap,
//                 type: UniformTypes.Texture,
//                 value: metallicMapValue,
//             },
//             {
//                 name: UniformNames.MetallicMapTiling,
//                 type: UniformTypes.Vector4,
//                 value: metallicMapTilingValue,
//             },
//
//             {
//                 name: UniformNames.Roughness,
//                 type: UniformTypes.Float,
//                 value: roughnessValue,
//             },
//             {
//                 name: UniformNames.RoughnessMap,
//                 type: UniformTypes.Texture,
//                 value: roughnessMapValue,
//             },
//             {
//                 name: UniformNames.RoughnessMapTiling,
//                 type: UniformTypes.Vector4,
//                 value: roughnessMapTilingValue,
//             },
//
//             {
//                 name: UniformNames.EmissiveColor,
//                 type: UniformTypes.Color,
//                 value: emissiveColor || Color.black,
//             },
//             {
//                 name: 'uIsPerspective',
//                 type: UniformTypes.Float,
//                 value: 0,
//             },
//             {
//                 name: 'uUseWorld',
//                 type: UniformTypes.Float,
//                 value: 0,
//             },
//         ];
//         const shadingUniforms: UniformsData = [
//             {
//                 name: UniformNames.ShadingModelId,
//                 type: UniformTypes.Int, // float,intどちらでもいい
//                 value: shadingModelId,
//             },
//         ];
//
//         const mergedUniforms: UniformsData = [...commonUniforms, ...shadingUniforms, ...(uniforms ? uniforms : [])];
//
//         // TODO: できるだけconstructorの直後に持っていきたい
//         super({
//             ...options,
//             name: 'ObjectSpaceRaymarchMaterial',
//             type: MaterialTypes.ObjectSpaceRaymarch,
//             vertexShader: raymarchVert,
//             fragmentShader,
//             depthFragmentShader,
//             // rawFragmentShader,
//             uniforms: mergedUniforms,
//             depthUniforms: mergedUniforms, // TODO: common, uniforms の2つで十分なはず。alpha test をしない限り
//             // NOTE: GBufferMaterialの設定
//             // useNormalMap: !!normalMap,
//             // depthTest: true,
//             // depthWrite: false,
//             // depthFuncType: DepthFuncTypes.Equal,
//             // NOTE: GBufferMaterialと違う点
//             depthTest: true,
//             depthWrite: true,
//             depthFuncType: DepthFuncTypes.Lequal,
//             skipDepthPrePass: true,
//
//             uniformBlockNames: [
//                 UniformBlockNames.Common,
//                 UniformBlockNames.Transformations,
//                 UniformBlockNames.Camera,
//                 ...(uniformBlockNames ? uniformBlockNames : []),
//             ],
//         });
//     }
// }

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
        diffuseMapUvScale, // vec2
        diffuseMapUvOffset, // vec2
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
    const _diffuseColor = diffuseColor || Color.white;
    const _diffuseMapUvScale = diffuseMapUvScale || Vector2.one;
    const _diffuseMapUvOffset = diffuseMapUvOffset || Vector2.one;
    const _roughnessMap = roughnessMap || null;
    const _roughnessMapTiling = roughnessMapTiling || new Vector4(1, 1, 0, 0);
    const _roughness = roughness || 0;
    const _metallic = metallic || 0;
    const _metallicMap = metallicMap || null;
    const _metallicMapTiling = metallicMapTiling || new Vector4(1, 1, 0, 0);
    const _emissiveColor = emissiveColor || Color.black;

    const commonUniforms: UniformsData = [
        {
            name: UniformNames.ObjectSpaceRaymarchBoundsScale,
            type: UniformTypes.Vector3,
            value: Vector3.one,
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
            name: UniformNames.DiffuseMapUvScale,
            type: UniformTypes.Vector2,
            // value: Vector2.one,
            value: _diffuseMapUvScale,
        },
        {
            name: UniformNames.DiffuseMapUvOffset,
            type: UniformTypes.Vector2,
            // value: Vector2.one,
            value: _diffuseMapUvOffset,
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
