#version 300 es

precision highp float;

#include ./defines-light.glsl

in vec2 vUv;

out vec4 outColor;

uniform vec2 uWorldPositionUvOffset;
uniform sampler2D uDepthTexture;
uniform vec2 uDepthTextureUvOffset;
uniform sampler2D uGBufferATexture;
uniform vec2 uGBufferATextureUvOffset;
uniform sampler2D uGBufferBTexture;
uniform vec2 uGBufferBTextureUvOffset;
uniform sampler2D uGBufferCTexture;
uniform vec2 uGBufferCTextureUvOffset;
uniform sampler2D uGBufferDTexture;
uniform vec2 uGBufferDTextureUvOffset;
uniform sampler2D uDirectionalLightShadowMap;
uniform vec2 uDirectionalLightShadowMapUvOffset;
uniform sampler2D uSpotLightShadowMap0;
uniform vec2 uSpotLightShadowMap0UvOffset;
uniform sampler2D uSpotLightShadowMap1;
uniform vec2 uSpotLightShadowMap1UvOffset;
uniform sampler2D uSpotLightShadowMap2;
uniform vec2 uSpotLightShadowMap2UvOffset;
uniform sampler2D uSpotLightShadowMap3;
uniform vec2 uSpotLightShadowMap3UvOffset;
uniform sampler2D uAmbientOcclusionTexture;
uniform vec2 uAmbientOcclusionTextureUvOffset;
uniform sampler2D uDeferredShadingTexture;
uniform vec2 uDeferredShadingTextureUvOffset;
uniform sampler2D uLightShaftTexture;
uniform vec2 uLightShaftTextureUvOffset;
uniform sampler2D uVolumetricLightTexture;
uniform vec2 uVolumetricLightTextureUvOffset;
uniform sampler2D uFogTexture;
uniform vec2 uFogTextureUvOffset;
uniform sampler2D uDepthOfFieldTexture;
uniform vec2 uDepthOfFieldTextureUvOffset;
uniform sampler2D uBloomTexture;
uniform vec2 uBloomTextureUvOffset;
uniform float uNearClip;
uniform float uFarClip;
uniform float uShowGBuffer;
uniform mat4 uInverseViewProjectionMatrix;
uniform vec2 uTiling;

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
    // vec2 tiling = vec2(4.);
    vec2 tiling = uTiling;
    vec2 gBufferAUv = vUv * tiling + uGBufferATextureUvOffset;
    vec2 gBufferBUv = vUv * tiling + uGBufferBTextureUvOffset;
    vec2 gBufferCUv = vUv * tiling + uGBufferCTextureUvOffset;
    vec2 gBufferDUv = vUv * tiling + uGBufferDTextureUvOffset;
    vec2 depthUv = vUv * tiling + uDepthTextureUvOffset;
    vec2 worldPositionUv = vUv * tiling + uWorldPositionUvOffset;
    vec2 directionalLightShadowMapUv = vUv * tiling + uDirectionalLightShadowMapUvOffset;
    vec2 spotLight0ShadowMapUv = vUv * tiling + uSpotLightShadowMap0UvOffset;
    vec2 spotLight1ShadowMapUv = vUv * tiling + uSpotLightShadowMap1UvOffset;
    vec2 spotLight2ShadowMapUv = vUv * tiling + uSpotLightShadowMap2UvOffset;
    vec2 spotLight3ShadowMapUv = vUv * tiling + uSpotLightShadowMap3UvOffset;
    vec2 aoUv = vUv * tiling + uAmbientOcclusionTextureUvOffset;
    vec2 deferredShadingUv = vUv * tiling + uDeferredShadingTextureUvOffset;
    vec2 lightShaftUv = vUv * tiling + uLightShaftTextureUvOffset;
    vec2 volumetricLightUv = vUv * tiling + uVolumetricLightTextureUvOffset;
    vec2 fogUv = vUv * tiling + uFogTextureUvOffset;
    vec2 dofUv = vUv * tiling + uDepthOfFieldTextureUvOffset;
    vec2 bloomUv = vUv * tiling + uBloomTextureUvOffset;
   
    GBufferA gBufferA = DecodeGBufferA(uGBufferATexture, gBufferAUv);
    GBufferB gBufferB = DecodeGBufferB(uGBufferBTexture, gBufferBUv);
    GBufferC gBufferC = DecodeGBufferC(uGBufferCTexture, gBufferCUv);
    GBufferD gBufferD = DecodeGBufferD(uGBufferDTexture, gBufferDUv);

    // vec4 gBufferA = texture(uGBufferATexture, gBufferAUv) * isArea(gBufferAUv);
    // vec4 gBufferC = texture(uGBufferCTexture, gBufferCUv) * isArea(gBufferCUv);

    // vec3 baseColor = gBufferA.baseColor;
    // vec4 normalColor = (texture(uGBufferBTexture, gBufferBUv) * 2. - 1.) * isArea(gBufferBUv);

    float rawDepth = texture(uDepthTexture, depthUv).x * isArea(depthUv);
    // float sceneDepth = viewZToLinearDepth(z, uNearClip, uFarClip);
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);

    vec3 worldPosition = reconstructWorldPositionFromDepth(
        worldPositionUv,
        texture(uDepthTexture, worldPositionUv).x,
        uInverseViewProjectionMatrix
    );

    vec4 directionalShadowMapColor = texture(uDirectionalLightShadowMap, directionalLightShadowMapUv);
    vec4 spotLight0ShadowMapColor = texture(uSpotLightShadowMap0, spotLight0ShadowMapUv);
    vec4 spotLight1ShadowMapColor = texture(uSpotLightShadowMap1, spotLight1ShadowMapUv);
    vec4 spotLight2ShadowMapColor = texture(uSpotLightShadowMap2, spotLight2ShadowMapUv);
    vec4 spotLight3ShadowMapColor = texture(uSpotLightShadowMap3, spotLight3ShadowMapUv);
    vec4 aoColor = texture(uAmbientOcclusionTexture, aoUv);
    vec4 deferredShadingColor = texture(uDeferredShadingTexture, deferredShadingUv);
    vec4 lightShaftColor = texture(uLightShaftTexture, lightShaftUv);
    vec4 volumetricLightColor = texture(uVolumetricLightTexture, volumetricLightUv);
    vec4 fogColor = texture(uFogTexture, fogUv);
    vec4 dofColor = texture(uDepthOfFieldTexture, dofUv);
    vec4 bloomColor = texture(uBloomTexture, bloomUv);

    // test bit
    // float roughness = gBufferA.a;
    // int packedA = int(gBufferA.a * 255.);
    // int packedRoughnessInt = 15 & 15;
    // float packedRoughnessFloat = float(packedRoughnessInt);
    // // outColor = vec4(vec3(roughness), 1.);
    // outColor = vec4(vec3(packedRoughnessFloat), 1.) * isArea(gBufferAUv);
    // return;
    
    outColor =
        vec4(gBufferA.baseColor, 1.) * isArea(gBufferAUv)
        + vec4(gBufferB.normal, 1.) * isArea(gBufferBUv)
        + vec4(gBufferC.metallic, gBufferC.roughness, 0., 1.) * isArea(gBufferCUv)
        + vec4(gBufferD.emissiveColor, 1.) * isArea(gBufferDUv) 
        // // normalColor +
        // // gBufferC +
        + sceneDepth * isArea(depthUv)
        + vec4(worldPosition, 1.) * isArea(worldPositionUv)
        + directionalShadowMapColor * isArea(directionalLightShadowMapUv)
        + spotLight0ShadowMapColor * isArea(spotLight0ShadowMapUv)
        + spotLight1ShadowMapColor * isArea(spotLight1ShadowMapUv)
        + spotLight2ShadowMapColor * isArea(spotLight2ShadowMapUv)
        // + spotLight3ShadowMapColor * isArea(spotLight3ShadowMapUv)
        + aoColor * isArea(aoUv)
        + vec4(deferredShadingColor.rgb, 1.) * isArea(deferredShadingUv)
        + vec4(lightShaftColor.rgb, 1.) * isArea(lightShaftUv)
        + vec4(volumetricLightColor.rgb, 1.) * isArea(volumetricLightUv)
        + vec4(fogColor.rgb, 1.) * isArea(fogUv)
        + vec4(dofColor.rgb, 1.) * isArea(dofUv)
        + vec4(bloomColor.rgb, 1.) * isArea(bloomUv);
}
