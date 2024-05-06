#version 300 es

precision mediump float;

#include ./partial/common.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uPrefilterTexture;

void main() {
    vec2 uv = vUv;
    vec4 prefilterColor = texture(uPrefilterTexture, uv);
    outColor = prefilterColor;
}
