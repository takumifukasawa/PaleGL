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

uniform sampler2D uSrcTexture;
uniform sampler2D uLightShaftTexture;
uniform float uBlendRate;
uniform sampler2D uDepthTexture;
uniform mat4 uInverseViewProjectionMatrix;
uniform mat4 uInverseProjectionMatrix;
uniform float uNearClip;
uniform float uFarClip;
uniform vec3 uViewPosition;
uniform float uFogStrength;
uniform float uFogDensity;
uniform float uFogDensityAttenuation;

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
    
    return ret;
}

void main() {
    vec2 uv = vUv;
    
    vec4 sceneColor = texture(uSrcTexture, uv);
    vec4 destColor = sceneColor;
    vec4 lightShaftColor = texture(uLightShaftTexture, uv);
    float occlusion = saturate(lightShaftColor.x);

    float rawDepth = texture(uDepthTexture, uv).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    vec3 viewPositionFromDepth = reconstructViewPositionFromDepth(uv, rawDepth, uInverseProjectionMatrix);
    vec3 worldPositionFromDepth = reconstructWorldPositionFromDepth(uv, rawDepth, uInverseViewProjectionMatrix);
 
    float constantFogScale = .1;
  
    vec3 fogColor = vec3(.8);
    // カメラから見て奥は-z
    float rate = constantFogScale * max(0., 1. - exp(-uFogStrength * -viewPositionFromDepth.z));
    
    float fogRate = calcFogHeightExp(worldPositionFromDepth, uViewPosition, uFogDensity, uFogDensityAttenuation);
    fogRate *= 1. - step(1. - .0001, rawDepth);

    destColor = sceneColor * (1. - occlusion);

    outColor = destColor;
    
    // for debug
    // outColor = vec4(vec3(occlusion), 1.);
    outColor = vec4(vec3(sceneDepth), 1.);
    outColor = vec4(mix(sceneColor.xyz, fogColor.xyz, rate), 1.);
    outColor = vec4(vec3(fogRate), 1.);
    // outColor = vec4(worldPositionFromDepth, 1.);
    // outColor = vec4(vec3(uFogStrength), 1.);
}           
