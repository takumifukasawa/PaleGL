#version 300 es
            
precision mediump float;

#include ./partial/depth-functions.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uDepthTexture;
uniform float uNearClip;
uniform float uFarClip;
uniform float uFocusDistance;
uniform float uFocusRange;
uniform mat4 uInverseProjectionMatrix;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);
    float rawDepth = texture(uDepthTexture, vUv).r;
    float depth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    float depthDist = mix(uNearClip, uFarClip, depth);
    
    vec3 viewPosition = reconstructViewPositionFromDepth(vUv, rawDepth, uInverseProjectionMatrix);
    
    // float coc = (depth - uFocusDistance) / uFocusRange;
    float coc = (depthDist - uFocusDistance) / uFocusRange;

    // outColor = sceneColor;
    // outColor = vec4(vec3(rawDepth), 1.);
    // outColor = vec4(vec3(depth), 1.);
    // outColor = vec4(vec3(depthDist), 1.);
    outColor = vec4(vec3(coc), 1.);
    // outColor = vec4(vUv, 1., 1.);
    // outColor = vec4(viewPosition, 1.);
    // outColor = vec4(vec3(viewPosition.x), 1.);
}           
