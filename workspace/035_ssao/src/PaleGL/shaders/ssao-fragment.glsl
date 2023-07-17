#version 300 es

precision mediump float;

#pragma DEFINES

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uDepthTexture;
uniform sampler2D uNormalTexture;
uniform float uNearClip;
uniform float uFarClip;

#pragma DEPTH_FUNCTIONS

float isArea(vec2 uv) {
    return step(0., uv.x) * (1. - step(1., uv.x)) * step(0., uv.y) * (1. - step(1., uv.y));
}

void main() {
    vec4 color = texture(uSrcTexture, vUv);
    
    float rawDepth = texture(uDepthTexture, vUv).x * isArea(vUv);
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
   
    outColor = vec4(vec3(sceneDepth), 1.);
    
    outColor = mix(color, vec4(vUv, 1., 1.), .5);
}
