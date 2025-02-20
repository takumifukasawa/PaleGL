#version 300 es

precision mediump float;

#include <common>
#include <buffer_visualizer_h>

#include ./partial/depth-functions.glsl

uniform vec2 uTiling;
uniform sampler2D uTextureCol0;
uniform vec2 uTextureCol0UvOffset;
uniform vec2 uTextureCol1UvOffset;
uniform sampler2D uTextureCol2;
uniform vec2 uTextureCol2UvOffset;
uniform sampler2D uTextureCol3;
uniform vec2 uTextureCol3UvOffset;
uniform sampler2D uTextureCol4;
uniform vec2 uTextureCol4UvOffset;
uniform sampler2D uTextureCol5;
uniform vec2 uTextureCol5UvOffset;

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
    vec4 color2 = calcTextureAreaColor(uTextureCol2, vUv, tiling, uTextureCol2UvOffset);
    vec4 color3 = calcTextureAreaColor(uTextureCol3, vUv, tiling, uTextureCol3UvOffset);
    vec4 color4 = calcTextureAreaColor(uTextureCol4, vUv, tiling, uTextureCol4UvOffset);
    vec4 color5 = calcTextureAreaColor(uTextureCol5, vUv, tiling, uTextureCol5UvOffset);

    outColor = depthColor + worldPositionColor + color2 + color3 + color4 + color5;
}
