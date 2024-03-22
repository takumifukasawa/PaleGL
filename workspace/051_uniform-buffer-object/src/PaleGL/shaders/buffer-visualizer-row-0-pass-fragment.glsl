#version 300 es

precision mediump float;

uniform vec2 uWorldPositionUvOffset;
uniform sampler2D uDepthTexture;
uniform vec2 uDepthTextureUvOffset;

uniform vec2 uTiling;
uniform float uNearClip;
uniform float uFarClip;
uniform mat4 uInverseViewProjectionMatrix;

vec2 vUv;

#include ./partial/depth-functions.glsl

float isArea(vec2 uv) {
    return step(0., uv.x) * (1. - step(1., uv.x)) * step(0., uv.y) * (1. - step(1., uv.y));
}

vec4 calcAreaColor(vec4 color, vec2 uv, vec2 tiling, vec2 offset) {
    return color * isArea(uv * tiling + offset);
}

vec4 calcTextureAreaColor(sampler2D tex, vec2 uv, vec2 tiling, vec2 offset) {
    return calcAreaColor(texture(tex, uv * tiling + offset), uv, tiling, offset);
}

out vec4 outColor;

void main() {
    vec2 tiling = uTiling;

    vec2 depthUv = vUv * tiling + uDepthTextureUvOffset;
    vec2 worldPositionUv = vUv * tiling + uWorldPositionUvOffset;

    float rawDepth = texture(uDepthTexture, depthUv).x * isArea(depthUv);
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);

    vec3 worldPosition = reconstructWorldPositionFromDepth(
        worldPositionUv,
        texture(uDepthTexture, worldPositionUv).x,
        uInverseViewProjectionMatrix
    );

    vec4 depthColor = calcAreaColor(vec4(sceneDepth), vUv, tiling, uDepthTextureUvOffset);
    vec4 worldPositionColor = calcAreaColor(vec4(worldPosition, 1.), vUv, tiling, uWorldPositionUvOffset);

    outColor = depthColor + worldPositionColor;
}
