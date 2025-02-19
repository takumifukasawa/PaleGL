#version 300 es
           
precision mediump float;

#include ./partial/depth-functions.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uDepthTexture;
uniform float uNearClip;
uniform float uFarClip;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);
    float rawDepth = texture(uDepthTexture, vUv).r;
    // float eyeDepth = perspectiveDepthToEyeDepth(rawDepth, uNearClip, uFarClip);
    float eyeDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
   
    // float mask = step(.0001, 1. - eyeDepth);
    float mask = step(.0001, 1. - rawDepth) * rawDepth;

    float edgeWidth = .05; 
    float edgeMask =
        smoothstep(0., edgeWidth, vUv.x) *
        (1. - smoothstep(1. - edgeWidth, 1., vUv.x)) *
        smoothstep(0., edgeWidth, vUv.y) *
        (1. - smoothstep(1. - edgeWidth, 1., vUv.y));
        
    mask *= edgeMask;
    
    outColor = vec4(vec3(mask), 1.);
}
