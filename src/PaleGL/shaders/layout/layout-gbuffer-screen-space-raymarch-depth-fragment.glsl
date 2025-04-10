#pragma DEFINES

#include <common>
#include <lighting>
#include <ub>
#include <depth>
#include <alpha_test>

#pragma BLOCK_BEFORE_RAYMARCH_CONTENT

// raymarch
#include <raymarch_df>

#pragma RAYMARCH_SCENE

#include <raymarch_sf>

uniform vec4 uBaseColor;
uniform sampler2D uBaseMap;
uniform vec4 uBaseMapTiling;

in vec2 vUv;

out vec4 outColor;

void main() {
    vec2 uv = vUv * uBaseMapTiling.xy + uBaseMapTiling.zw;

    vec4 baseMapColor = texture(uBaseMap, uv);

    vec4 baseColor = uBaseColor * baseMapColor;

    #ifdef USE_VERTEX_COLOR
    baseColor *= vVertexColor;
    #endif

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

    vec4 resultColor = baseColor;
    // #include <alpha_test_f>
    #include ../partial/alpha-test-fragment.partial.glsl

    outColor = vec4(1., 1., 1., 1.);
}
