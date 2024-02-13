import { MaterialArgs, Material } from '@/PaleGL/materials/Material';
import { DepthFuncTypes, ShadingModelIds, UniformNames, UniformTypes, VertexShaderModifier } from '@/PaleGL/constants';
import { Vector2 } from '@/PaleGL/math/Vector2';
import { Color } from '@/PaleGL/math/Color';
import { AttributeDescriptor } from '@/PaleGL/core/Attribute';
import { GPU } from '@/PaleGL/core/GPU';
import { Texture } from '@/PaleGL/core/Texture';

import gBufferVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import litFrag from '@/PaleGL/shaders/lit-fragment.glsl';
import gBufferDepthFrag from '@/PaleGL/shaders/gbuffer-depth-fragment.glsl';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';

export type GBufferMaterialArgs = {
    diffuseColor?: Color;
    diffuseMap?: Texture;
    diffuseMapUvScale?: Vector2;
    diffuseMapUvOffset?: Vector2;
    // specularAmount?: number;
    metallic?: number;
    roughness?: number;
    emissiveColor?: Color;
    normalMap?: Texture;
    normalMapUvScale?: Vector2;
    normalMapUvOffset?: Vector2;
    vertexShaderModifier?: VertexShaderModifier;
    uniforms?: UniformsData;
    shadingModelId?: ShadingModelIds;
} & MaterialArgs;

// TODO: 実質的にLitのMaterialなので、GBufferから命名剝がしたい
export class GBufferMaterial extends Material {
    // // params
    // diffuseColor;
    // specularAmount;

    constructor({
        // diffuse
        diffuseColor,
        diffuseMap,
        diffuseMapUvScale, // vec2
        diffuseMapUvOffset, // vec2
        // normal
        normalMap,
        normalMapUvScale, // vec2
        normalMapUvOffset, // vec2,
        // params
        // specularAmount,
        metallic,
        roughness,
        // emissive
        emissiveColor,
        // TODO: 外部化
        vertexShaderModifier = {},
        shadingModelId = ShadingModelIds.Lit,
        uniforms = [],
        ...options
    }: GBufferMaterialArgs = {}) {
        // this.specularAmount =

        const baseUniforms: UniformsData = [
            {
                name: 'uDiffuseColor',
                type: UniformTypes.Color,
                value: diffuseColor || Color.white,
            },
            {
                name: 'uDiffuseMap',
                type: UniformTypes.Texture,
                value: diffuseMap || null,
            },
            {
                name: 'uDiffuseMapUvScale',
                type: UniformTypes.Vector2,
                // value: Vector2.one,
                value: diffuseMapUvScale || Vector2.one,
            },
            {
                name: 'uDiffuseMapUvOffset',
                type: UniformTypes.Vector2,
                // value: Vector2.one,
                value: diffuseMapUvOffset || Vector2.one,
            },
            // uSpecularAmount: {
            //     type: UniformTypes.Float,
            //     value: specularAmount || 1,
            // },
            {
                name: UniformNames.Metallic,
                type: UniformTypes.Float,
                value: metallic || 0,
            },
            {
                name: UniformNames.Roughness,
                type: UniformTypes.Float,
                value: roughness || 0,
            },
            {
                name: 'uNormalMap',
                type: UniformTypes.Texture,
                value: normalMap || null,
            },
            {
                name: 'uNormalMapUvScale',
                type: UniformTypes.Vector2,
                // value: Vector2.one,
                value: normalMapUvScale || Vector2.one,
            },
            {
                name: 'uNormalMapUvOffset',
                type: UniformTypes.Vector2,
                // value: Vector2.one,
                value: normalMapUvOffset || Vector2.one,
            },
            {
                name: 'uEmissiveColor',
                type: UniformTypes.Color,
                value: emissiveColor || Color.black,
            },
            {
                name: UniformNames.ShadingModelId,
                type: UniformTypes.Int, // float,intどちらでもいい
                // value: shadingModelId,
                value: shadingModelId,
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
            name: 'GBufferMaterial',
            vertexShaderModifier,
            uniforms: mergedUniforms,
            depthUniforms,
            useNormalMap: !!normalMap,
            depthTest: true,
            depthWrite: false,
            depthFuncType: DepthFuncTypes.Equal,
        });
    }

    start({ gpu, attributeDescriptors = [] }: { gpu: GPU; attributeDescriptors: AttributeDescriptor[] }) {
        this.vertexShader = gBufferVert;
        this.fragmentShader = litFrag;
        this.depthFragmentShader = gBufferDepthFrag;

        super.start({ gpu, attributeDescriptors });

        // console.log(gBufferVert)
        // console.log(this.rawFragmentShader)
    }
}
