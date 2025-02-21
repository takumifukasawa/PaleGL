#pragma DEFINES

#include ../partial/common.glsl

#include <lighting>
#include <ub>
// #include ../partial/uniform-block-common.glsl
// #include ../partial/uniform-block-transformations.glsl
// #include ../partial/uniform-block-camera.glsl
// #include ../partial/uniform-block-timeline.glsl

#pragma BLOCK_BEFORE_RAYMARCH_CONTENT

// raymarch
#include ../partial/raymarch-distance-functions.glsl

// #pragma BLOCK_RAYMARCH_SCENE
#pragma RAYMARCH_SCENE

// #include ./partial/raymarch-utility-functions.glsl

#include ../partial/depth-functions.glsl

// uniform vec3 uViewPosition;
// uniform mat4 uWorldMatrix;
// uniform mat4 uViewMatrix;
uniform sampler2D uDepthTexture;
// uniform float uNearClip;
// uniform float uFarClip;

in vec2 vUv;

out vec4 outColor;

void main() {
    vec4 diffuseColor = vec4(0.);

    //
    // raymarch start
    //

    vec3 rayOrigin = uViewPosition;
    vec3 rayDirection = vec3(0., 0., -1.);
    // vec3 rayDirection = normalize(vWorldPosition - uViewPosition);
    vec2 result = vec2(0.);
    float accLen = 0.;
    vec3 currentRayPosition = rayOrigin;
    float minDistance = EPS;
    for(int i = 0; i < SI; i++) {
        currentRayPosition = rayOrigin + rayDirection * accLen;
        result = dfScene(currentRayPosition);
        accLen += result.x;
        if(result.x <= minDistance) {
            break;
        }
    }
    
    if(result.x > minDistance) {
        discard;
    }

    //
    // raymarch end
    //

    // 既存の深度値と比較して、奥にある場合は破棄する
    float rawDepth = texelFetch(uDepthTexture, ivec2(gl_FragCoord.xy), 0).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    float currentDepth = viewZToLinearDepth((uViewMatrix * vec4(currentRayPosition, 1.)).z, uNearClip, uFarClip);
    // equal許容しない
    // if(currentDepth >= sceneDepth) {
    // equal許容
    if(currentDepth > sceneDepth) {
        discard;
    }

    outColor = vec4(1., 1., 1., 1.);
}
