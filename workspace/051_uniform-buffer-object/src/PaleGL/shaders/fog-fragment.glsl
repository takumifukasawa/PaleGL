#version 300 es
            
precision mediump float;

//
// ref:
// https://techblog.kayac.com/unity-height-related-fog
// https://github.com/hiryma/UnitySamples/blob/master/Fog/Assets/Shaders/Fog.cginc
// https://hikita12312.hatenablog.com/entry/2017/12/30/142137
//

in vec2 vUv;

out vec4 outColor;

#include ./partial/uniform-block-camera.glsl
// uniform float uNearClip;
// uniform float uFarClip;
// uniform vec3 uViewPosition;

uniform sampler2D uSrcTexture;
uniform sampler2D uLightShaftTexture;
uniform sampler2D uVolumetricLightTexture;
uniform float uBlendRate;
uniform sampler2D uDepthTexture;
uniform mat4 uInverseViewProjectionMatrix;
uniform mat4 uInverseProjectionMatrix;
uniform float uFogStrength;
uniform float uFogDensity;
uniform float uFogDensityAttenuation;
uniform float uFogEndHeight;

#pragma DEPTH_FUNCTIONS

#define saturate(x) min(1., max(0., x))

float calcFogHeightExp(vec3 objectPositionInWorld, vec3 cameraPositionInWorld, float densityY0, float densityAttenuation) {
    vec3 v = cameraPositionInWorld - objectPositionInWorld;
    float l = length(v);
    float ret;
    float tmp = l * densityY0 * exp(-densityAttenuation * objectPositionInWorld.y);
    if(v.y == 0.) {
        ret = exp(-tmp);
    } else {
        float kvy = densityAttenuation * v.y;
        ret = exp(tmp / kvy * (exp(-kvy) - 1.));
    }
    
    return 1. - ret;
}

float calcFogHeightUniform(vec3 objectPositionInWorld, vec3 cameraPositionInWorld, float fogDensity, float fogEndHeight) {
    vec3 v = cameraPositionInWorld - objectPositionInWorld;
    float t;
    if(objectPositionInWorld.y < fogEndHeight) {
        if(cameraPositionInWorld.y > fogEndHeight) {
            t = (fogEndHeight - objectPositionInWorld.y) / v.y;
        } else {
            t = 1.;
        }
    } else {
        if(cameraPositionInWorld.y < fogEndHeight) {
            t = (cameraPositionInWorld.y - fogEndHeight) / v.y;
        } else {
            t = 0.;
        }
    }
    float dist = length(v) * t;
    float fog = exp(-dist * fogDensity);
    return 1. - fog;
}

void main() {
    vec2 uv = vUv;
    
    vec4 sceneColor = texture(uSrcTexture, uv);
    vec4 destColor = sceneColor;
    vec4 lightShaftColor = texture(uLightShaftTexture, uv);
    vec4 volumetricLightColor = texture(uVolumetricLightTexture, uv);
    // 高ければ高いほど遮蔽されてる
    float occlusion = saturate(lightShaftColor.x);

    float rawDepth = texture(uDepthTexture, uv).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    vec3 viewPositionFromDepth = reconstructViewPositionFromDepth(uv, rawDepth, uInverseProjectionMatrix);
    vec3 worldPositionFromDepth = reconstructWorldPositionFromDepth(uv, rawDepth, uInverseViewProjectionMatrix);
 
    float constantFogScale = .1;
  
    vec3 fogColor = vec3(.8);
    // constant fog
    // TODO: constant fog も考慮すべき？
    // カメラから見て奥は-z
    float rate = constantFogScale * max(0., 1. - exp(-uFogStrength * -viewPositionFromDepth.z));
    
    float fogRate = calcFogHeightExp(worldPositionFromDepth, uViewPosition, uFogDensity, uFogDensityAttenuation);
    // float fogRate = calcFogHeightUniform(worldPositionFromDepth, uViewPosition, uFogDensity, uFogEndHeight);
    fogRate *= 1. - step(1. - .0001, rawDepth);
    // fogRate *= saturate(1. - occlusion);
    // fogRate *= saturate(occlusion);
    // fogRate -= saturate(occlusion);
    fogRate = saturate(fogRate);

    // TODO: fog->occlusionの方が正しい？
    vec4 applyOcclusionColor = sceneColor * (1. - occlusion);
    outColor = vec4(mix(applyOcclusionColor.xyz, fogColor.xyz, fogRate), 1.);
    outColor += vec4(volumetricLightColor.xyz, 0.); // TODO: 単純に足す、で良い？
    
    // for debug
    // outColor = sceneColor;
    // outColor = vec4(vec3(occlusion), 1.);
    // outColor = vec4(vec3(sceneDepth), 1.);
    // outColor = vec4(mix(sceneColor.xyz, fogColor.xyz, rate), 1.);
    // outColor = vec4(vec3(fogRate), 1.);
    // outColor = vec4(vec3(worldPositionFromDepth.y), 1.);
    // outColor = vec4(worldPositionFromDepth, 1.);
    // outColor = vec4(vec3(uFogStrength), 1.);
}           
