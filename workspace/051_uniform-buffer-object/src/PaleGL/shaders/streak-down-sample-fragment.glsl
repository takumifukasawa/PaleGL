#version 300 es

precision mediump float;

#include ./partial/common.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uPrefilterTexture;
uniform vec2 uTexelSize;

void main() {
    vec2 uv = vUv;

    float hScale = 1.25;
    float dx = uTexelSize.x * hScale;

    float u0 = uv.x - dx * 5.;
    float u1 = uv.x - dx * 3.;
    float u2 = uv.x - dx * 1.;
    float u3 = uv.x + dx * 1.;
    float u4 = uv.x + dx * 3.;
    float u5 = uv.x + dx * 5.;
    
    vec4 c0 = texture(uPrefilterTexture, vec2(u0, uv.y));
    vec4 c1 = texture(uPrefilterTexture, vec2(u1, uv.y));
    vec4 c2 = texture(uPrefilterTexture, vec2(u2, uv.y));
    vec4 c3 = texture(uPrefilterTexture, vec2(u3, uv.y));
    vec4 c4 = texture(uPrefilterTexture, vec2(u4, uv.y));
    vec4 c5 = texture(uPrefilterTexture, vec2(u5, uv.y));
    
    vec4 c = (c0 + c1 + c2 + c3 + c4 + c5) / 6.0;
    
    outColor = vec4(c.xyz, 1.);
}
