#include <common>
#include <buffer_visualizer_h>
#include <lighting>
#include <depth>
#include <gbuffer>

in vec2 vUv;

out vec4 outColor;

uniform vec2 uWorldPositionUvOffset;
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

int fBitShift(int data, int order) {
    return data >> order;
}

void main() {
    vec2 tiling = uTiling;
    
    vec2 gBufferAUv = vUv * tiling + uGBufferATextureUvOffset;
    vec2 gBufferBUv = vUv * tiling + uGBufferBTextureUvOffset;
    vec2 gBufferCUv = vUv * tiling + uGBufferCTextureUvOffset;
    vec2 gBufferDUv = vUv * tiling + uGBufferDTextureUvOffset;
    vec2 depthUv = vUv * tiling + uDepthTextureUvOffset;
    vec2 worldPositionUv = vUv * tiling + uWorldPositionUvOffset;
  
    sGBufferA gBufferA = fDecodeGBufferA(uGBufferATexture, gBufferAUv);
    sGBufferB gBufferB = fDecodeGBufferB(uGBufferBTexture, gBufferBUv);
    sGBufferC gBufferC = fDecodeGBufferC(uGBufferCTexture, gBufferCUv);
    sGBufferD gBufferD = fDecodeGBufferD(uGBufferDTexture, gBufferDUv);

    float rawDepth = texture(uDepthTexture, depthUv).x * fIsArea(depthUv);
    float sceneDepth = fPerspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);

    vec3 worldPosition = fReconstructWorldPositionFromDepth(
        worldPositionUv,
        texture(uDepthTexture, worldPositionUv).x,
        uInverseViewProjectionMatrix
    );

    vec4 gBufferAColor = fCalcAreaColor(vec4(gBufferA.smBaseColor, 1.), vUv, tiling, uGBufferATextureUvOffset);
    vec4 gBufferBColor = fCalcAreaColor(vec4(gBufferB.smNormal, 1.), vUv, tiling, uGBufferBTextureUvOffset);
    vec4 gBufferCColor = fCalcAreaColor(vec4(gBufferC.smMetallic, gBufferC.smRoughness, 0., 1.), vUv, tiling, uGBufferCTextureUvOffset);
    vec4 gBufferDColor = fCalcAreaColor(vec4(gBufferD.smEmissiveColor, 1.), vUv, tiling, uGBufferDTextureUvOffset);
    vec4 depthColor = fCalcAreaColor(vec4(sceneDepth), vUv, tiling, uDepthTextureUvOffset);
    vec4 worldPositionColor = fCalcAreaColor(vec4(worldPosition, 1.), vUv, tiling, uWorldPositionUvOffset);
    vec4 directionalShadowMapColor = fCalcTextureAreaColor(uDirectionalLightShadowMap, vUv, tiling, uDirectionalLightShadowMapUvOffset);
    vec4 spotLight0ShadowMapColor = fCalcTextureAreaColor(uSpotLightShadowMap0, vUv, tiling, uSpotLightShadowMap0UvOffset);
    vec4 spotLight1ShadowMapColor = fCalcTextureAreaColor(uSpotLightShadowMap1, vUv, tiling, uSpotLightShadowMap1UvOffset);
    vec4 spotLight2ShadowMapColor = fCalcTextureAreaColor(uSpotLightShadowMap2, vUv, tiling, uSpotLightShadowMap2UvOffset);
    vec4 spotLight3ShadowMapColor = fCalcTextureAreaColor(uSpotLightShadowMap3, vUv, tiling, uSpotLightShadowMap3UvOffset);
    vec4 aoColor = fCalcTextureAreaColor(uAmbientOcclusionTexture, vUv, tiling, uAmbientOcclusionTextureUvOffset);
    vec4 deferredShadingColor = fCalcTextureAreaColor(uDeferredShadingTexture, vUv, tiling, uDeferredShadingTextureUvOffset);
    vec4 lightShaftColor = fCalcTextureAreaColor(uLightShaftTexture, vUv, tiling, uLightShaftTextureUvOffset);
    vec4 volumetricLightColor = fCalcTextureAreaColor(uVolumetricLightTexture, vUv, tiling, uVolumetricLightTextureUvOffset);
    vec4 fogColor = fCalcTextureAreaColor(uFogTexture, vUv, tiling, uFogTextureUvOffset);
    vec4 dofColor = fCalcTextureAreaColor(uDepthOfFieldTexture, vUv, tiling, uDepthOfFieldTextureUvOffset);
    vec4 bloomColor = fCalcTextureAreaColor(uBloomTexture, vUv, tiling, uBloomTextureUvOffset);
    
    outColor =
        gBufferAColor
        + gBufferBColor
        + gBufferCColor
        + gBufferDColor
        + depthColor
        + worldPositionColor
        + directionalShadowMapColor
        + spotLight0ShadowMapColor
        + spotLight1ShadowMapColor
        + spotLight2ShadowMapColor
        // + spotLight3ShadowMapColor
        + aoColor
        + deferredShadingColor
        + lightShaftColor
        + volumetricLightColor
        + fogColor
        + dofColor
        + bloomColor;
}
