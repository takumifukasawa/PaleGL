#version 300 es

precision mediump float;

#include ./partial/common.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform vec2 uTexelSize;
uniform float uThreshold;

void main() {
    float vScale = 1.5;
    float dy = uTexelSize.y * vScale / 2.;
    vec2 uv = vUv;
    vec4 srcColor = texture(uSrcTexture, uv);
    vec3 c0 = texture(uSrcTexture, vec2(uv.x, uv.y - dy)).rgb;
    vec3 c1 = texture(uSrcTexture, vec2(uv.x, uv.y + dy)).rgb;
    vec3 c = (c0 + c1) / 2.;
    
    float br = max(c.r, max(c.g, c.b));
    c *= max(0., br - uThreshold) / max(br, 1e-5);
    
    outColor = vec4(c, 1.);
}
