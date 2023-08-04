#version 300 es

precision highp float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uDepthTexture;
uniform sampler2D uGBufferATexture;
uniform sampler2D uGBufferBTexture;
uniform sampler2D uDirectionalLightShadowMap;
uniform sampler2D uAmbientOcclusionTexture;
uniform float uNearClip;
uniform float uFarClip;
uniform float uShowGBuffer;
uniform mat4 uInverseViewProjectionMatrix;

#pragma DEPTH_FUNCTIONS

float isArea(vec2 uv) {
    return step(0., uv.x) * (1. - step(1., uv.x)) * step(0., uv.y) * (1. - step(1., uv.y));
}

void main() {
    vec2 depthUV = vUv * 3. + vec2(0., -2.);
    vec2 gBufferAUV = vUv * 3. + vec2(-1., -2.);
    vec2 gBufferBUV = vUv * 3. + vec2(-2., -2.);
    vec2 worldPositionUV = vUv * 3. + vec2(0., -1.);
    vec2 directionalLightShadowMapUV = vUv * 3. + vec2(-1., -1.);
    vec2 aoUV = vUv * 3. + vec2(-2., -1.);
    
    vec4 baseColor = texture(uGBufferATexture, gBufferAUV) * isArea(gBufferAUV);
    vec4 normalColor = (texture(uGBufferBTexture, gBufferBUV) * 2. - 1.) * isArea(gBufferBUV);
    
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
    
    outColor =
        baseColor +
        normalColor +
        sceneDepth +
        directionalShadowMapColor +
        vec4(worldPosition, 1.) +
        aoColor;
}
