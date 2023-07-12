import { MaterialArgs, Material, Uniforms, VertexShaderModifier } from '@/PaleGL/materials/Material';
import {
    shadowMapFragmentFunc,
    shadowMapFragmentUniforms,
    shadowMapFragmentVaryings,
} from '@/PaleGL/shaders/shadowMapShader';
import {
    alphaTestFragmentUniforms,
    alphaTestFragmentFunc,
    directionalLightFragmentUniforms,
    normalMapFragmentFunc,
    normalMapFragmentUniforms,
    normalMapFragmentVarying,
    phongSurfaceDirectionalLightFunc,
} from '@/PaleGL/shaders/lightingCommon';
import { UniformTypes } from '@/PaleGL/constants';
import { Vector2 } from '@/PaleGL/math/Vector2';
import { Color } from '@/PaleGL/math/Color';
// import {buildVertexShader} from "@/PaleGL/shaders/buildShader.js";
import { AttributeDescriptor } from '@/PaleGL/core/Attribute';
import { GPU } from '@/PaleGL/core/GPU';
import { Texture } from '@/PaleGL/core/Texture';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Vector4 } from '@/PaleGL/math/Vector4';

import phongVert from '@/PaleGL/shaders/phong-vertex.glsl';

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
                value: normalMapUvOffset || Vector2.one
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

        this.fragmentShader = this.generateFragmentShader({
            receiveShadow: this.receiveShadow,
            useNormalMap: !!this.useNormalMap,
            useAlphaTest: this.useAlphaTest,
            useVertexColor: this.useVertexColor,
        });

        this.depthFragmentShader = this.generateDepthFragmentShader({
            useAlphaTest: this.useAlphaTest,
            useVertexColor: this.useVertexColor,
        });

        super.start({ gpu, attributeDescriptors });
        
        // console.log(this.rawVertexShader)
        // console.log(this.rawFragmentShader)
    }

    generateFragmentShader({
        receiveShadow,
        useNormalMap,
        useAlphaTest,
        useVertexColor,
    }: {
        receiveShadow: boolean;
        useNormalMap: boolean;
        useAlphaTest: boolean;
        useVertexColor: boolean;
    }): string {
        return `#version 300 es

precision mediump float;

uniform vec4 uDiffuseColor;
uniform sampler2D uDiffuseMap; 
uniform vec2 uDiffuseMapUvScale;
uniform float uSpecularAmount;
${useNormalMap ? normalMapFragmentUniforms() : ''}
${receiveShadow ? shadowMapFragmentUniforms() : ''}
uniform vec3 uViewPosition;
${useAlphaTest ? alphaTestFragmentUniforms() : ''}

${directionalLightFragmentUniforms()}

struct Surface {
    vec3 worldNormal;
    vec3 worldPosition;
    vec4 diffuseColor;
    float specularAmount;
};

struct Camera {
    vec3 worldPosition;
};

in vec2 vUv;
in vec3 vNormal;
${receiveShadow ? shadowMapFragmentVaryings() : ''}
${normalMapFragmentVarying()}
in vec3 vWorldPosition;
${useVertexColor ? 'in vec4 vVertexColor;' : ''}

// out vec4 outColor;
layout (location = 0) out vec4 outBaseColor;
layout (location = 1) out vec4 outNormalColor;

${phongSurfaceDirectionalLightFunc()}
${useNormalMap ? normalMapFragmentFunc() : ''}
${receiveShadow ? shadowMapFragmentFunc() : ''}
${useAlphaTest ? alphaTestFragmentFunc() : ''}

void main() {
    vec2 uv = vUv * uDiffuseMapUvScale;
   
    vec4 diffuseMapColor = texture(uDiffuseMap, uv);
    
    ${
        useNormalMap
            ? `
    vec3 worldNormal = calcNormal(vNormal, vTangent, vBinormal, uNormalMap, uv);
`
            : `
    vec3 worldNormal = normalize(vNormal);
`
    }

    Surface surface;
    surface.worldPosition = vWorldPosition;
    surface.worldNormal = worldNormal;
    ${
        useVertexColor
            ? `
    surface.diffuseColor = vVertexColor * uDiffuseColor * diffuseMapColor;
`
            : `
    surface.diffuseColor = uDiffuseColor * diffuseMapColor;
`
    }
    surface.specularAmount = uSpecularAmount;

    Camera camera;
    camera.worldPosition = uViewPosition;
    
    vec4 resultColor = vec4(0, 0, 0, 1);
    
    // directional light
    resultColor = calcDirectionalLight(surface, uDirectionalLight, camera);
   
    ${
        receiveShadow
            ? `
    // TODO: apply shadow の中に入れても良さそう
    if(dot(surface.worldNormal, uDirectionalLight.direction) > 0.) {
        resultColor = applyShadow(resultColor, uShadowMap, vShadowMapProjectionUv, uShadowBias, vec4(0., 0., 0., 1.), 0.5);
    }
`
            : ''
    }
    ${
        useAlphaTest
            ? `
    checkAlphaTest(resultColor.a, uAlphaTestThreshold);
`
            : ''
    }

    // correct
    outBaseColor = resultColor;
    outNormalColor = vec4(worldNormal * .5 + .5, 1.); 

    // this is dummy
    // outBaseColor = vec4(1., 0., 0., 1.);
    // outNormalColor = vec4(0., 1., 0., 1.); 
}
`;
    }

    generateDepthFragmentShader({ useAlphaTest, useVertexColor }: { useAlphaTest: boolean; useVertexColor: boolean }) {
        return `#version 300 es

precision mediump float;

uniform vec4 uColor;
uniform sampler2D uDiffuseMap; 
uniform vec2 uDiffuseMapUvScale;
${useAlphaTest ? alphaTestFragmentUniforms() : ''}

in vec2 vUv;
${useVertexColor ? 'in vec4 vVertexColor;' : ''}

out vec4 outColor;

${useAlphaTest ? alphaTestFragmentFunc() : ''}    

void main() {
    vec2 uv = vUv * uDiffuseMapUvScale;
   
    vec4 diffuseMapColor = texture(uDiffuseMap, uv);
   
    ${
        useVertexColor
            ? `
    vec4 diffuseColor = vVertexColor * uColor * diffuseMapColor;
`
            : `
    vec4 diffuseColor = uColor * diffuseMapColor;
`
    }

    float alpha = diffuseColor.a; // TODO: base color を渡して alpha をかける
    
    ${
        useAlphaTest
            ? `
    checkAlphaTest(alpha, uAlphaTestThreshold);
`
            : ''
    }

    outColor = vec4(1., 1., 1., 1.);
}
`;
    }
}
