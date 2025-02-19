#version 300 es

// ref: 
// https://github.com/keijiro/KinoStreak/blob/master/Assets/Kino/Streak/Shader/Streak.cginc

precision mediump float;

#include ./partial/common.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uDownSampleTexture;
uniform sampler2D uPrevTexture; // 1つ前のpassのテクスチャ
uniform float uStretch;

void main() {
    vec2 uv = vUv;

    // TODO: c0~c3の計算の意味がよくわかっていない
    vec3 c0 = texture(uPrevTexture, uv).xyz * .25;
    vec3 c1 = texture(uPrevTexture, uv).xyz * .5;
    vec3 c2 = texture(uPrevTexture, uv).xyz * .25;

    vec3 c3 = texture(uDownSampleTexture, uv).xyz;

    // stretchが高いほど、前のパスで引き延ばされたテクスチャが強調される = streakが強くなる
    vec3 c = mix(c3, c0 + c1 + c2, uStretch);
    outColor = vec4(c.xyz, 1.);
    
    // for debug
    // outColor = texture(uPrevTexture, uv);
}
