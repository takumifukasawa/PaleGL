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
    
    // outColor = sceneColor;
    outColor = vec4(vec3(mask), 1.);
    // outColor = vec4(vec3(rawDepth), 1.);
}

// #version 300 es
// 
// precision mediump float;
// 
// #include ./partial/depth-functions.glsl
// 
// in vec2 vUv;
// 
// out vec4 outColor;
// 
// uniform sampler2D uSrcTexture;
// uniform sampler2D uDepthTexture;
// uniform float uNearClip;
// uniform float uFarClip;
// 
// void main() {
//     vec4 sceneColor = texture(uSrcTexture, vUv);
//     float rawDepth = texture(uDepthTexture, vUv).r;
//     float eyeDepth = perspectiveDepthToEyeDepth(rawDepth, uNearClip, uFarClip);
// 
//     vec4 resultColor = texture(uSrcTexture, vUv);
//     // resultColor = vec4(vec3(eyeDepth), 1.);
// 
//     outColor = resultColor;
// }

// #version 300 es
// 
// precision mediump float;
// 
// in vec2 vUv;
// 
// out vec4 outColor;
// 
// uniform sampler2D uSrcTexture;
// 
// float rand(vec2 co){
//     return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
// }
// 
// void main() {
//     vec4 resultColor = texture(uSrcTexture, vUv);
//     outColor = resultColor;
//        
//     // WIP: zoom blur
//     
//     vec2 centerUv = vec2(.5);
//     vec2 centerToCurrent = vUv - centerUv;
//     float totalWeight = 0.;
//     vec4 destColor = vec4(0.);
// 
//     float strength = 1.;
//     for(int i = 0; i <= 30; i++) {
//         float nflag = (1. / 30.);
//         float fi = float(i);
//         float per = (fi + (rand(vUv) * 2. - 1.) * 1.) * nflag;
//         float weight = per - per * per;
//         vec2 t = vUv + (-centerToCurrent * per * strength * nflag);
//         // destColor.xyz += texture(uSrcTexture, t * texelSize).xyz * weight;
//         destColor += texture(uSrcTexture, t) * weight;
//         totalWeight += weight;
//     }
//     
//     destColor /= totalWeight;
//     
//     outColor = destColor;
//     
//     outColor = resultColor;
//     
//     // debug
//     
//     // outColor = resultColor;
// }
