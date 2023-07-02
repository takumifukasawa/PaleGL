import {MaterialArgs, Material, Uniforms, VertexShaderModifier} from "./Material";
import {
    shadowMapFragmentFunc,
    shadowMapFragmentUniforms,
    shadowMapFragmentVaryings
} from "../shaders/shadowMapShader";
import {
    alphaTestFragmentUniforms,
    alphaTestFragmentFunc,
    directionalLightFragmentUniforms,
    normalMapFragmentFunc, normalMapFragmentUniforms,
    normalMapFragmentVarying,
    phongSurfaceDirectionalLightFunc
} from "../shaders/lightingCommon";
import {UniformTypes} from "../constants";
import {Vector2} from "../math/Vector2";
import {Color} from "../math/Color";
// import {buildVertexShader} from "../shaders/buildShader.js";
import {AttributeDescriptor} from "../core/Attribute";
import {GPU} from "../core/GPU";
import {Texture} from "../core/Texture";
import {Vector3} from "../math/Vector3";
import {Vector4} from "../math/Vector4";

export type PhongMaterialArgs = {
    diffuseColor?: Color,
    diffuseMap?: Texture
    diffuseMapUvScale?: Vector2,
    diffuseMapUvOffset?: Vector2,
    specularAmount?: number,
    normalMap?: Texture,
    normalMapUvScale?: Vector2,
    normalMapUvOffset?: Vector2,
    vertexShaderModifier?: VertexShaderModifier,
    uniforms?: Uniforms,
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
                value: Vector2.one
            },
            uDiffuseMapUvOffset: {
                type: UniformTypes.Vector2,
                value: Vector2.one
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
                value: Vector2.one
            },
            uNormalMapUvOffset: {
                type: UniformTypes.Vector2,
                value: Vector2.one
            },
            uDirectionalLight: {
                type: UniformTypes.Struct,
                value: {
                    direction: Vector3.zero,
                    intensity: 0,
                    color: new Vector4(0, 0, 0, 0),
                }
            }
        };

        const mergedUniforms: Uniforms = {
            ...baseUniforms,
            ...(uniforms ? uniforms : {})
        };

        const depthUniforms: Uniforms = {
            uDiffuseMap: {
                type: UniformTypes.Texture,
                value: diffuseMap || null,
            },
            uDiffuseMapUvScale: {
                type: UniformTypes.Vector2,
                value: Vector2.one
            },
            uDiffuseMapUvOffset: {
                type: UniformTypes.Vector2,
                value: Vector2.one
            },
        }

        // TODO: できるだけconstructorの直後に持っていきたい
        super({
            ...options,
            name: "PhongMaterial",
            // vertexShaderGenerator,
            // vertexShader,
            // fragmentShaderGenerator,
            // depthFragmentShaderGenerator,
            vertexShaderModifier,
            uniforms: mergedUniforms,
            depthUniforms,
            useNormalMap: !!normalMap
        });
    }

    start({gpu, attributeDescriptors = []}: { gpu: GPU, attributeDescriptors: AttributeDescriptor[] }) {
        this.vertexShader = this.generateVertexShader({
            isSkinning: !!this.isSkinning,
            gpuSkinning: !!this.gpuSkinning,
            jointNum: this.isSkinning ? this.jointNum : null,
            receiveShadow: this.receiveShadow,
            useNormalMap: !!this.useNormalMap,
            isInstancing: this.isInstancing,
            useVertexColor: this.useVertexColor,
            // localPositionPostProcess: vertexShaderModifier.localPositionPostProcess || "",
            vertexShaderModifier: this.vertexShaderModifier,
            // attributeDescriptors: attributeDescriptors
        });

        this.fragmentShader = this.generateFragmentShader({
            receiveShadow: this.receiveShadow,
            useNormalMap: !!this.useNormalMap,
            useAlphaTest: this.useAlphaTest,
            useVertexColor: this.useVertexColor
        });

        this.depthFragmentShader = this.generateDepthFragmentShader({
            useAlphaTest: this.useAlphaTest,
            useVertexColor: this.useVertexColor
        });

        super.start({gpu, attributeDescriptors});
    }

    generateVertexShader({
                             isSkinning,
                             // gpuSkinning,
                             jointNum,
                             receiveShadow,
                             useNormalMap,
                             // isInstancing,
                             useVertexColor,
                             vertexShaderModifier = {},
                             // attributeDescriptors,
                             insertUniforms,
                         }: {
        isSkinning: boolean,
        gpuSkinning: boolean,
        jointNum: number | null,
        receiveShadow: boolean,
        useNormalMap: boolean,
        isInstancing: boolean,
        useVertexColor: boolean,
        vertexShaderModifier: VertexShaderModifier,
        // attributeDescriptors: AttributeDescriptor[],
        insertUniforms?: string,
    }): string {
        const shader = `#version 300 es

#pragma attributes

// varyings
out vec2 vUv;
out vec3 vWorldPosition;
out vec3 vNormal;
${useNormalMap ? "#pragma varying_normal_map" : ""}
${receiveShadow ? "#pragma varying_receive_shadow" : ""}
${useVertexColor ? "#pragma varying_vertex_color" : ""}

// uniforms
#pragma uniform_transform_vertex
#pragma uniform_engine
${receiveShadow ? "#pragma uniform_receive_shadow" : ""}

${isSkinning ? "#pragma function_skinning" : ""}

${isSkinning ? `#pragma uniform_skinning ${jointNum}` : ""}
${insertUniforms || ""}

void main() {
    ${vertexShaderModifier.beginMain || ""}

    ${isSkinning
            ? `
    #pragma vertex_skinning gpu
` : ""
        }

    vec4 localPosition = vec4(aPosition, 1.);
    ${isSkinning
            ? `
    localPosition = skinMatrix * localPosition;`
            : ""
        }
    ${vertexShaderModifier.localPositionPostProcess || ""}

    ${useNormalMap
            ? isSkinning
                ? `
    #pragma vertex_normal_map skinning
`
                : `
    #pragma vertex_normal_map
`
            : isSkinning
                ? `
    vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;
`
                : `
    vNormal = mat3(uNormalMatrix) * aNormal;
`
        }

    // assign common varyings 
    vUv = aUv;

    vec4 worldPosition = uWorldMatrix * localPosition;
    ${vertexShaderModifier.worldPositionPostProcess || ""}
 
    vWorldPosition = worldPosition.xyz;

    ${receiveShadow ? "#pragma vertex_receive_shadow" : ""}

    vec4 viewPosition = uViewMatrix * worldPosition;
    ${vertexShaderModifier.viewPositionPostProcess || ""}
 
    ${vertexShaderModifier.outClipPositionPreProcess || ""}
 
    gl_Position = uProjectionMatrix * viewPosition;

    ${vertexShaderModifier.lastMain || ""} 
}`;

        return shader;
    }

    generateFragmentShader({
                               receiveShadow,
                               useNormalMap,
                               useAlphaTest,
                               useVertexColor
                           }: { receiveShadow: boolean, useNormalMap: boolean, useAlphaTest: boolean, useVertexColor: boolean }): string {
        return `#version 300 es

precision mediump float;

uniform vec4 uDiffuseColor;
uniform sampler2D uDiffuseMap; 
uniform vec2 uDiffuseMapUvScale;
uniform float uSpecularAmount;
${useNormalMap ? normalMapFragmentUniforms() : ""}
${receiveShadow ? shadowMapFragmentUniforms() : ""}
uniform vec3 uViewPosition;
${useAlphaTest ? alphaTestFragmentUniforms() : ""}

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
${receiveShadow ? shadowMapFragmentVaryings() : ""}
${normalMapFragmentVarying()}
in vec3 vWorldPosition;
// TODO: フラグで必要に応じて出し分け
${useVertexColor ? "in vec4 vVertexColor;" : ""}

// out vec4 outColor;
layout (location = 0) out vec4 outBaseColor;
layout (location = 1) out vec4 outNormalColor;

${phongSurfaceDirectionalLightFunc()}
${useNormalMap ? normalMapFragmentFunc() : ""}
${receiveShadow ? shadowMapFragmentFunc() : ""}
${useAlphaTest ? alphaTestFragmentFunc() : ""}

void main() {
    vec2 uv = vUv * uDiffuseMapUvScale;
   
    vec4 diffuseMapColor = texture(uDiffuseMap, uv);
    
    ${useNormalMap
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
    ${useVertexColor
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
   
    ${receiveShadow
            ? `
    // TODO: apply shadow の中に入れても良さそう
    if(dot(surface.worldNormal, uDirectionalLight.direction) > 0.) {
        resultColor = applyShadow(resultColor, uShadowMap, vShadowMapProjectionUv, uShadowBias, vec4(0., 0., 0., 1.), 0.5);
    }
`
            : ""
        }
    ${useAlphaTest
            ? `
    checkAlphaTest(resultColor.a, uAlphaTestThreshold);
`
            : ""
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

    generateDepthFragmentShader({useAlphaTest, useVertexColor}: { useAlphaTest: boolean, useVertexColor: boolean }) {
        return `#version 300 es

precision mediump float;

uniform vec4 uColor;
uniform sampler2D uDiffuseMap; 
uniform vec2 uDiffuseMapUvScale;
${useAlphaTest ? alphaTestFragmentUniforms() : ""}

in vec2 vUv;
${useVertexColor ? "in vec4 vVertexColor;" : ""}

out vec4 outColor;

${useAlphaTest ? alphaTestFragmentFunc() : ""}    

void main() {
    vec2 uv = vUv * uDiffuseMapUvScale;
   
    vec4 diffuseMapColor = texture(uDiffuseMap, uv);
   
    ${useVertexColor
            ? `
    vec4 diffuseColor = vVertexColor * uColor * diffuseMapColor;
`
            : `
    vec4 diffuseColor = uColor * diffuseMapColor;
`
        }

    float alpha = diffuseColor.a; // TODO: base color を渡して alpha をかける
    
    ${useAlphaTest
            ? `
    checkAlphaTest(alpha, uAlphaTestThreshold);
`
            : ""
        }

    outColor = vec4(1., 1., 1., 1.);
}
`;
    }

}
