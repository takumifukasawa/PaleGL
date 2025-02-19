#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;

void main() {
    vec4 textureColor = texture(uSrcTexture, vUv);
    outColor = textureColor;
}
