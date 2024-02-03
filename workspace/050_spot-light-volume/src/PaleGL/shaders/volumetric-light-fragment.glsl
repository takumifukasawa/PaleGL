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

uniform SpotLight uSpotLight[MAX_SPOT_LIGHT_COUNT];
uniform sampler2D uSpotLightShadowMap[MAX_SPOT_LIGHT_COUNT];
uniform float uRayStep;
uniform float uDensityMultiplier;

#include ./partial/depth-functions.glsl

#include ./partial/gbuffer-functions.glsl

void main() {
    vec2 uv = vUv;
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
    
    vec3 rayOrigin = uViewPosition;
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
        if(shadowDepth > shadowZ) {
            fog -= (1. / 64.);
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
    fog = clamp(fog, 0., 1.);
   
    outColor = vec4(vec3(transmittance), 1.);
    outColor = vec4(vec3(fog), 1.);

    // outColor = vec4(viewDirInWorld, 1.);
    // outColor = vec4(mix(texture(uGBufferATexture, uv).xyz, viewDirInWorld.xyz, .1), 1.);
}
