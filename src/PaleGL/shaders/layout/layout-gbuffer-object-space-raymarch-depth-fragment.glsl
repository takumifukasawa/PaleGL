#version 300 es

precision highp float;

#pragma DEFINES

#include ../partial/common.glsl

#include ../partial/uniform-block-common.glsl
#include ../partial/uniform-block-transformations.glsl
#include ../partial/uniform-block-camera.glsl
#include ../partial/uniform-block-timeline.glsl

#ifdef USE_INSTANCING
in float vInstanceId;
in vec4 vInstanceState;
#endif

#pragma BLOCK_BEFORE_RAYMARCH_CONTENT

// raymarch
#include ../partial/raymarch-distance-functions.glsl

// #pragma BLOCK_RAYMARCH_SCENE
#pragma RAYMARCH_SCENE

#include ../partial/raymarch-utility-functions.glsl

#include ../partial/depth-functions.glsl

#include ../partial/alpha-test-functions.glsl

uniform vec4 uColor;
uniform sampler2D uDiffuseMap;
uniform vec2 uDiffuseMapUvScale;
uniform float uIsPerspective;
uniform float uUseWorld;
uniform vec3 uBoundsScale;
uniform sampler2D uDepthTexture;

#ifdef USE_ALPHA_TEST
uniform float uAlphaTestThreshold;
#endif

in vec2 vUv;
in vec3 vLocalPosition;
in mat4 vWorldMatrix;
in vec3 vWorldPosition;
in mat4 vInverseWorldMatrix;

#ifdef USE_VERTEX_COLOR
in vec4 vVertexColor;
#endif

out vec4 outColor;

void main() {
    vec2 uv = vUv * uDiffuseMapUvScale;

    vec4 diffuseMapColor = texture(uDiffuseMap, uv);

    vec4 diffuseColor = vec4(0.);

    #ifdef USE_VERTEX_COLOR
    diffuseColor = vVertexColor * uColor * diffuseMapColor;
    #else
    diffuseColor = uColor * diffuseMapColor;
    #endif

    //
    // NOTE: raymarch block
    //

    vec3 wp = vWorldPosition;
    // vec3 wp = (vWorldMatrix * vec4(vLocalPosition, 1.)).xyz;
    
    vec3 rayOrigin = wp;
    vec3 rayDirection = uIsPerspective > .5
        ? normalize(wp - uViewPosition)
        : normalize(-uViewPosition);
    float distance = 0.;
    float accLen = 0.;
    vec3 currentRayPosition = rayOrigin;
    float minDistance = EPS;

    mat4 inverseWorldMatrix = vInverseWorldMatrix;
    // mat4 inverseWorldMatrix = inverse(uWorldMatrix);
    
    for(int i = 0; i < OI; i++) {
        currentRayPosition = rayOrigin + rayDirection * accLen;
        distance = objectSpaceDfScene(currentRayPosition, inverseWorldMatrix, uBoundsScale, uUseWorld).x;
        accLen += distance;
        if(!isDfInnerBox(toLocal(currentRayPosition, inverseWorldMatrix, uBoundsScale), uBoundsScale)) {
            break;
        }
        if(distance <= minDistance) {
            break;
        }
    }

    if(distance > minDistance) {
        discard;
    }

    // 既存の深度値と比較して、奥にある場合は破棄する
    // float rawDepth = texelFetch(uDepthTexture, ivec2(gl_FragCoord.xy), 0).x;
    // float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    // vec4 currentRayViewPosition = (uViewMatrix * vec4(currentRayPosition, 1.));
    // float currentDepth = viewZToLinearDepth(currentRayViewPosition.z, uNearClip, uFarClip);
    // if(currentDepth >= sceneDepth) {
    //     discard;
    // }

    vec4 rayClipPosition = uProjectionMatrix * uViewMatrix * vec4(currentRayPosition, 1.);
    float newDepth = (rayClipPosition.z / rayClipPosition.w) * .5 + .5;
    gl_FragDepth = newDepth;

    //
    // NOTE: end raymarch block
    //

    float alpha = diffuseColor.a; // TODO: base color を渡して alpha をかける

#ifdef USE_ALPHA_TEST
    checkAlphaTest(alpha, uAlphaTestThreshold);
#endif

    outColor = vec4(1., 1., 1., 1.);
    
    // gl_FragDepth = (currentRayProjectionPosition.z / currentRayProjectionPosition.w) * .5 + .5;
}
