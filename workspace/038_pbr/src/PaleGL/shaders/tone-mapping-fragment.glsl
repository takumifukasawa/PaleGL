#version 300 es

precision mediump float;

#include ./partial/pseudo-hdr.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;

void main() {
    // 疑似HDRする場合
    // vec4 textureColor = texture(uSrcTexture, vUv);
    // vec4 color = decodePseudoHDR(textureColor);
    // outColor = vec4(color.xyz, 1.);

    // TODO: hdrのtonemapping
    vec4 textureColor = texture(uSrcTexture, vUv);
    outColor = textureColor;
}
