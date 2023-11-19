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
    vec2 gBufferAUV = vUv * 3. + vec2(0., -2.);
    vec2 gBufferBUV = vUv * 3. + vec2(-1., -2.);
    vec2 gBufferCUV = vUv * 3. + vec2(-2., -2.);
    vec2 depthUV = vUv * 3. + vec2(0., -1.);
    vec2 worldPositionUV = vUv * 3. + vec2(-1, -1.);
    vec2 directionalLightShadowMapUV = vUv * 3. + vec2(-2., -1.);
    vec2 aoUV = vUv * 3. + vec2(0., 0.);
   
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
        aoColor;
}
