#version 300 es

precision mediump float;

#include ./partial/common.glsl

in vec2 vUv;

out vec4 outColor;

uniform vec4 uColor;
uniform float uIntensity;
uniform sampler2D uSrcTexture;
uniform sampler2D uStreakTexture;

void main() {
    vec2 uv = vUv;
    vec3 c0 = texture(uStreakTexture, uv).xyz * .25;
    vec3 c1 = texture(uStreakTexture, uv).xyz * .5;
    vec3 c2 = texture(uStreakTexture, uv).xyz * .25;
    vec3 c3 = texture(uSrcTexture, uv).xyz;
    vec3 cf = (c0 + c1 + c2) * uColor.xyz * uIntensity * 5.;
    
    outColor = vec4(cf + c3, 1.);
    
    // for debug
    // outColor = texture(uStreakTexture, uv);
}
