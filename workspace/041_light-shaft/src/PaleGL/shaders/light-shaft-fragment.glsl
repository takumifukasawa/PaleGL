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
uniform mat4 uProjectionMatrix;

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
    float linearDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
   
    vec3 rayOriginInView = vec3(0.);
    vec3 rayEndPositionInView = reconstructViewPositionFromDepth(vUv, rawDepth, uInverseProjectionMatrix);
    
    vec3 rayDirInView = normalize(rayEndPositionInView - rayOriginInView);
    
    float alpha = 0.;
    
    float rayStep = uRayStep;
   
    int maxIterationNum = 64;
    
    // vec3 v = (uInverseViewMatrix * vec4(rayEndPositionInView, 1.)).xyz;
    // // outColor = vec4(vec3(step(0., v.x)), 1.);
    // // outColor = vec4(rayDirInView, 1.);
    // outColor = vec4(vec3(step(0., rayDirInView.y)), 1.);
    // if(linearDepth > .99) {
    //     outColor = vec4(vec3(0.), 1.);
    // }
    // return;
    
    for(int i = 0; i < maxIterationNum; i++) {
        vec3 currentRayStep = rayDirInView * vec3(rayStep * float(i) + uRayNearOffset);
        vec3 currentRayPositionInView = rayOriginInView + currentRayStep;
        vec3 currentRayPositionInWorld = (uInverseViewMatrix * vec4(currentRayPositionInView, 1.)).xyz;
        
        vec4 shadowMapUv = uShadowMapProjectionMatrix * vec4(currentRayPositionInWorld, 1.);
        vec3 projectionUv = shadowMapUv.xyz / shadowMapUv.w;
        float shadowAreaRect =
        step(0., projectionUv.x) * (1. - step(1., projectionUv.x)) *
        step(0., projectionUv.y) * (1. - step(1., projectionUv.y)) *
        step(0., projectionUv.z) * (1. - step(1., projectionUv.z));
        // float shadowRate = shadowOccluded * shadowAreaRect;
        
        // float shadowRate = texture(uShadowMap, projectionUv.xy).r * shadowAreaRect;
        float sampleShadow = texture(uShadowMap, projectionUv.xy).r;

        // vec4 currentRayClipPosition = uProjectionMatrix * vec4(currentRayPositionInView, 1.);
        // currentRayClipPosition.xyz /= currentRayClipPosition.w;
        // float currentRayRawDepth = currentRayClipPosition.z;
        // float currentRayLinearDepth = perspectiveDepthToLinearDepth(currentRayRawDepth, uNearClip, uFarClip);

        if(
            shadowAreaRect < .5
            || sampleShadow >= 1.
            || sampleShadow >= projectionUv.z
        ) {
            alpha += (1. / uAttenuationBase);
        }
        
        // if(shadowAreaRect > .5) {
        //     alpha += 1.;
        // }
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
    // outColor = vec4(vec3(d), 1.);
}
