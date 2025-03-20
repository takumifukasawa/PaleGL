#pragma DEFINES

#include <common>
#include <lighting>
#include <ub>
#include <depth>
#include <alpha_test>
#include <vcolor_fh>

#ifdef USE_INSTANCING
in float vInstanceId;
in vec4 vInstanceState;
#endif

#pragma BLOCK_BEFORE_RAYMARCH_CONTENT

// raymarch
#include <raymarch_df>

// #pragma BLOCK_RAYMARCH_SCENE
#pragma RAYMARCH_SCENE

#include <raymarch_sf>
#include <os_raymarch_f>

uniform vec4 uBaseColor;
uniform sampler2D uBaseMap;
uniform vec4 uBaseMapTiling;
uniform float uIsPerspective;
uniform float uUseWorld;
uniform vec3 uBoundsScale;

in vec2 vUv;
in vec3 vLocalPosition;
in mat4 vWorldMatrix;
in vec3 vWorldPosition;
in mat4 vInverseWorldMatrix;

out vec4 outColor;

void main() {
    vec2 uv = vUv * uBaseMapTiling.xy + uBaseMapTiling.zw;

    vec4 baseMapColor = texture(uBaseMap, uv);

    vec4 baseColor = uBaseColor * baseMapColor;

    #ifdef USE_VERTEX_COLOR
    baseColor *= vVertexColor;
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
    float accLen = 0.;
    vec3 currentRayPosition = rayOrigin;
    float minDistance = EPS;

    mat4 inverseWorldMatrix = vInverseWorldMatrix;
    // mat4 inverseWorldMatrix = inverse(uWorldMatrix);
    
    // for(int i = 0; i < OI; i++) {
    //     currentRayPosition = rayOrigin + rayDirection * accLen;
    //     result = objectSpaceDfScene(currentRayPosition, inverseWorldMatrix, uBoundsScale, uUseWorld);
    //     accLen += result.x;
    //     if(!isDfInnerBox(toLocal(currentRayPosition, inverseWorldMatrix, uBoundsScale), uBoundsScale)) {
    //         break;
    //     }
    //     if(result.x <= minDistance) {
    //         break;
    //     }
    // }

    // if(result.x > minDistance) {
    //     discard;
    // }
   
    vec2 result = osRaymarch(
        rayOrigin,
        rayDirection,
        minDistance,
        uProjectionMatrix,
        uViewMatrix,
        inverseWorldMatrix,
        uBoundsScale,
        uUseWorld,
        currentRayPosition
    );

    // NOTE: depthの場合はいらないがメモを残す
    // 既存の深度値と比較して、奥にある場合は破棄する
    // float rawDepth = texelFetch(uDepthTexture, ivec2(gl_FragCoord.xy), 0).x;
    // float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    // vec4 currentRayViewPosition = (uViewMatrix * vec4(currentRayPosition, 1.));
    // float currentDepth = viewZToLinearDepth(currentRayViewPosition.z, uNearClip, uFarClip);
    // if(currentDepth >= sceneDepth) {
    //     discard;
    // }

    //
    // NOTE: end raymarch block
    //

    float alpha = baseColor.a; // TODO: base color を渡して alpha をかける
    #include <alpha_test_f>

    outColor = vec4(1., 1., 1., 1.);
}
