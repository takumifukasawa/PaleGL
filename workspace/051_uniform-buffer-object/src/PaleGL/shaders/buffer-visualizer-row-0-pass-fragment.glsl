#version 300 es

precision mediump float;

#include ./partial/common.glsl

#include ./partial/depth-functions.glsl

uniform vec2 uTiling;
uniform sampler2D uTextureCol0;
uniform vec2 uTextureCol0UvOffset;
uniform vec2 uTextureCol1UvOffset;

uniform float uNearClip;
uniform float uFarClip;
uniform mat4 uInverseViewProjectionMatrix;

in vec2 vUv;

out vec4 outColor;

void main() {
    vec2 tiling = uTiling;
    // vec2 tiling = vec2(6., 1.);

    // vec2 depthUv = vUv * tiling + uDepthTextureUvOffset;
    vec2 depthUv = vUv * tiling + uTextureCol0UvOffset;
    vec2 worldPositionUv = vUv * tiling + uTextureCol1UvOffset;
    // vec2 worldPositionUv = vUv * tiling + vec2(-1., 0.);

    float rawDepth = texture(uTextureCol0, depthUv).x * isArea(depthUv);
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    
    vec3 worldPosition = reconstructWorldPositionFromDepth(
        worldPositionUv,
        texture(uTextureCol0, worldPositionUv).x,
        uInverseViewProjectionMatrix
    );

    vec4 depthColor = calcAreaColor(vec4(sceneDepth), vUv, tiling, vec2(0., 0.));
    vec4 worldPositionColor = calcAreaColor(vec4(worldPosition, 1.), vUv, tiling, vec2(-1., 0.));

    outColor = depthColor + worldPositionColor;
}
