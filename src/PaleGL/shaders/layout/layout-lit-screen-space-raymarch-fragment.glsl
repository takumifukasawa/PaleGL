#pragma DEFINES

#include <common>
#include <lighting>
#include <ub>
#include <tone>
#include <depth>
#include <gbuffer>
#include <alpha_test>

#pragma BLOCK_BEFORE_RAYMARCH_CONTENT

#include <raymarch_df>

// #pragma BLOCK_RAYMARCH_SCENE
#pragma RAYMARCH_SCENE

#include <raymarch_sf>

uniform float uMetallic;
uniform float uRoughness;
uniform int uShadingModelId;
uniform vec4 uEmissiveColor;

#pragma APPEND_UNIFORMS

uniform float uTargetWidth;
uniform float uTargetHeight;

in vec2 vUv;
in vec3 vWorldPosition;

#include <gbuffer_o>

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

    vec3 worldNormal = vec3(0., 0., 1.);

    vec3 emissiveColor = uEmissiveColor.rgb;

    //
    // NOTE: raymarch block
    //

    vec3 rayOrigin = uViewPosition;
    vec3 rayDirection = getPerspectiveCameraRayDir(vUv, uViewDirection, uFov, uAspect);

    vec2 result = vec2(0.);
    float accLen = uNearClip;
    vec3 currentRayPosition = rayOrigin;
    float minDistance = EPS;
    for (int i = 0; i < SI; i++) {
        currentRayPosition = rayOrigin + rayDirection * accLen;
        result = dfScene(currentRayPosition);
        accLen += result.x;
        if (accLen > uFarClip || result.x <= minDistance) {
            break;
        }
    }

    if (result.x > minDistance) {
        discard;
    }

    // 既存の深度値と比較して、奥にある場合は破棄する
    float rawDepth = texelFetch(uDepthTexture, ivec2(gl_FragCoord.xy), 0).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    float currentDepth = viewZToLinearDepth((uViewMatrix * vec4(currentRayPosition, 1.)).z, uNearClip, uFarClip);
    if (currentDepth >= sceneDepth) {
        discard;
    }

    vec4 rayClipPosition = uProjectionMatrix * uViewMatrix * vec4(currentRayPosition, 1.);
    float newDepth = (rayClipPosition.z / rayClipPosition.w) * .5 + .5;
    gl_FragDepth = newDepth;

    if (result.x > 0.) {
        worldNormal = getNormalDfScene(currentRayPosition);
    }

    //
    // NOTE: end raymarch block
    //

    // #include <alpha_test_f>
    #include ../partial/alpha-test-fragment.partial.glsl

    resultColor.rgb = gamma(resultColor.rgb);

    outGBufferA = EncodeGBufferA(resultColor.rgb);
    outGBufferB = EncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = EncodeGBufferC(uMetallic, uRoughness);
    outGBufferD = EncodeGBufferD(emissiveColor.rgb);
}
