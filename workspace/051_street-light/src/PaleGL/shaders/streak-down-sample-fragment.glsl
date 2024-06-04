#version 300 es

// ref: 
// https://github.com/keijiro/KinoStreak/blob/master/Assets/Kino/Streak/Shader/Streak.cginc

precision mediump float;

#include ./partial/common.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uPrevTexture;
uniform vec2 uTexelSize;
uniform float uHorizontalScale;

void main() {
    vec2 uv = vUv;

    // float hScale = 1.25;
    float hScale = uHorizontalScale;
    // 横に引き延ばして色を抽出する
    float dx = uTexelSize.x * hScale;

    float u0 = uv.x - dx * 5.;
    float u1 = uv.x - dx * 3.;
    float u2 = uv.x - dx * 1.;
    float u3 = uv.x + dx * 1.;
    float u4 = uv.x + dx * 3.;
    float u5 = uv.x + dx * 5.;
    
    vec4 c0 = texture(uPrevTexture, vec2(u0, uv.y));
    vec4 c1 = texture(uPrevTexture, vec2(u1, uv.y));
    vec4 c2 = texture(uPrevTexture, vec2(u2, uv.y));
    vec4 c3 = texture(uPrevTexture, vec2(u3, uv.y));
    vec4 c4 = texture(uPrevTexture, vec2(u4, uv.y));
    vec4 c5 = texture(uPrevTexture, vec2(u5, uv.y));
  
    // 6つの色の平均を取る
    // 輝度は考慮しない
    vec4 c = (c0 + c1 + c2 + c3 + c4 + c5) / 6.0;
    
    outColor = vec4(c.xyz, 1.);
}
