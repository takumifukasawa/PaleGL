#version 300 es

precision highp float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uDepthTexture;
uniform sampler2D uGBufferATexture;
uniform sampler2D uGBufferBTexture;
uniform sampler2D uGBufferCTexture;
uniform sampler2D uDirectionalLightShadowMap;
uniform sampler2D uAmbientOcclusionTexture;
uniform sampler2D uLightShaftTexture;
uniform sampler2D uFogTexture;
uniform float uNearClip;
uniform float uFarClip;
uniform float uShowGBuffer;
uniform mat4 uInverseViewProjectionMatrix;

#pragma DEPTH_FUNCTIONS

#include ./partial/gbuffer-functions.glsl

float isArea(vec2 uv) {
    return step(0., uv.x) * (1. - step(1., uv.x)) * step(0., uv.y) * (1. - step(1., uv.y));
}

int bitShift(int data, int order) {
    return data >> order;
}

void main() {
    vec2 tiling = vec2(4.);
    vec2 gBufferAUV = vUv * tiling + vec2(0., -3.);
    vec2 gBufferBUV = vUv * tiling + vec2(-1., -3.);
    vec2 gBufferCUV = vUv * tiling + vec2(-2., -3.);
    vec2 depthUV = vUv * tiling + vec2(-3., -3.);
    vec2 worldPositionUV = vUv * tiling + vec2(0., -2.);
    vec2 directionalLightShadowMapUV = vUv * tiling + vec2(-1., -2.);
    vec2 aoUV = vUv * tiling + vec2(-2., -2.);
    vec2 lightShaftUV = vUv * tiling + vec2(-3., -2.);
    vec2 fogUV = vUv * tiling + vec2(0., -1.);
   
    GBufferA gBufferA = DecodeGBufferA(uGBufferATexture, gBufferAUV);
    GBufferB gBufferB = DecodeGBufferB(uGBufferBTexture, gBufferBUV);
    GBufferC gBufferC = DecodeGBufferC(uGBufferCTexture, gBufferCUV);

    // vec4 gBufferA = texture(uGBufferATexture, gBufferAUV) * isArea(gBufferAUV);
    // vec4 gBufferC = texture(uGBufferCTexture, gBufferCUV) * isArea(gBufferCUV);

    // vec3 baseColor = gBufferA.baseColor;
    // vec4 normalColor = (texture(uGBufferBTexture, gBufferBUV) * 2. - 1.) * isArea(gBufferBUV);

    float rawDepth = texture(uDepthTexture, depthUV).x * isArea(depthUV);
    // float sceneDepth = viewZToLinearDepth(z, uNearClip, uFarClip);
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip) * isArea(depthUV);

    vec3 worldPosition = reconstructWorldPositionFromDepth(
        worldPositionUV,
        texture(uDepthTexture, worldPositionUV).x,
        uInverseViewProjectionMatrix
    ) * isArea(worldPositionUV);

    vec4 directionalShadowMapColor = texture(uDirectionalLightShadowMap, directionalLightShadowMapUV) * isArea(directionalLightShadowMapUV);
    vec4 aoColor = texture(uAmbientOcclusionTexture, aoUV) * isArea(aoUV);

    vec4 lightShaftColor = texture(uLightShaftTexture, lightShaftUV);
    vec4 fogColor = texture(uFogTexture, fogUV);

    // test bit
    // float roughness = gBufferA.a;
    // int packedA = int(gBufferA.a * 255.);
    // int packedRoughnessInt = 15 & 15;
    // float packedRoughnessFloat = float(packedRoughnessInt);
    // // outColor = vec4(vec3(roughness), 1.);
    // outColor = vec4(vec3(packedRoughnessFloat), 1.) * isArea(gBufferAUV);
    // return;
    
    outColor =
        vec4(gBufferA.baseColor, 1.) * isArea(gBufferAUV) +
        vec4(gBufferB.normal, 1.) * isArea(gBufferBUV) +
        vec4(gBufferC.metallic, gBufferC.roughness, 0., 1.) * isArea(gBufferCUV) +
        // normalColor +
        // gBufferC +
        sceneDepth +
        directionalShadowMapColor +
        vec4(worldPosition, 1.) +
        aoColor +
        vec4(lightShaftColor.rgb, 1.) * isArea(lightShaftUV) +
        vec4(fogColor.rgb, 1.) * isArea(fogUV);
}
