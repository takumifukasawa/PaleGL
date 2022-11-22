
import { Material } from "./Material.js";

const fragmentShader = `#version 300 es

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

void main() {

    vec2 uv = vUv * 1.;
   
    // ------------------------------------------------------- 
    // calc base color
    // ------------------------------------------------------- 
   
    vec4 baseColor = vec4(.1, .1, .1, 1.);
    baseColor = texture(uNormalMap, uv);
    
    vec4 diffuseMapColor = texture(uDiffuseMap, uv);
    
    // ------------------------------------------------------- 
    // calc normal from normal map
    // ------------------------------------------------------- 
  
    vec3 normal = normalize(vNormal);
    vec3 tangent = normalize(vTangent);
    vec3 binormal = normalize(vBinormal);
    mat3 tbn = mat3(tangent, binormal, normal);
    vec3 nt = texture(uNormalMap, uv).xyz;
    nt = nt * 2. - 1.;
    
    // 1: mesh world normal
    // vec3 worldNormal = normal;
    // 2: world normal from normal map
    vec3 worldNormal = normalize(tbn * nt);
    // blend mesh world normal ~ world normal from normal map
    // vec3 worldNormal = mix(normal, normalize(tbn * nt), uNormalStrength);
    
    // ------------------------------------------------------- 
    // directional light
    // ------------------------------------------------------- 
    
    Surface surface;
    surface.worldPosition = vWorldPosition;
    surface.worldNormal = worldNormal;
    surface.diffuseColor = diffuseMapColor;
    
    Camera camera;
    camera.worldPosition = uViewPosition;
    
    vec4 surfaceColor = calcDirectionalLight(surface, uDirectionalLight, camera);
    
    // // vec3 N = normalize(vNormal);
    // vec3 N = normalize(worldNormal);
    // // vec3 N = mix(vNormal, worldNormal * uNormalStrength, uNormalStrength);
    // vec3 L = normalize(uDirectionalLight.direction);
    // float diffuseRate = clamp(dot(N, L), 0., 1.);
    // // vec3 diffuseColor = textureColor.xyz * diffuseRate * uDirectionalLight.intensity * uDirectionalLight.color.xyz;
    // vec3 diffuseColor = diffuseMapColor.xyz * diffuseRate * uDirectionalLight.intensity * uDirectionalLight.color.xyz;

    // vec3 P = vWorldPosition;
    // vec3 E = uViewPosition;
    // vec3 PtoL = L; // for directional light
    // vec3 PtoE = normalize(E - P);
    // vec3 H = normalize(PtoL + PtoE);
    // float specularPower = 16.;
    // float specularRate = clamp(dot(H, N), 0., 1.);
    // specularRate = pow(specularRate, specularPower);
    // vec3 specularColor = specularRate * uDirectionalLight.intensity * uDirectionalLight.color.xyz;

    // vec3 ambientColor = vec3(.1);

    // vec4 surfaceColor = vec4(diffuseColor + specularColor + ambientColor, 1.);
   
    // ------------------------------------------------------- 
    // calc shadow 
    // ------------------------------------------------------- 
    
    vec3 projectionUv = vShadowMapProjectionUv.xyz / vShadowMapProjectionUv.w;
    vec4 projectionShadowColor = texture(uShadowMap, projectionUv.xy);
    float sceneDepth = projectionShadowColor.r;
    float depthFromLight = projectionUv.z;
    float shadowOccluded = clamp(step(0., depthFromLight - sceneDepth - uShadowBias), 0., 1.);
    float shadowAreaRect =
        step(0., projectionUv.x) * (1. - step(1., projectionUv.x)) *
        step(0., projectionUv.y) * (1. - step(1., projectionUv.y)) *
        step(0., projectionUv.z) * (1. - step(1., projectionUv.z));
    float shadowRate = shadowOccluded * shadowAreaRect;
    vec4 shadowColor = vec4(0., 0., 0., 1.);
   
    // ------------------------------------------------------- 
    // blend
    // ------------------------------------------------------- 
    
    vec4 resultColor = mix(
        surfaceColor,
        mix(surfaceColor, shadowColor, .7),
        shadowRate
    );
   
    // check normal 
    // resultColor.xyz = vec3(N.x);
    // resultColor.xyz = vec3(N.y);
    // resultColor.xyz = vec3(N.z);
    
    // outColor = vec4(N, 1.);
    outColor = resultColor;
}
`;

export class PhongMaterial extends Material {
    constructor(options) {
        options.fragmentShader = fragmentShader;
        super(options);
    }
}