import { MaterialArgs, createMaterial } from '@/PaleGL/materials/material.ts';
import {
    DepthFuncTypes,
    MaterialTypes,
    ShadingModelIds,
    UniformBlockNames,
    UniformNames,
    UniformTypes
} from '@/PaleGL/constants';
import postprocessVert from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';
// import postprocessVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { Texture } from '@/PaleGL/core/Texture.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';

// TODO: uniformsは一旦まっさらにしている。metallic,smoothnessの各種パラメーター、必要になりそうだったら適宜追加する
export type ScreenSpaceRaymarchMaterialArgs = {
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
} & MaterialArgs;

// export class ScreenSpaceRaymarchMaterial extends Material {
//     constructor({
//         // TODO: 外部化
//         fragmentShader,
//         depthFragmentShader,
//         shadingModelId = ShadingModelIds.Lit,
//         uniforms = [],
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
//         uniformBlockNames,
//         ...options
//     }: ScreenSpaceRaymarchMaterialArgs) {
//         const roughnessMapValue = roughnessMap || null;
//         const roughnessMapTilingValue = roughnessMapTiling || new Vector4(1, 1, 0, 0);
//         const roughnessValue = roughness || 0;
//         const metallicMapTilingValue = metallicMapTiling || new Vector4(1, 1, 0, 0);
//         const metallicValue = metallic || 0;
//         const metallicMapValue = metallicMap || null;
//
//         const commonUniforms: UniformsData = [
//             {
//                 name: UniformNames.DepthTexture,
//                 type: UniformTypes.Texture,
//                 value: null,
//             },
//             {
//                 name: UniformNames.CameraFov,
//                 type: UniformTypes.Float,
//                 value: 0,
//             },
//             {
//                 name: UniformNames.CameraAspect,
//                 type: UniformTypes.Float,
//                 value: 0,
//             },
//
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
//             // {
//             //     name: UniformNames.DiffuseColor,
//             //     type: UniformTypes.Color,
//             //     value: diffuseColor || Color.white,
//             // },
//             // {
//             //     name: UniformNames.Metallic,
//             //     type: UniformTypes.Float,
//             //     value: metallic || 0,
//             // },
//             // {
//             //     name: UniformNames.Roughness,
//             //     type: UniformTypes.Float,
//             //     value: roughness || 0,
//             // },
//
//             {
//                 name: UniformNames.EmissiveColor,
//                 type: UniformTypes.Color,
//                 value: emissiveColor || Color.black,
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
//             name: 'ScreenSpaceRaymarchMaterial',
//             vertexShader: postprocessVert,
//             fragmentShader,
//             depthFragmentShader,
//             uniforms: mergedUniforms,
//             // depthUniforms: commonUniforms,
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
//             uniformBlockNames: [
//                 UniformBlockNames.Common,
//                 UniformBlockNames.Transformations,
//                 UniformBlockNames.Camera,
//                 ...(uniformBlockNames ? uniformBlockNames : []),
//             ],
//         });
//     }
// }

export type ScreenSpaceRaymarchMaterial = ReturnType<typeof createScreenSpaceRaymarchMaterial>;

export function createScreenSpaceRaymarchMaterial({
    // TODO: 外部化
    fragmentShader,
    depthFragmentShader,
    shadingModelId = ShadingModelIds.Lit,
    uniforms = [],
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
    uniformBlockNames,
    ...options
}: ScreenSpaceRaymarchMaterialArgs) {
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
            name: UniformNames.DepthTexture,
            type: UniformTypes.Texture,
            value: null,
        },
        {
            name: UniformNames.CameraFov,
            type: UniformTypes.Float,
            value: 0,
        },
        {
            name: UniformNames.CameraAspect,
            type: UniformTypes.Float,
            value: 0,
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
        ...options,
        name: 'ScreenSpaceRaymarchMaterial',
        type: MaterialTypes.ScreenSpaceRaymarch,
        vertexShader: postprocessVert,
        fragmentShader,
        depthFragmentShader,
        uniforms: mergedUniforms,
        // depthUniforms: commonUniforms,
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
