﻿#version 300 es

precision mediump float;

#include ./partial/common.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uDownSampleTexture;
uniform float uStretch;

void main() {
    vec2 uv = vUv;

    vec3 c0 = texture(uDownSampleTexture, uv).xyz * .25;
    vec3 c1 = texture(uDownSampleTexture, uv).xyz * .5;
    vec3 c2 = texture(uDownSampleTexture, uv).xyz * .25;
    vec3 c3 = texture(uDownSampleTexture, uv).xyz;
 
    vec3 c = mix(c3, c0 + c1 + c2, uStretch);
    
    outColor = vec4(c.xyz, 1.);
}
