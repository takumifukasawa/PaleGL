﻿#version 300 es

precision mediump float;

#include ./partial/common.glsl

uniform vec2 uTiling;
uniform sampler2D uRow0Texture;
uniform sampler2D uRow1Texture;
uniform sampler2D uRow2Texture;
uniform sampler2D uRow3Texture;
uniform sampler2D uRow4Texture;
uniform sampler2D uRow5Texture;

in vec2 vUv;

out vec4 outColor;

void main() {
    vec2 tiling = vec2(1., 6.);
    // vec4 color0 = calcTextureAreaColor(uRow0Texture, vUv, tiling, vec2(0., -5.));
    vec4 color0 = calcTextureAreaColor(uRow0Texture, vUv, tiling, vec2(0., -5.));
    vec4 color1 = calcTextureAreaColor(uRow1Texture, vUv, tiling, vec2(0., -4.));
    vec4 color2 = calcTextureAreaColor(uRow2Texture, vUv, tiling, vec2(0., -3.));
    vec4 color3 = calcTextureAreaColor(uRow3Texture, vUv, tiling, vec2(0., -2.));
    vec4 color4 = calcTextureAreaColor(uRow4Texture, vUv, tiling, vec2(0., -1.));
    vec4 color5 = calcTextureAreaColor(uRow5Texture, vUv, tiling, vec2(0., 0.));
    outColor = color0 + color1 + color2 + color3 + color4 + color5;
    // outColor = color3;
    
    // outColor = vec4(vUv, 1., 1.);
    // outColor = vec4(vUv * uTiling, 1., 1.);
    // outColor = vec4(1., 0., 0., 1.);
}