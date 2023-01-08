
import { Material } from "./Material.js";
import {
    shadowMapFragmentFunc,
    shadowMapFragmentUniforms,
    shadowMapFragmentVaryings
} from "../shaders/shadowMapShader.js";
import {
    alphaTestFragmentUniforms,
    alphaTestFragmentFunc,
    directionalLightFragmentUniforms,
    normalMapFragmentFunc, normalMapFragmentUniforms,
    normalMapFragmentVarying,
    phongSurfaceDirectionalLightFunc, normalMapVertexVaryings
} from "../shaders/lightingCommon.js";
import {UniformTypes} from "../constants.js";
import {Vector2} from "../math/Vector2.js";
import {Color} from "../math/Color.js";
import {buildVertexShader} from "../shaders/buildShader.js";

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
    }) {
        // this.specularAmount = 

        const baseUniforms = {
            uDiffuseColor: {
                type: UniformTypes.Color,
                value: diffuseColor || Color.white(),
            },
            uDiffuseMap: {
                type: UniformTypes.Texture,
                value: diffuseMap,
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
                value: normalMap,
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
                value: {}
            }
        };
       
        const mergedUniforms = {
            ...baseUniforms,
            ...(uniforms ?  uniforms : {})
        };

        const depthUniforms = {
            uDiffuseMap: {
                type: UniformTypes.Texture,
                value: diffuseMap,
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
    
    start(options) {
        this.vertexShader = this.generateVertexShader({
            isSkinning: this.isSkinning,
            gpuSkinning: this.gpuSkinning,
            jointNum: this.isSkinning ? this.jointNum : null,
            receiveShadow: this.receiveShadow,
            useNormalMap: this.useNormalMap,
            isInstancing: this.isInstancing,
            useVertexColor: this.useVertexColor,
            // localPositionPostProcess: vertexShaderModifier.localPositionPostProcess || "",
            vertexShaderModifier: this.vertexShaderModifier,
            attributeDescriptors: options.attributeDescriptors
        });

        this.fragmentShader = this.generateFragmentShader({
            receiveShadow: this.receiveShadow,
            useNormalMap: this.useNormalMap,
            alphaTest: this.alphaTest,
            useVertexColor: this.useVertexColor
        });

        this.depthFragmentShader = this.generateDepthFragmentShader({
            alphaTest: this.alphaTest,
            useVertexColor: this.useVertexColor
        });
        
        super.start(options);
    }

    generateVertexShader({
        isSkinning,
        gpuSkinning,
        jointNum,
        receiveShadow,
        useNormalMap,
        isInstancing,
        useVertexColor,
        vertexShaderModifier,
        attributeDescriptors,
        insertUniforms,
    }) {
        const shader = `#version 300 es

#pragma attributes

// varings
out vec2 vUv;
out vec3 vWorldPosition;
out vec3 vNormal;
${useNormalMap ? "#pragma varying_normal_map" : ""}
${receiveShadow ? "#pragma varying_receive_shadow" : "" }
${useVertexColor ? "#pragma varying_vertex_color" : ""}

// uniforms
#pragma uniform_transform_vertex
#pragma uniform_engine
${receiveShadow ? "#pragma uniform_receive_shadow" : "" }

${isSkinning ? "#pragma function_skinning" : ""}

${isSkinning ? `#pragma uniform_skinning ${jointNum}` : ""}
${insertUniforms || ""}

void main() {
    ${vertexShaderModifier.beginMain || ""}

    ${isSkinning ? "#pragma vertex_skinning gpu" : "" }

    vec4 localPosition = vec4(aPosition, 1.);
     ${isSkinning
            ? `
    localPosition = skinMatrix * localPosition;`
            : ""
        }
    ${vertexShaderModifier.localPositionPostProcess || ""}

    ${useNormalMap
            ? isSkinning
                ? "#pragma vertex_normal_map skinning"
                : "#pragma vertex_normal_map"
            : isSkinning
                ? "vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;"
                : "vNormal = mat3(uNormalMatrix) * aNormal;"
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
    
    generateFragmentShader({ receiveShadow, useNormalMap, alphaTest, useVertexColor }) {
        return `#version 300 es

precision mediump float;

uniform vec4 uDiffuseColor;
uniform sampler2D uDiffuseMap; 
uniform vec2 uDiffuseMapUvScale;
uniform float uSpecularAmount;
${useNormalMap ? normalMapFragmentUniforms() : ""}
${receiveShadow ? shadowMapFragmentUniforms() : ""}
uniform vec3 uViewPosition;
${alphaTest ? alphaTestFragmentUniforms() : ""}

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
${alphaTest ? alphaTestFragmentFunc() : ""}

void main() {
    vec2 uv = vUv * uDiffuseMapUvScale;
   
    vec4 diffuseMapColor = texture(uDiffuseMap, uv);
    
    ${useNormalMap
        ? "vec3 worldNormal = calcNormal(vNormal, vTangent, vBinormal, uNormalMap, uv);"
        : "vec3 worldNormal = normalize(vNormal);"
    }

    Surface surface;
    surface.worldPosition = vWorldPosition;
    surface.worldNormal = worldNormal;
    ${useVertexColor
        ? "surface.diffuseColor = vVertexColor * uDiffuseColor * diffuseMapColor;"
        : "surface.diffuseColor = uDiffuseColor * diffuseMapColor;"
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
    ${alphaTest
        ? `checkAlphaTest(resultColor.a, uAlphaTestThreshold);`
        : ""
    }

    // correct
    outBaseColor = resultColor;
    outNormalColor = vec4(worldNormal, 1.); 
    // outBaseColor = vec4(vec3(texture(uShadowMap, uv).x), 1.);
    // outBaseColor = vec4(vec3(vShadowMapProjectionUv.xyz), 1.);
    // outBaseColor = vec4(vec3(vShadowMapProjectionUv.xyz), 1.);

    // this is dummy
    // outBaseColor = vec4(1., 0., 0., 1.);
    // outNormalColor = vec4(0., 1., 0., 1.); 
}
`;
    }

    generateDepthFragmentShader({ alphaTest, useVertexColor }) {
        return `#version 300 es

precision mediump float;

uniform vec4 uColor;
uniform sampler2D uDiffuseMap; 
uniform vec2 uDiffuseMapUvScale;
${alphaTest ? alphaTestFragmentUniforms() : ""}

in vec2 vUv;
${useVertexColor ? "in vec4 vVertexColor;" : ""}

out vec4 outColor;

${alphaTest ? alphaTestFragmentFunc() : ""}    

void main() {
    vec2 uv = vUv * uDiffuseMapUvScale;
   
    vec4 diffuseMapColor = texture(uDiffuseMap, uv);
   
    ${useVertexColor
        ? "vec4 diffuseColor = vVertexColor * uColor * diffuseMapColor;"
        : "vec4 diffuseColor = uColor * diffuseMapColor;"
    }

    float alpha = diffuseColor.a; // TODO: base color を渡して alpha をかける
    
    ${alphaTest
        ? `checkAlphaTest(alpha, uAlphaTestThreshold);`
        : ""
    }

    outColor = vec4(1., 1., 1., 1.);
}
`;
    }
    
}