#version 300 es

precision mediump float;

#pragma DEFINES

// -----------------------------------------------------------
// struct
// -----------------------------------------------------------


#include ./partial/directional-light-struct.glsl

#include ./partial/camera-struct.glsl

struct Surface {
    vec3 worldNormal;
    vec3 worldPosition;
    vec4 diffuseColor;
    float specularAmount;
};

// -----------------------------------------------------------
// functions
// -----------------------------------------------------------

#pragma DEPTH_FUNCTIONS

#include ./partial/env-map-fragment-functions.glsl

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


// -----------------------------------------------------------
// varyings
// -----------------------------------------------------------

in vec2 vUv;
#include ./partial/receive-shadow-fragment-varyings.glsl

// -----------------------------------------------------------
// uniforms
// -----------------------------------------------------------

#include ./partial/directional-light-uniforms.glsl
#include ./partial/receive-shadow-fragment-uniforms.glsl

#ifdef USE_RECEIVE_SHADOW
uniform mat4 uShadowMapProjectionMatrix;
#endif

uniform vec3 uViewPosition;

// TODO
// uniform sampler2D uAOTexture; 
uniform sampler2D uGBufferATexture;
uniform sampler2D uGBufferBTexture;
uniform sampler2D uDepthTexture;
// uniform sampler2D uShadowMap;
uniform samplerCube uEnvMap;

uniform float uNearClip;
uniform float uFarClip;

uniform float uTime;

uniform mat4 uInverseViewProjectionMatrix;
        
layout (location = 0) out vec4 outColor;

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

void main() {
    float eps = .0001; 

    vec2 uv = vUv;

    vec4 baseColor = texture(uGBufferATexture, uv);
   
    vec3 worldNormal = texture(uGBufferBTexture, uv).xyz * 2. - 1.;
   
    float rawDepth = texture(uDepthTexture, uv).r; 
    float depth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    
    // depth guard
    if(step(rawDepth, 1. - eps) < .5) {
        outColor = baseColor;
        return;
    }

    vec3 worldPosition = reconstructWorldPositionFromDepth(uv, rawDepth, uInverseViewProjectionMatrix);

    outColor = vec4(worldPosition, 1.);
    // outColor = vec4(vec3(depth), 1.);
    // outColor = vec4(mod(uTime, 1.), 1., 1., 1.);
    outColor = vec4(uViewPosition, 1.);

    Surface surface;
    surface.worldPosition = worldPosition;
    surface.worldNormal = worldNormal;
    surface.diffuseColor = baseColor;
   
    // TODO: bufferから引っ張ってくる
    surface.specularAmount = .5;

    Camera camera;
    camera.worldPosition = uViewPosition;
    
    vec4 resultColor = vec4(0, 0, 0, 1);
    
    // directional light
    resultColor = calcDirectionalLight(surface, uDirectionalLight, camera);
   
    // outColor = resultColor;
    // outColor.xyz = worldNormal;
    // return;
    
    // ambient light
#ifdef USE_ENV_MAP
    vec3 envDir = reflect(
        normalize(surface.worldPosition - camera.worldPosition),
        normalize(surface.worldNormal)
    );
    // TODO: bufferからか何かしらで引っ張ってくる
    float uAmbientAmount = .2;
    resultColor.xyz += calcEnvMap(uEnvMap, envDir, 0.) * uAmbientAmount;
#endif

#ifdef USE_RECEIVE_SHADOW
    vec4 shadowMapProjectionUv = uShadowMapProjectionMatrix * vec4(worldPosition, 1.);
    // TODO: apply shadow の中に入れても良さそう
    if(dot(surface.worldNormal, uDirectionalLight.direction) > 0.) {
        resultColor = applyShadow(resultColor, uShadowMap, shadowMapProjectionUv, uShadowBias, vec4(0., 0., 0., 1.), 0.5);
    }
#endif

    // vec4 shadowColor = texture(uShadowMap, uv);
    // // outColor = shadowColor;
    // // outColor = vec4(shadowColor.xxx, 1.);
    // resultColor = applyShadow(resultColor, uShadowMap, vShadowMapProjectionUv, uShadowBias, vec4(0., 0., 0., 1.), 0.5);

    // correct
    outColor = resultColor;
}
