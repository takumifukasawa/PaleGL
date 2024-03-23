#version 300 es

precision mediump float;

uniform sampler2D uTexture0;
uniform vec2 uTexture0UvOffset;
uniform sampler2D uTexture1;
uniform vec2 uTexture1UvOffset;
uniform sampler2D uTexture2;
uniform vec2 uTexture2UvOffset;
uniform sampler2D uTexture3;
uniform vec2 uTexture3UvOffset;
uniform sampler2D uTexture4;
uniform vec2 uTexture4UvOffset;
uniform sampler2D uTexture5;
uniform vec2 uTexture5UvOffset;

uniform vec2 uTiling;

in vec2 vUv;

out vec4 outColor;

float isArea(vec2 uv) {
    return step(0., uv.x) * (1. - step(1., uv.x)) * step(0., uv.y) * (1. - step(1., uv.y));
}

vec4 calcAreaColor(vec4 color, vec2 uv, vec2 tiling, vec2 offset) {
    return color * isArea(uv * tiling + offset);
}

vec4 calcTextureAreaColor(sampler2D tex, vec2 uv, vec2 tiling, vec2 offset) {
    return calcAreaColor(texture(tex, uv * tiling + offset), uv, tiling, offset);
}

void main() {
    vec2 tiling = uTiling;
    vec4 color0 = calcTextureAreaColor(uTexture0, vUv, tiling, uTexture0UvOffset);
    vec4 color1 = calcTextureAreaColor(uTexture1, vUv, tiling, uTexture1UvOffset);
    vec4 color2 = calcTextureAreaColor(uTexture2, vUv, tiling, uTexture2UvOffset);
    vec4 color3 = calcTextureAreaColor(uTexture3, vUv, tiling, uTexture3UvOffset);
    vec4 color4 = calcTextureAreaColor(uTexture4, vUv, tiling, uTexture4UvOffset);
    vec4 color5 = calcTextureAreaColor(uTexture5, vUv, tiling, uTexture5UvOffset);
    outColor = color0 + color1 + color2 + color3 + color4 + color5;
}
