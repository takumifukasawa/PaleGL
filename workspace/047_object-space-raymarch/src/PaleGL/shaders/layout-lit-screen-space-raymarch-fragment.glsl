#version 300 es

precision highp float;

#pragma DEFINES

// raymarch
#include ./partial/raymarch-distance-functions.glsl

#pragma BLOCK_RAYMARCH_SCENE

#include ./partial/raymarch-utility-functions.glsl

#include ./partial/depth-functions.glsl

uniform float uMetallic;
uniform float uRoughness;
uniform int uShadingModelId;

#pragma APPEND_UNIFORMS

#include ./partial/tone-mapping.glsl

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uInverseWorldMatrix;
uniform vec3 uViewPosition;
uniform sampler2D uDepthTexture;
uniform float uNearClip;
uniform float uFarClip;

#include ./partial/camera-struct.glsl

in vec2 vUv;
in vec3 vWorldPosition;

#include ./partial/gbuffer-functions.glsl

#include ./partial/gbuffer-layout.glsl

void main() {
    vec4 resultColor = vec4(0, 0, 0, 1);
    vec4 emissiveColor = vec4(0., 0., 0., 1.);
    
    vec3 worldNormal = vec3(0., 0., 1.);

    //
    // NOTE: raymarch block
    //

    vec3 rayOrigin = uViewPosition;
    // vec3 rayDirection = vec3(0., 0., -1.);
    vec3 rayDirection = normalize(vWorldPosition - uViewPosition);
    float distance = 0.;
    float accLen = 0.;
    vec3 currentRayPosition = rayOrigin;
    float minDistance = .0001;
    for(int i = 0; i < 128; i++) {
        currentRayPosition = rayOrigin + rayDirection * accLen;
        distance = dfScene(currentRayPosition);
        accLen += distance;
        if(distance <= minDistance) {
            break;
        }
    }
    
    if(distance > minDistance) {
        discard;
    }

    // 既存の深度値と比較して、奥にある場合は破棄する
    float rawDepth = texelFetch(uDepthTexture, ivec2(gl_FragCoord.xy), 0).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    float currentDepth = viewZToLinearDepth((uViewMatrix * vec4(currentRayPosition, 1.)).z, uNearClip, uFarClip);

    if(currentDepth >= sceneDepth) {
        // discard;
    }
 
    //
    // NOTE: end raymarch block
    //

    resultColor.rgb = gamma(resultColor.rgb);

    if(distance > 0.) {
        worldNormal = getNormalDfScene(currentRayPosition);
    }

    outGBufferA = EncodeGBufferA(resultColor.rgb);
    outGBufferB = EncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = EncodeGBufferC(uMetallic, uRoughness);
    outGBufferD = EncodeGBufferD(emissiveColor.rgb);
}
