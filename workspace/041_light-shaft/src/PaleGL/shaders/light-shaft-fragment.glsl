#version 300 es

//
// ref:
//
            
precision mediump float;

#include ./partial/depth-functions.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uDepthTexture;
uniform float uNearClip;
uniform float uFarClip;
uniform mat4 uInverseViewMatrix;
uniform mat4 uInverseProjectionMatrix;

uniform float uRayStep;
uniform float uRayNearOffset;
uniform float uAttenuationBase;
uniform float uAttenuationPower;
uniform float uBlendRate;

uniform sampler2D uShadowMap;
uniform mat4 uShadowMapProjectionMatrix;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);
    float rawDepth = texture(uDepthTexture, vUv).r;
    // float eyeDepth = perspectiveDepthToEyeDepth(rawDepth, uNearClip, uFarClip);
    float eyeDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
   
    vec3 rayOriginInView = vec3(0.);
    vec3 rayEndPositionInView = reconstructViewPositionFromDepth(vUv, rawDepth, uInverseProjectionMatrix);
    
    vec3 rayDirInView = normalize(rayEndPositionInView - rayOriginInView);
    
    float alpha = 0.;
    
    float rayStep = uRayStep;
   
    int maxIterationNum = 64;
    
    for(int i = 0; i < maxIterationNum; i++) {
        vec3 currentRayStep = rayDirInView * vec3(rayStep * float(i) + uRayNearOffset);
        vec3 currentRayPositionInView = rayOriginInView + currentRayStep;
        vec3 currentRayPositionInWorld = (uInverseViewMatrix * vec4(currentRayPositionInView, 1.)).xyz;
        
        vec4 shadowMapUv = uShadowMapProjectionMatrix * vec4(currentRayPositionInWorld, 1.);
        vec3 projectionUv = shadowMapUv.xyz / shadowMapUv.w;
        
        float shadow = texture(uShadowMap, projectionUv.xy).r;
        
        if(shadow >= 1.) {
            alpha += (1. / uAttenuationBase);
        }
    }
    
    alpha = clamp(alpha, 0., 1.);
    
    alpha = pow(alpha, uAttenuationPower);
   
    vec3 color = mix(sceneColor.rgb, vec3(1., 0., 0.), alpha * uBlendRate);
    
    outColor = vec4(color, 1.);

    // for debug
    // outColor = vec4(vec3(alpha), 1.);
    // outColor = texture(uShadowMap, vUv);
    // outColor = sceneColor;
    // outColor = vec4(rayDirInView, 1.);
    // outColor = vec4(uAttenuationBase);
    // outColor = sceneColor;
    // outColor = vec4(vec3(eyeDepth), 1.);
}           
