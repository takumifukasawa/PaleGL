#version 300 es

precision highp float;

#pragma DEFINES

// TODO: spot light の最大数はどこかで定数管理したい
#define MAX_SPOT_LIGHT_COUNT 4

struct SpotLight {
    mat4 lightViewProjectionMatrix;
};

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uDepthTexture; // camera depth
uniform sampler2D uGBufferATexture;
uniform vec3 uViewPosition;
uniform float uNearClip;
uniform float uFarClip;
uniform mat4 uTransposeInverseViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uInverseViewProjectionMatrix;
uniform mat4 uInverseViewMatrix;
uniform mat4 uInverseProjectionMatrix;
uniform float uBlendRate;
uniform float uTime;

uniform SpotLight uSpotLight[MAX_SPOT_LIGHT_COUNT];
uniform sampler2D uSpotLightShadowMap[MAX_SPOT_LIGHT_COUNT];
uniform float uDensityMultiplier;
uniform float uRayStep;
uniform float uRayJitterSizeX;
uniform float uRayJitterSizeY;

#include ./partial/depth-functions.glsl

#include ./partial/gbuffer-functions.glsl

// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float noise(vec2 seed)
{
    return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 uv = vUv;

    float jitter = noise(uv + uTime) * 2. - 1.;

    vec2 jitterOffset = vec2(
        jitter * uRayJitterSizeX,
        jitter * uRayJitterSizeY
    );

    // outColor = vec4(vUv, 1., 1.);
    // outColor = texture(uGBufferATexture, vUv);
    GBufferA gBufferA = DecodeGBufferA(texture(uGBufferATexture, uv));
    // float rawDepth = texture(uSpotLightShadowMap[0], uv).r;
    float rawDepth = texture(uDepthTexture, uv).r;

    // geometry
    vec3 worldPosition = reconstructWorldPositionFromDepth(uv, rawDepth, uInverseViewProjectionMatrix);

    vec3 vpos = vec3(uv * 2. - 1., 1.);
    vec3 viewDir = (uInverseProjectionMatrix * vpos.xyzz * uFarClip).xyz;
    
    vec3 viewDirInWorld = (uInverseViewMatrix * vec4(viewDir, 0.)).xyz;
    // float viewDirInWorldLength = length(viewDirInWorld);
    
    vec3 rayOrigin = uViewPosition + vec3(jitterOffset, 0.);
    vec3 rayDir = normalize(viewDirInWorld);

    vec3 rayPos = vec3(0.);
    float distane = 0.;
    float rayStep = 0.;
    
    float transmittance = 0.;
    float fog = 1.;
    
    // outColor = texture(uSpotLightShadowMap[0], vUv);
    // return;

    for(int i = 0; i < 64; i++) {
        vec3 rayPos = rayOrigin + rayDir * rayStep;
        vec4 shadowPos = uSpotLight[0].lightViewProjectionMatrix * vec4(rayPos, 1.);
        vec2 shadowCoord = shadowPos.xy / shadowPos.w;
        shadowCoord.xy = shadowCoord.xy * .5 + .5;
        float shadowZ = shadowPos.z / shadowPos.w;
        float shadowDepth = texture(uSpotLightShadowMap[0], shadowCoord).r;
        float isShadowArea = 
            0. < shadowCoord.x && shadowCoord.x < 1. &&
            0. < shadowCoord.y && shadowCoord.y < 1. &&
            0. < shadowZ && shadowZ < 1. ? 1. : 0.;
        
        // if(isShadowArea < .5 || shadowDepth >= .999 || shadowDepth > shadowZ) {
        if(isShadowArea > .5 && shadowZ < shadowDepth) {
            // fog -= (1. / 64.);
            // transmittance += (1. / 64.);
            float density = uDensityMultiplier;
            transmittance += exp(-density);
        }
        
        // if(shadowDepth > 1. - shadowZ) {
        //     // float density = uDensityMultiplier;
        //     float density = .01;
        //     transmittance += exp(-density);
        //     
        //     // if(transmittance < .01) {
        //     //     break;
        //     // }
        // }
        rayStep += uRayStep;
    }
    
    transmittance = clamp(transmittance, 0., 1.);
    // fog = clamp(fog, 0., 1.);
   
    outColor = vec4(vec3(transmittance), 1.);
    // outColor = vec4(vec3(fog), 1.);
}
