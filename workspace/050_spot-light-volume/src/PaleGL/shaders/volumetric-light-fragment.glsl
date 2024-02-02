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

uniform sampler2D uDepthTexture;
uniform sampler2D uGBufferATexture;
uniform float uNearClip;
uniform float uFarClip;
uniform mat4 uTransposeInverseViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uInverseViewProjectionMatrix;
uniform mat4 uInverseProjectionMatrix;
uniform float uBlendRate;
uniform SpotLight uSpotLight[MAX_SPOT_LIGHT_COUNT];
uniform sampler2D uSpotLightShadowMap[MAX_SPOT_LIGHT_COUNT];

// #pragma DEPTH_FUNCTIONS
#include ./partial/depth-functions.glsl

void main() {
    // outColor = vec4(vUv, 1., 1.);
    // outColor = texture(uGBufferATexture, vUv);
    outColor = texture(uSpotLightShadowMap[0], vUv);
}
