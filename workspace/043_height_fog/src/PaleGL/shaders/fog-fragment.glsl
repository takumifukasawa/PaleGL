
#version 300 es
            
precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uLightShaftTexture;
uniform float uBlendRate;
uniform sampler2D uDepthTexture;
uniform mat4 uInverseProjectionMatrix;
uniform float uNearClip;
uniform float uFarClip;
uniform float uFogStrength;

#pragma DEPTH_FUNCTIONS

#define saturate(x) min(1., max(0., x))

void main() {
    vec2 uv = vUv;
    
    vec4 sceneColor = texture(uSrcTexture, uv);
    vec4 destColor = sceneColor;
    vec4 lightShaftColor = texture(uLightShaftTexture, uv);
    float occlusion = saturate(lightShaftColor.x);

    float rawDepth = texture(uDepthTexture, uv).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    vec3 viewPositionFromDepth = reconstructViewPositionFromDepth(uv, rawDepth, uInverseProjectionMatrix);
   
    vec3 fogColor = vec3(.8);
    // カメラから見て奥は-z
    float rate = max(0., 1. - exp(-uFogStrength * -viewPositionFromDepth.z));

    destColor = sceneColor * (1. - occlusion);

    outColor = destColor;
    
    // for debug
    // outColor = vec4(vec3(occlusion), 1.);
    outColor = vec4(vec3(sceneDepth), 1.);
    outColor = vec4(mix(sceneColor.xyz, fogColor.xyz, rate), 1.);
    // outColor = vec4(vec3(uFogStrength), 1.);
}           
