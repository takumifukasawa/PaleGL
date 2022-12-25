
import { Material } from "./Material.js";
import {
    shadowMapFragmentFunc,
    shadowMapFragmentUniforms,
    shadowMapFragmentVaryings
} from "../shaders/shadowMapShader.js";
import {generateVertexShader} from "../shaders/generateVertexShader.js";
import {
    alphaTestFragmentUniforms,
    alphaTestFragmentFunc,
    directionalLightFragmentUniforms,
    normalMapFragmentFunc, normalMapFragmentUniforms,
    normalMapFragmentVarying,
    phongSurfaceDirectionalLightFunc
} from "../shaders/lightingCommon.js";
import {UniformTypes} from "../constants.js";
import {Vector2} from "../math/Vector2.js";
import {Color} from "../math/Color.js";

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
        vertexShaderModifier = {
            localPositionPostProcess: ""
        },
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
                value: Vector2.one()
            },
            uDiffuseMapUvOffset: {
                type: UniformTypes.Vector2,
                value: Vector2.one()
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
                value: Vector2.one()
            },
            uNormalMapUvOffset: {
                type: UniformTypes.Vector2,
                value: Vector2.one()
            },
            uDirectionalLight: {}
        };
       
        const useNormalMap = !!normalMap;
        
        const vertexShaderGenerator = ({ isSkinning, jointNum, gpuSkinning, ...opts }) => generateVertexShader({
            isSkinning,
            gpuSkinning,
            jointNum: isSkinning ? jointNum : null,
            receiveShadow: options.receiveShadow,
            useNormalMap,
            // localPositionPostProcess: vertexShaderModifier.localPositionPostProcess || "",
            vertexShaderModifier,
            ...opts, // TODO: 本当はあんまりこういう渡し方はしたくない
        });
        
        const fragmentShaderGenerator = () => PhongMaterial.generateFragmentShader({
            receiveShadow: options.receiveShadow,
            useNormalMap,
            alphaTest: options.alphaTest
        });
        
        const mergedUniforms = {
            ...baseUniforms,
            ...(uniforms ?  uniforms : {})
        };
        
        const depthFragmentShaderGenerator = () => PhongMaterial.generateDepthFragmentShader({ alphaTest: options.alphaTest });
        
        const depthUniforms = {
            uDiffuseMap: {
                type: UniformTypes.Texture,
                value: diffuseMap,
            },
            uDiffuseMapUvScale: {
                type: UniformTypes.Vector2,
                value: Vector2.one()
            },
            uDiffuseMapUvOffset: {
                type: UniformTypes.Vector2,
                value: Vector2.one()
            },
        }

        super({
            ...options,
            name: "PhongMaterial",
            vertexShaderGenerator,
            fragmentShaderGenerator,
            depthFragmentShaderGenerator,
            vertexShaderModifier,
            uniforms: mergedUniforms,
            depthUniforms
        });
    }
    
    start(options) {
        super.start(options);
    }

    // updateUniforms(options) {
    //     super.updateUniforms(options);
    //     this.uniforms.uDiffuseColor.value = this.diffuseColor;
    //     this.uniforms.uSpecularAmount.value = this.specularAmount;
    // }
    
    static generateFragmentShader({ receiveShadow, useNormalMap, alphaTest }) {
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
in vec4 vVertexColor;

out vec4 outColor;

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
    surface.diffuseColor = vVertexColor * uDiffuseColor * diffuseMapColor;
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
    
    outColor = resultColor;
}
`;
    }

    static generateDepthFragmentShader({ alphaTest }) {
        return `#version 300 es

precision mediump float;

uniform vec4 uColor;
uniform sampler2D uDiffuseMap; 
uniform vec2 uDiffuseMapUvScale;
${alphaTest ? alphaTestFragmentUniforms() : ""}

in vec2 vUv;
in vec4 vVertexColor;

out vec4 outColor;

${alphaTest ? alphaTestFragmentFunc() : ""}    

void main() {
    vec2 uv = vUv * uDiffuseMapUvScale;
   
    vec4 diffuseMapColor = texture(uDiffuseMap, uv);
    
    vec4 diffuseColor = vVertexColor * uColor * diffuseMapColor;
    
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