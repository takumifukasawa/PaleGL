#version 300 es

precision highp float;

#pragma DEFINES

// raymarch
#include ./partial/raymarch-distance-functions.glsl

#pragma BLOCK_RAYMARCH_SCENE

#include ./partial/raymarch-utility-functions.glsl

#include ./partial/depth-functions.glsl

#include ./partial/alpha-test-functions.glsl

uniform float uMetallic;
uniform float uRoughness;
uniform int uShadingModelId;

#pragma APPEND_UNIFORMS

#include ./partial/tone-mapping.glsl

#include ./partial/uniform-block-transformations.glsl
#include ./partial/uniform-block-camera.glsl

// uniform mat4 uWorldMatrix;
// uniform mat4 uViewMatrix;
// uniform mat4 uProjectionMatrix;
// uniform mat4 uInverseWorldMatrix;
// uniform vec3 uViewPosition;
// uniform vec3 uViewDirection;
uniform sampler2D uDepthTexture;
// uniform float uNearClip;
// uniform float uFarClip;
// uniform float uFov;
// uniform float uAspect;
uniform float uTargetWidth;
uniform float uTargetHeight;

#include ./partial/alpha-test-fragment-uniforms.glsl

in vec2 vUv;
in vec3 vWorldPosition;

#include ./partial/gbuffer-functions.glsl

#include ./partial/gbuffer-layout.glsl

// // aspect ... w / h
// vec3 getPerspectiveCameraDir(vec2 uv, vec3 forward, float fov, float aspect) {
//     vec2 st = uv * 2. - 1.;
//     float fovRad = fov * 3.141592 / 180.;
//     float hh = tan(fovRad * .5);
//     float hw = hh * aspect;
//     vec3 dummyUp = vec3(0., 1., 0.);
//     vec3 nf = forward;
//     vec3 right = normalize(cross(nf, dummyUp));
//     vec3 up = normalize(cross(right, nf));
//     vec3 dir = normalize(right * hw * st.x + up * hh * st.y + forward);
//     return dir;
// }

void main() {
    vec4 resultColor = vec4(0, 0, 0, 1);
    vec4 emissiveColor = vec4(0., 0., 0., 1.);
    
    vec3 worldNormal = vec3(0., 0., 1.);

    //
    // NOTE: raymarch block
    //

    vec3 rayOrigin = uViewPosition;
    vec3 rayDirection = getPerspectiveCameraRayDir(vUv, uViewDirection, uFov, uAspect);

    float distance = 0.;
    float accLen = uNearClip;
    vec3 currentRayPosition = rayOrigin;
    float minDistance = .0001;
    for(int i = 0; i < 64; i++) {
        currentRayPosition = rayOrigin + rayDirection * accLen;
        distance = dfScene(currentRayPosition);
        accLen += distance;
        if(accLen > uFarClip || distance <= minDistance) {
            break;
        }
    }
    
    if(distance > minDistance) {
        discard;
    }
    
    // currentRayPosition = rayOrigin + rayDirection * accLen;

    // 既存の深度値と比較して、奥にある場合は破棄する
    float rawDepth = texelFetch(uDepthTexture, ivec2(gl_FragCoord.xy), 0).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    float currentDepth = viewZToLinearDepth((uViewMatrix * vec4(currentRayPosition, 1.)).z, uNearClip, uFarClip);
    if(currentDepth >= sceneDepth) {
        discard;
    }

    vec4 rayClipPosition = uProjectionMatrix * uViewMatrix * vec4(currentRayPosition, 1.);
    float newDepth = (rayClipPosition.z / rayClipPosition.w) * .5 + .5;
    gl_FragDepth = newDepth;

    if(distance > 0.) {
        worldNormal = getNormalDfScene(currentRayPosition);
    }
    
    //
    // NOTE: end raymarch block
    //

#ifdef USE_ALPHA_TEST
    checkAlphaTest(resultColor.a, uAlphaTestThreshold);
#endif

    resultColor.rgb = gamma(resultColor.rgb);

    outGBufferA = EncodeGBufferA(resultColor.rgb);
    outGBufferB = EncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = EncodeGBufferC(uMetallic, uRoughness);
    outGBufferD = EncodeGBufferD(emissiveColor.rgb);
}
