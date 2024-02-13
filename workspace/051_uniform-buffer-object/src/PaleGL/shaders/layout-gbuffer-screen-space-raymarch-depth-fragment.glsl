#version 300 es

precision highp float;

#pragma DEFINES

// raymarch
#include ./partial/raymarch-distance-functions.glsl

#pragma BLOCK_RAYMARCH_SCENE

#include ./partial/raymarch-utility-functions.glsl

#include ./partial/depth-functions.glsl

uniform vec3 uViewPosition;

#include ./partial/uniform-block-transformations.glsl

// uniform mat4 uWorldMatrix;
// uniform mat4 uViewMatrix;
uniform sampler2D uDepthTexture;
uniform float uNearClip;
uniform float uFarClip;

in vec2 vUv;

out vec4 outColor;

void main() {
    vec4 diffuseColor = vec4(0.);

    //
    // raymarch start
    //

    vec3 rayOrigin = uViewPosition;
    vec3 rayDirection =vec3(0., 0., -1.);
    // vec3 rayDirection = normalize(vWorldPosition - uViewPosition);
    float distance = 0.;
    float accLen = 0.;
    vec3 currentRayPosition = rayOrigin;
    float minDistance = .0001;
    
    for(int i = 0; i < 64; i++) {
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

    //
    // raymarch end
    //

    // 既存の深度値と比較して、奥にある場合は破棄する
    float rawDepth = texelFetch(uDepthTexture, ivec2(gl_FragCoord.xy), 0).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    float currentDepth = viewZToLinearDepth((uViewMatrix * vec4(currentRayPosition, 1.)).z, uNearClip, uFarClip);
    if(currentDepth >= sceneDepth) {
        discard;
    }

    outColor = vec4(1., 1., 1., 1.);
}
