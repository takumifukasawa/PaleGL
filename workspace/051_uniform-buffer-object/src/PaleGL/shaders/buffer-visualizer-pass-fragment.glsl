#version 300 es

precision highp float;

#include ./defines-light.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uDepthTexture;
uniform sampler2D uGBufferATexture;
uniform sampler2D uGBufferBTexture;
uniform sampler2D uGBufferCTexture;
uniform sampler2D uGBufferDTexture;
uniform sampler2D uDirectionalLightShadowMap;
uniform sampler2D uSpotLightShadowMap[MAX_SPOT_LIGHT_COUNT];
uniform sampler2D uAmbientOcclusionTexture;
uniform sampler2D uDeferredShadingTexture;
uniform sampler2D uLightShaftTexture;
uniform sampler2D uVolumetricLightTexture;
uniform sampler2D uDepthOfFieldTexture;
uniform sampler2D uFogTexture;
uniform float uNearClip;
uniform float uFarClip;
uniform float uShowGBuffer;
uniform mat4 uInverseViewProjectionMatrix;

// #pragma DEPTH_FUNCTIONS
#include ./partial/depth-functions.glsl

#include ./partial/gbuffer-functions.glsl

float isArea(vec2 uv) {
    return step(0., uv.x) * (1. - step(1., uv.x)) * step(0., uv.y) * (1. - step(1., uv.y));
}

int bitShift(int data, int order) {
    return data >> order;
}

void main() {
    vec2 tiling = vec2(4.);
    // row: 0
    vec2 gBufferAUV = vUv * tiling + vec2(0., -3.);
    vec2 gBufferBUV = vUv * tiling + vec2(-1., -3.);
    vec2 gBufferCUV = vUv * tiling + vec2(-2., -3.);
    vec2 gBufferDUV = vUv * tiling + vec2(-3., -3.);
    // row: 1
    vec2 depthUV = vUv * tiling + vec2(0., -2.);
    vec2 worldPositionUV = vUv * tiling + vec2(-1., -2.);
    vec2 directionalLightShadowMapUV = vUv * tiling + vec2(-2., -2.);
    vec2 spotLight1ShadowMapUV = vUv * tiling * vec2(2.) + vec2(-6., -5.);
    vec2 spotLight2ShadowMapUV = vUv * tiling * vec2(2.) + vec2(-7., -5.);
    vec2 spotLight3ShadowMapUV = vUv * tiling * vec2(2.) + vec2(-6., -4.);
    vec2 spotLight4ShadowMapUV = vUv * tiling * vec2(2.) + vec2(-7., -4.);
    // row: 2
    vec2 aoUV = vUv * tiling + vec2(0., -1.);
    vec2 deferredShadingUV = vUv * tiling + vec2(-1., -1.);
    vec2 lightShaftUV = vUv * tiling + vec2(-2., -1.);
    vec2 volumetricLightUV = vUv * tiling + vec2(-3., -1.);
    // row: 3
    vec2 fogUV = vUv * tiling + vec2(0., 0.);
    vec2 dofUV = vUv * tiling + vec2(-1., 0.);
    
   
    GBufferA gBufferA = DecodeGBufferA(uGBufferATexture, gBufferAUV);
    GBufferB gBufferB = DecodeGBufferB(uGBufferBTexture, gBufferBUV);
    GBufferC gBufferC = DecodeGBufferC(uGBufferCTexture, gBufferCUV);
    GBufferD gBufferD = DecodeGBufferD(uGBufferDTexture, gBufferDUV);

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
    );

    vec4 directionalShadowMapColor = texture(uDirectionalLightShadowMap, directionalLightShadowMapUV) * isArea(directionalLightShadowMapUV);
    vec4 spotLight1ShadowMapColor = texture(uSpotLightShadowMap[0], spotLight1ShadowMapUV) * isArea(spotLight1ShadowMapUV);
    vec4 spotLight2ShadowMapColor = texture(uSpotLightShadowMap[1], spotLight2ShadowMapUV) * isArea(spotLight2ShadowMapUV);
    vec4 spotLight3ShadowMapColor = texture(uSpotLightShadowMap[2], spotLight3ShadowMapUV) * isArea(spotLight3ShadowMapUV);
    vec4 spotLight4ShadowMapColor = texture(uSpotLightShadowMap[3], spotLight4ShadowMapUV) * isArea(spotLight4ShadowMapUV);
    vec4 aoColor = texture(uAmbientOcclusionTexture, aoUV) * isArea(aoUV);
    vec4 deferredShadingColor = texture(uDeferredShadingTexture, deferredShadingUV);
    vec4 lightShaftColor = texture(uLightShaftTexture, lightShaftUV);
    vec4 volumetricLightColor = texture(uVolumetricLightTexture, volumetricLightUV);
    vec4 fogColor = texture(uFogTexture, fogUV);
    vec4 dofColor = texture(uDepthOfFieldTexture, dofUV);

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
        vec4(gBufferD.emissiveColor, 1.) * isArea(gBufferDUV) +
        // normalColor +
        // gBufferC +
        sceneDepth +
        directionalShadowMapColor +
        spotLight1ShadowMapColor +
        spotLight2ShadowMapColor +
        spotLight3ShadowMapColor +
        spotLight4ShadowMapColor +
        vec4(worldPosition, 1.) * isArea(worldPositionUV) +
        aoColor +
        vec4(deferredShadingColor.rgb, 1.) * isArea(deferredShadingUV) +
        vec4(lightShaftColor.rgb, 1.) * isArea(lightShaftUV) +
        vec4(volumetricLightColor.rgb, 1.) * isArea(volumetricLightUV) +
        vec4(fogColor.rgb, 1.) * isArea(fogUV) +
        vec4(dofColor.rgb, 1.) * isArea(dofUV);
}
