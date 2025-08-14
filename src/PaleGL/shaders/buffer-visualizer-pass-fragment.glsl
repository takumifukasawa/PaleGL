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

int bitShift(int data, int order) {
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
  
    GBufferA gBufferA = DecodeGBufferA(uGBufferATexture, gBufferAUv);
    GBufferB gBufferB = DecodeGBufferB(uGBufferBTexture, gBufferBUv);
    GBufferC gBufferC = DecodeGBufferC(uGBufferCTexture, gBufferCUv);
    GBufferD gBufferD = DecodeGBufferD(uGBufferDTexture, gBufferDUv);

    float rawDepth = texture(uDepthTexture, depthUv).x * isArea(depthUv);
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);

    vec3 worldPosition = reconstructWorldPositionFromDepth(
        worldPositionUv,
        texture(uDepthTexture, worldPositionUv).x,
        uInverseViewProjectionMatrix
    );

    vec4 gBufferAColor = calcAreaColor(vec4(gBufferA.baseColor, 1.), vUv, tiling, uGBufferATextureUvOffset);
    vec4 gBufferBColor = calcAreaColor(vec4(gBufferB.normal, 1.), vUv, tiling, uGBufferBTextureUvOffset);
    vec4 gBufferCColor = calcAreaColor(vec4(gBufferC.metallic, gBufferC.roughness, 0., 1.), vUv, tiling, uGBufferCTextureUvOffset);
    vec4 gBufferDColor = calcAreaColor(vec4(gBufferD.emissiveColor, 1.), vUv, tiling, uGBufferDTextureUvOffset);
    vec4 depthColor = calcAreaColor(vec4(sceneDepth), vUv, tiling, uDepthTextureUvOffset);
    vec4 worldPositionColor = calcAreaColor(vec4(worldPosition, 1.), vUv, tiling, uWorldPositionUvOffset);
    vec4 directionalShadowMapColor = calcTextureAreaColor(uDirectionalLightShadowMap, vUv, tiling, uDirectionalLightShadowMapUvOffset);
    vec4 spotLight0ShadowMapColor = calcTextureAreaColor(uSpotLightShadowMap0, vUv, tiling, uSpotLightShadowMap0UvOffset);
    vec4 spotLight1ShadowMapColor = calcTextureAreaColor(uSpotLightShadowMap1, vUv, tiling, uSpotLightShadowMap1UvOffset);
    vec4 spotLight2ShadowMapColor = calcTextureAreaColor(uSpotLightShadowMap2, vUv, tiling, uSpotLightShadowMap2UvOffset);
    vec4 spotLight3ShadowMapColor = calcTextureAreaColor(uSpotLightShadowMap3, vUv, tiling, uSpotLightShadowMap3UvOffset);
    vec4 aoColor = calcTextureAreaColor(uAmbientOcclusionTexture, vUv, tiling, uAmbientOcclusionTextureUvOffset);
    vec4 deferredShadingColor = calcTextureAreaColor(uDeferredShadingTexture, vUv, tiling, uDeferredShadingTextureUvOffset);
    vec4 lightShaftColor = calcTextureAreaColor(uLightShaftTexture, vUv, tiling, uLightShaftTextureUvOffset);
    vec4 volumetricLightColor = calcTextureAreaColor(uVolumetricLightTexture, vUv, tiling, uVolumetricLightTextureUvOffset);
    vec4 fogColor = calcTextureAreaColor(uFogTexture, vUv, tiling, uFogTextureUvOffset);
    vec4 dofColor = calcTextureAreaColor(uDepthOfFieldTexture, vUv, tiling, uDepthOfFieldTextureUvOffset);
    vec4 bloomColor = calcTextureAreaColor(uBloomTexture, vUv, tiling, uBloomTextureUvOffset);
    
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
