#version 300 es

precision mediump float;

#pragma DEFINES

uniform vec4 uDiffuseColor;
uniform sampler2D uDiffuseMap; 
uniform vec2 uDiffuseMapUvScale;
uniform float uSpecularAmount;
uniform samplerCube uEnvMap;
uniform float uAmbientAmount;

#include ./partial/fragment-normal-map-uniforms.glsl

#include ./partial/fragment-receive-shadow-uniforms.glsl

uniform vec3 uViewPosition;

#include ./partial/fragment-alpha-test-uniforms.glsl

#include ./partial/directional-light-struct.glsl
#include ./partial/directional-light-uniforms.glsl

struct Surface {
    vec3 worldNormal;
    vec3 worldPosition;
    vec4 diffuseColor;
    float specularAmount;
};

#include ./partial/camera-struct.glsl

in vec2 vUv;
in vec3 vNormal;

#include ./partial/fragment-receive-shadow-varyings.glsl

#include ./partial/fragment-normal-map-varyings.glsl

in vec3 vWorldPosition;

#include ./partial/fragment-vertex-color-varyings.glsl

// out vec4 outColor;
layout (location = 0) out vec4 outBaseColor;
layout (location = 1) out vec4 outNormalColor;

vec4 calcDirectionalLight(Surface surface, DirectionalLight directionalLight, Camera camera) {
    vec3 N = normalize(surface.worldNormal);
    vec3 L = normalize(directionalLight.direction);
    
    // lambert
    float diffuseRate = clamp(dot(N, L), 0., 1.);
    // half lambert
    // float diffuseRate = clamp(dot(N, L), 0., 1.) * .5 + .5;
    // original lambert
    // float diffuseRate = clamp(dot(N, L), 0., 1.) * .9 + .1;
    
    vec3 diffuseColor = surface.diffuseColor.xyz * diffuseRate * uDirectionalLight.intensity * directionalLight.color.xyz;

    vec3 P = surface.worldPosition;
    vec3 E = camera.worldPosition;
    vec3 PtoL = L; // for directional light
    vec3 PtoE = normalize(E - P);
    vec3 H = normalize(PtoL + PtoE);
    // TODO: surfaceに持たせる
    float specularPower = 32.;
    float specularRate = clamp(dot(H, N), 0., 1.);
    specularRate = pow(specularRate, specularPower) * surface.specularAmount;
    vec3 specularColor = specularRate * directionalLight.intensity * directionalLight.color.xyz;

    vec4 resultColor = vec4(
        diffuseColor + specularColor,
        surface.diffuseColor.a
    );
    
    return resultColor;
}

#ifdef USE_NORMAL_MAP
vec3 calcNormal(vec3 normal, vec3 tangent, vec3 binormal, sampler2D normalMap, vec2 uv) {
    vec3 n = normalize(normal);
    vec3 t = normalize(tangent);
    vec3 b = normalize(binormal);
    mat3 tbn = mat3(t, b, n);
    vec3 nt = texture(normalMap, uv).xyz;
    nt = nt * 2. - 1.;

    // 2: normal from normal map
    vec3 resultNormal = normalize(tbn * nt);
    // blend mesh normal ~ normal map
    // vec3 normal = mix(normal, normalize(tbn * nt));
    // vec3 normal = mix(normal, normalize(tbn * nt), 1.);

    return resultNormal;
}
#endif

#ifdef USE_RECEIVE_SHADOW
vec4 applyShadow(vec4 surfaceColor, sampler2D shadowMap, vec4 shadowMapUv, float shadowBias, vec4 shadowColor, float shadowBlendRate) {
    vec3 projectionUv = shadowMapUv.xyz / shadowMapUv.w;
    vec4 projectionShadowColor = texture(shadowMap, projectionUv.xy);
    float sceneDepth = projectionShadowColor.r;
    float depthFromLight = projectionUv.z;
    float shadowOccluded = clamp(step(0., depthFromLight - sceneDepth - shadowBias), 0., 1.);
    float shadowAreaRect =
        step(0., projectionUv.x) * (1. - step(1., projectionUv.x)) *
        step(0., projectionUv.y) * (1. - step(1., projectionUv.y)) *
        step(0., projectionUv.z) * (1. - step(1., projectionUv.z));
    float shadowRate = shadowOccluded * shadowAreaRect;
    
    vec4 resultColor = vec4(1.);
    resultColor.xyz = mix(
       surfaceColor.xyz,
       mix(surfaceColor.xyz, shadowColor.xyz, shadowBlendRate),
       shadowRate
    );
    resultColor.a = surfaceColor.a;

    return resultColor;
}
#endif

#ifdef USE_ALPHA_TEST
void checkAlphaTest(float value, float threshold) {
    if(value < threshold) {
        discard;
    }
}
#endif

#include ./partial/fragment-env-map-functions.glsl

mat2 rotate(float r) {
    float c = cos(r);
    float s = sin(r);
    return mat2(c, s, -s, c);
}

void main() {
    vec2 uv = vUv * uDiffuseMapUvScale;
   
    vec4 diffuseMapColor = texture(uDiffuseMap, uv);
   
    vec3 worldNormal = vNormal;
   
#ifdef USE_NORMAL_MAP
    worldNormal = calcNormal(vNormal, vTangent, vBinormal, uNormalMap, uv);
#else
    worldNormal = normalize(vNormal);
#endif  

    Surface surface;
    surface.worldPosition = vWorldPosition;
    surface.worldNormal = worldNormal;
    
#ifdef USE_VERTEX_COLOR
    surface.diffuseColor = vVertexColor * uDiffuseColor * diffuseMapColor;
#else
    surface.diffuseColor = uDiffuseColor * diffuseMapColor;
#endif

    surface.specularAmount = uSpecularAmount;

    Camera camera;
    camera.worldPosition = uViewPosition;
    
    vec4 resultColor = vec4(0, 0, 0, 1);
    
    // directional light
    resultColor = calcDirectionalLight(surface, uDirectionalLight, camera);
        
    // ambient light
#ifdef USE_ENV_MAP
    vec3 envDir = reflect(
        normalize(surface.worldPosition - camera.worldPosition),
        normalize(surface.worldNormal)
    );
    resultColor.xyz += calcEnvMap(uEnvMap, envDir, 0.) * uAmbientAmount;
#endif

#ifdef USE_RECEIVE_SHADOW
    // TODO: apply shadow の中に入れても良さそう
    if(dot(surface.worldNormal, uDirectionalLight.direction) > 0.) {
        resultColor = applyShadow(resultColor, uShadowMap, vShadowMapProjectionUv, uShadowBias, vec4(0., 0., 0., 1.), 0.5);
    }
#endif

#ifdef USE_ALPHA_TEST
    checkAlphaTest(resultColor.a, uAlphaTestThreshold);
#endif

    // correct
    outBaseColor = resultColor;
    outNormalColor = vec4(worldNormal * .5 + .5, 1.); 
}
