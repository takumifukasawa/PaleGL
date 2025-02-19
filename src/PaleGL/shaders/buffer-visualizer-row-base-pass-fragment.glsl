#version 300 es

precision mediump float;

#include ./partial/common.glsl

uniform vec2 uTiling;
uniform sampler2D uTextureCol0;
uniform vec2 uTextureCol0UvOffset;
uniform sampler2D uTextureCol1;
uniform vec2 uTextureCol1UvOffset;
uniform sampler2D uTextureCol2;
uniform vec2 uTextureCol2UvOffset;
uniform sampler2D uTextureCol3;
uniform vec2 uTextureCol3UvOffset;
uniform sampler2D uTextureCol4;
uniform vec2 uTextureCol4UvOffset;
uniform sampler2D uTextureCol5;
uniform vec2 uTextureCol5UvOffset;

in vec2 vUv;

out vec4 outColor;

void main() {
    vec2 tiling = uTiling;
    vec4 color0 = calcTextureAreaColor(uTextureCol0, vUv, tiling, uTextureCol0UvOffset);
    vec4 color1 = calcTextureAreaColor(uTextureCol1, vUv, tiling, uTextureCol1UvOffset);
    vec4 color2 = calcTextureAreaColor(uTextureCol2, vUv, tiling, uTextureCol2UvOffset);
    vec4 color3 = calcTextureAreaColor(uTextureCol3, vUv, tiling, uTextureCol3UvOffset);
    vec4 color4 = calcTextureAreaColor(uTextureCol4, vUv, tiling, uTextureCol4UvOffset);
    vec4 color5 = calcTextureAreaColor(uTextureCol5, vUv, tiling, uTextureCol5UvOffset);
    outColor = color0 + color1 + color2 + color3 + color4 + color5;
}
