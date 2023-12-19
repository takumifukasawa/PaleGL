// import { MaterialArgs, Uniforms } from '@/PaleGL/materials/Material';
// import { VertexShaderModifier } from '@/PaleGL/constants';
// import { Vector2 } from '@/PaleGL/math/Vector2';
// import { Color } from '@/PaleGL/math/Color';
// import { Texture } from '@/PaleGL/core/Texture';
//
// import { GBufferMaterial, ShadingModelIds } from '@/PaleGL/materials/GBufferMaterial.ts';
//
// export type UnlitMaterialArgs = {
//     diffuseColor?: Color;
//     diffuseMap?: Texture;
//     diffuseMapUvScale?: Vector2;
//     diffuseMapUvOffset?: Vector2;
//     emissiveColor?: Color;
//     vertexShaderModifier?: VertexShaderModifier;
//     uniforms?: Uniforms;
// } & MaterialArgs;
//
// // NOTE:
// // GBufferのLitのシェーダー使ってるけど普通にunlit専用のシェーダーがある方が本当はきれい. 容量の問題
//
// export class UnlitMaterial extends GBufferMaterial {
//     // // params
//     // diffuseColor;
//     // specularAmount;
//
//     constructor({ ...options }: UnlitMaterialArgs = {}) {
//         // TODO: できるだけconstructorの直後に持っていきたい
//         super({
//             ...options,
//             name: 'UnlitMaterial',
//             shadingModelId: ShadingModelIds.Unlit,
//         });
//     }
// }

import { MaterialArgs, Material } from '@/PaleGL/materials/Material';
import { DepthFuncTypes, UniformNames, UniformTypes, VertexShaderModifier } from '@/PaleGL/constants';
import { Vector2 } from '@/PaleGL/math/Vector2';
import { Color } from '@/PaleGL/math/Color';
// import {buildVertexShader} from "@/PaleGL/shaders/buildShader.js";
import { AttributeDescriptor } from '@/PaleGL/core/Attribute';
import { GPU } from '@/PaleGL/core/GPU';
import { Texture } from '@/PaleGL/core/Texture';

import gBufferVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import unlitFrag from '@/PaleGL/shaders/unlit-fragment.glsl';
import gBufferDepthFrag from '@/PaleGL/shaders/gbuffer-depth-fragment.glsl';
import { ShadingModelIds } from '@/PaleGL/materials/GBufferMaterial.ts';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';

export type UnlitMaterialArgs = {
    diffuseColor?: Color;
    diffuseMap?: Texture;
    diffuseMapUvScale?: Vector2;
    diffuseMapUvOffset?: Vector2;
    emissiveColor?: Color;
    vertexShaderModifier?: VertexShaderModifier;
    uniforms?: UniformsData;
} & MaterialArgs;

export class UnlitMaterial extends Material {
    constructor({
        diffuseColor,
        diffuseMap,
        diffuseMapUvScale, // vec2
        diffuseMapUvOffset, // vec2
        emissiveColor,
        // TODO: 外部化
        vertexShaderModifier = {},
        uniforms = [],
        ...options
    }: UnlitMaterialArgs = {}) {
        // this.specularAmount =

        const baseUniforms: UniformsData = [
            {
                name: 'uDiffuseColor',
                type: UniformTypes.Color,
                value: diffuseColor || Color.black,
            },
            {
                name: 'uDiffuseMap',
                type: UniformTypes.Texture,
                value: diffuseMap || null,
            },
            {
                name: 'uDiffuseMapUvScale',
                type: UniformTypes.Vector2,
                value: diffuseMapUvScale || Vector2.one,
            },
            {
                name: 'uDiffuseMapUvOffset',
                type: UniformTypes.Vector2,
                value: diffuseMapUvOffset || Vector2.one,
            },
            {
                name: 'uEmissiveColor',
                type: UniformTypes.Color,
                value: emissiveColor || Color.black,
            },
            {
                name: UniformNames.ShadingModelId,
                type: UniformTypes.Int,
                value: ShadingModelIds.Unlit,
            },
        ];

        const mergedUniforms: UniformsData = [...baseUniforms, ...(uniforms ? uniforms : [])];

        const depthUniforms: UniformsData = [
            {
                name: 'uDiffuseMap',
                type: UniformTypes.Texture,
                value: diffuseMap || null,
            },
            {
                name: 'uDiffuseMapUvScale',
                type: UniformTypes.Vector2,
                value: Vector2.one,
            },
            {
                name: 'uDiffuseMapUvOffset',
                type: UniformTypes.Vector2,
                value: Vector2.one,
            },
        ];

        // TODO: できるだけconstructorの直後に持っていきたい
        super({
            ...options,
            name: 'UnlitMaterial',
            vertexShaderModifier,
            uniforms: mergedUniforms,
            depthUniforms,
            useNormalMap: false,
            depthTest: true,
            depthWrite: false, // TODO: これはGBufferの場合. unlitはtransparentの場合も対処すべき
            depthFuncType: DepthFuncTypes.Equal, // TODO: これはGBufferの場合
        });
    }

    start({ gpu, attributeDescriptors = [] }: { gpu: GPU; attributeDescriptors: AttributeDescriptor[] }) {
        this.vertexShader = gBufferVert;
        this.fragmentShader = unlitFrag;
        this.depthFragmentShader = gBufferDepthFrag;
        super.start({ gpu, attributeDescriptors });
    }
}
