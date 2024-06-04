#version 300 es

precision mediump float;

#include ./partial/common.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform float uVignetteRadius;
uniform float uVignettePower;
uniform float uBlendRate;
uniform float uAspect;

void main() {
    vec2 uv = vUv;
    vec2 centerUv = vUv * 2. - 1.; // -1 ~ 1
    centerUv.x *= uAspect;
    float d = dot(centerUv, centerUv);
    float factor = pow(min(1., d / uVignetteRadius), uVignettePower) * uBlendRate;
    vec3 vignetteColor = vec3(0.);
    vec3 srcColor = texture(uSrcTexture, uv).rgb;
    outColor = vec4(mix(srcColor, vignetteColor, factor), 1.);
}
