
import { Material } from "./Material.js";
import {shadowMapFragmentFunc} from "../shaders/shadowMapShader.js";
import {generateVertexShader} from "../shaders/generateVertexShader.js";
import {normalMapFragmentFunc} from "../shaders/lightingCommon.js";
import {UniformTypes} from "../constants.js";
import {Matrix4} from "../math/Matrix4.js";

const generateFragmentShader = ({ receiveShadow, useNormalMap }) => `#version 300 es

precision mediump float;

uniform sampler2D uDiffuseMap; 
uniform sampler2D uNormalMap;
uniform float uNormalStrength;
uniform sampler2D uShadowMap;
uniform float uShadowBias;
uniform vec3 uViewPosition;          

struct DirectionalLight {
    vec3 direction;
    float intensity;
    vec4 color;
};
uniform DirectionalLight uDirectionalLight;

struct Surface {
    vec3 worldNormal;
    vec3 worldPosition;
    vec4 diffuseColor;
};

struct Camera {
    vec3 worldPosition;
};

in vec4 vShadowMapProjectionUv; 
in vec2 vUv;
in vec3 vNormal;
in vec3 vTangent;
in vec3 vBinormal;
in vec3 vWorldPosition;

out vec4 outColor;

vec4 calcDirectionalLight(Surface surface, DirectionalLight directionalLight, Camera camera) {
    vec3 N = normalize(surface.worldNormal);
    vec3 L = normalize(directionalLight.direction);
    float diffuseRate = clamp(dot(N, L), 0., 1.);
    vec3 diffuseColor = surface.diffuseColor.xyz * diffuseRate * uDirectionalLight.intensity * uDirectionalLight.color.xyz;

    vec3 P = surface.worldPosition;
    vec3 E = camera.worldPosition;
    vec3 PtoL = L; // for directional light
    vec3 PtoE = normalize(E - P);
    vec3 H = normalize(PtoL + PtoE);
    float specularPower = 16.;
    float specularRate = clamp(dot(H, N), 0., 1.);
    specularRate = pow(specularRate, specularPower);
    vec3 specularColor = specularRate * directionalLight.intensity * directionalLight.color.xyz;

    vec3 ambientColor = vec3(.1);

    vec4 resultColor = vec4(diffuseColor + specularColor + ambientColor, 1.);
    
    return resultColor;
}

${useNormalMap ? normalMapFragmentFunc() : ""}

${receiveShadow ? shadowMapFragmentFunc() : ""}

void main() {

    vec2 uv = vUv * 1.;
   
    vec4 baseColor = vec4(.1, .1, .1, 1.);
    baseColor = texture(uNormalMap, uv);

    vec4 diffuseMapColor = texture(uDiffuseMap, uv);
    
    ${useNormalMap
        ? "vec3 worldNormal = calcNormal(vNormal, vTangent, vBinormal, uNormalMap, uv);"
        : "vec3 worldNormal = normalize(vNormal);"
    }

    Surface surface;
    surface.worldPosition = vWorldPosition;
    surface.worldNormal = worldNormal;
    surface.diffuseColor = diffuseMapColor;
    
    Camera camera;
    camera.worldPosition = uViewPosition;
    
    vec4 resultColor = vec4(0, 0, 0, 1);
    
    // directional light
    resultColor = calcDirectionalLight(surface, uDirectionalLight, camera);

    ${receiveShadow ? `resultColor = applyShadow(resultColor, uShadowMap, vShadowMapProjectionUv, uShadowBias, vec4(0., 0., 0., 1.), 0.7);` : ""}

    outColor = resultColor;
}
`;

export class PhongMaterial extends Material {
    constructor(options) {
        const baseUniforms = {
            uDiffuseMap: {
                type: UniformTypes.Texture,
                value: options.diffuseMap,
            },
            uNormalMap: {
                type: UniformTypes.Texture,
                value: options.normalMap,
            },
            ...(options.jointMatrices ? {
                uJointMatrices: {
                    type: UniformTypes.Matrix4Array,
                    value: options.jointMatrices
                }
            } : {}),
            uDirectionalLight: {}
        };

        const isSkinning = !!baseUniforms.uJointMatrices;
        const useNormalMap = !!baseUniforms.uNormalMap;
        const vertexShader = generateVertexShader({
            isSkinning: isSkinning,
            jointNum: isSkinning ? baseUniforms.uJointMatrices.value.length : null,
            receiveShadow: options.receiveShadow,
            useNormalMap
        });
        const fragmentShader = generateFragmentShader({
            receiveShadow: options.receiveShadow,
            useNormalMap,
        });
        
        const uniforms = { ...baseUniforms, ...(options.uniforms ?  options.uniforms : {})};

        super({ ...options, vertexShader, fragmentShader, uniforms} );
    }
}