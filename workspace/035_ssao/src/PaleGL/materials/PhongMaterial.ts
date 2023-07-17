import { MaterialArgs, Material, Uniforms } from '@/PaleGL/materials/Material';
import { UniformTypes, VertexShaderModifier } from '@/PaleGL/constants';
import { Vector2 } from '@/PaleGL/math/Vector2';
import { Color } from '@/PaleGL/math/Color';
// import {buildVertexShader} from "@/PaleGL/shaders/buildShader.js";
import { AttributeDescriptor } from '@/PaleGL/core/Attribute';
import { GPU } from '@/PaleGL/core/GPU';
import { Texture } from '@/PaleGL/core/Texture';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Vector4 } from '@/PaleGL/math/Vector4';

import phongVert from '@/PaleGL/shaders/phong-vertex.glsl';
import phongFrag from '@/PaleGL/shaders/phong-fragment.glsl';
import phongDepthFrag from '@/PaleGL/shaders/phong-depth-fragment.glsl';

export type PhongMaterialArgs = {
    diffuseColor?: Color;
    diffuseMap?: Texture;
    diffuseMapUvScale?: Vector2;
    diffuseMapUvOffset?: Vector2;
    specularAmount?: number;
    normalMap?: Texture;
    normalMapUvScale?: Vector2;
    normalMapUvOffset?: Vector2;
    vertexShaderModifier?: VertexShaderModifier;
    uniforms?: Uniforms;
} & MaterialArgs;

export class PhongMaterial extends Material {
    // // params
    // diffuseColor;
    // specularAmount;

    constructor({
        diffuseColor,
        diffuseMap,
        diffuseMapUvScale, // vec2
        diffuseMapUvOffset, // vec2
        specularAmount,
        normalMap,
        normalMapUvScale, // vec2
        normalMapUvOffset, // vec2,
        // TODO: 外部化
        vertexShaderModifier = {},
        uniforms = {},
        ...options
    }: PhongMaterialArgs) {
        // this.specularAmount =

        const baseUniforms: Uniforms = {
            uDiffuseColor: {
                type: UniformTypes.Color,
                value: diffuseColor || Color.white(),
            },
            uDiffuseMap: {
                type: UniformTypes.Texture,
                value: diffuseMap || null,
            },
            uDiffuseMapUvScale: {
                type: UniformTypes.Vector2,
                // value: Vector2.one,
                value: diffuseMapUvScale || Vector2.one,
            },
            uDiffuseMapUvOffset: {
                type: UniformTypes.Vector2,
                // value: Vector2.one,
                value: diffuseMapUvOffset || Vector2.one,
            },
            uSpecularAmount: {
                type: UniformTypes.Float,
                value: specularAmount || 1,
            },
            uNormalMap: {
                type: UniformTypes.Texture,
                value: normalMap || null,
            },
            uNormalMapUvScale: {
                type: UniformTypes.Vector2,
                // value: Vector2.one,
                value: normalMapUvScale || Vector2.one,
            },
            uNormalMapUvOffset: {
                type: UniformTypes.Vector2,
                // value: Vector2.one,
                value: normalMapUvOffset || Vector2.one,
            },
            uDirectionalLight: {
                type: UniformTypes.Struct,
                value: {
                    direction: Vector3.zero,
                    intensity: 0,
                    color: new Vector4(0, 0, 0, 0),
                },
            },
        };

        const mergedUniforms: Uniforms = {
            ...baseUniforms,
            ...(uniforms ? uniforms : {}),
        };

        const depthUniforms: Uniforms = {
            uDiffuseMap: {
                type: UniformTypes.Texture,
                value: diffuseMap || null,
            },
            uDiffuseMapUvScale: {
                type: UniformTypes.Vector2,
                value: Vector2.one,
            },
            uDiffuseMapUvOffset: {
                type: UniformTypes.Vector2,
                value: Vector2.one,
            },
        };

        // TODO: できるだけconstructorの直後に持っていきたい
        super({
            ...options,
            name: 'PhongMaterial',
            // vertexShaderGenerator,
            // vertexShader,
            // fragmentShaderGenerator,
            // depthFragmentShaderGenerator,
            vertexShaderModifier,
            uniforms: mergedUniforms,
            depthUniforms,
            useNormalMap: !!normalMap,
        });
    }

    start({ gpu, attributeDescriptors = [] }: { gpu: GPU; attributeDescriptors: AttributeDescriptor[] }) {
        this.vertexShader = phongVert;
        this.fragmentShader = phongFrag;
        this.depthFragmentShader = phongDepthFrag;

        super.start({ gpu, attributeDescriptors });

        // console.log(this.rawVertexShader)
        // console.log(this.rawFragmentShader)
    }
}
