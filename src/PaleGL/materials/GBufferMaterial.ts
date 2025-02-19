import { MaterialArgs, Material } from '@/PaleGL/materials/Material';
import {
    DepthFuncTypes,
    ShadingModelIds,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
    VertexShaderModifier,
} from '@/PaleGL/constants';
import { Vector2 } from '@/PaleGL/math/Vector2';
import { Color } from '@/PaleGL/math/Color';
import { AttributeDescriptor } from '@/PaleGL/core/Attribute';
import { GPU } from '@/PaleGL/core/GPU';
import { Texture } from '@/PaleGL/core/Texture';

import gBufferVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import litFrag from '@/PaleGL/shaders/lit-fragment.glsl';
import gBufferDepthFrag from '@/PaleGL/shaders/gbuffer-depth-fragment.glsl';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';

export type GBufferMaterialArgs = {
    diffuseColor?: Color;
    diffuseMap?: Texture | null;
    diffuseMapUvScale?: Vector2;
    diffuseMapUvOffset?: Vector2;
    metallic?: number;
    metallicMap?: Texture | null;
    metallicMapTiling?: Vector4;
    roughness?: number;
    roughnessMap?: Texture | null;
    roughnessMapTiling?: Vector4;
    emissiveColor?: Color;
    normalMap?: Texture | null;
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
    roughness: number;
    roughnessMap: Texture | null;
    roughnessMapTiling: Vector4;
    metallic: number;
    metallicMap: Texture | null;
    metallicMapTiling: Vector4;

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
        metallicMap,
        metallicMapTiling,
        roughness,
        roughnessMap,
        roughnessMapTiling,
        // emissive
        emissiveColor,
        // TODO: 外部化
        vertexShaderModifier = {},
        shadingModelId = ShadingModelIds.Lit,
        uniforms = [],
        ...options
    }: GBufferMaterialArgs = {}) {
        // this.specularAmount =

        const roughnessMapValue = roughnessMap || null;
        const roughnessMapTilingValue = roughnessMapTiling || new Vector4(1, 1, 0, 0);
        const roughnessValue = roughness || 0;
        const metallicMapTilingValue = metallicMapTiling || new Vector4(1, 1, 0, 0);
        const metallicValue = metallic || 0;
        const metallicMapValue = metallicMap || null;

        const baseUniforms: UniformsData = [
            {
                name: UniformNames.DiffuseColor,
                type: UniformTypes.Color,
                value: diffuseColor || Color.white,
            },
            {
                name: UniformNames.DiffuseMap,
                type: UniformTypes.Texture,
                value: diffuseMap || null,
            },
            {
                name: UniformNames.DiffuseMapUvScale,
                type: UniformTypes.Vector2,
                // value: Vector2.one,
                value: diffuseMapUvScale || Vector2.one,
            },
            {
                name: UniformNames.DiffuseMapUvOffset,
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
                value: metallicValue,
            },
            {
                name: UniformNames.MetallicMap,
                type: UniformTypes.Texture,
                value: metallicMapValue,
            },
            {
                name: UniformNames.MetallicMapTiling,
                type: UniformTypes.Vector4,
                value: metallicMapTilingValue,
            },
            {
                name: UniformNames.Roughness,
                type: UniformTypes.Float,
                value: roughnessValue,
            },
            {
                name: UniformNames.RoughnessMap,
                type: UniformTypes.Texture,
                value: roughnessMapValue,
            },
            {
                name: UniformNames.RoughnessMapTiling,
                type: UniformTypes.Vector4,
                value: roughnessMapTilingValue,
            },
            {
                name: UniformNames.MetallicMap,
                type: UniformTypes.Texture,
                value: metallicMapValue,
            },
            {
                name: UniformNames.MetallicMapTiling,
                type: UniformTypes.Vector4,
                value: metallicMapTilingValue,
            },
            {
                name: UniformNames.NormalMap,
                type: UniformTypes.Texture,
                value: normalMap || null,
            },
            {
                name: UniformNames.NormalMapUvScale,
                type: UniformTypes.Vector2,
                // value: Vector2.one,
                value: normalMapUvScale || Vector2.one,
            },
            {
                name: UniformNames.NormalMapUvOffset,
                type: UniformTypes.Vector2,
                // value: Vector2.one,
                value: normalMapUvOffset || Vector2.one,
            },
            {
                name: UniformNames.EmissiveColor,
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
            uniformBlockNames: [UniformBlockNames.Common, UniformBlockNames.Transformations, UniformBlockNames.Camera],
        });

        this.roughness = roughnessValue;
        this.roughnessMap = roughnessMapValue;
        this.roughnessMapTiling = roughnessMapTilingValue;
        this.metallic = metallicValue;
        this.metallicMap = metallicMapValue;
        this.metallicMapTiling = metallicMapTilingValue;
    }

    start({ gpu, attributeDescriptors = [] }: { gpu: GPU; attributeDescriptors: AttributeDescriptor[] }) {
        this.vertexShader = gBufferVert;
        this.fragmentShader = litFrag;
        this.depthFragmentShader = gBufferDepthFrag;

        super.start({ gpu, attributeDescriptors });

        // console.log(gBufferVert)
        // console.log(this.rawFragmentShader)
    }

    updateUniforms() {
        super.updateUniforms();
        this.uniforms.setValue(UniformNames.RoughnessMap, this.roughnessMap);
        this.uniforms.setValue(UniformNames.Roughness, this.roughnessMap ? 1 : this.roughness);
        this.uniforms.setValue(UniformNames.RoughnessMapTiling, this.roughnessMapTiling);
        this.uniforms.setValue(UniformNames.MetallicMap, this.metallicMap);
        this.uniforms.setValue(UniformNames.Metallic, this.metallicMap ? 1 : this.metallic);
        this.uniforms.setValue(UniformNames.MetallicMapTiling, this.metallicMapTiling);
    }
}
