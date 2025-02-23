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

uniform vec4 uDiffuseColor;
uniform sampler2D uDiffuseMap;
uniform vec2 uDiffuseMapUvScale;
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
    vec2 uv = vUv * uDiffuseMapUvScale;

    vec4 diffuseMapColor = texture(uDiffuseMap, uv);

    vec4 diffuseColor = uDiffuseColor * diffuseMapColor;

    #ifdef USE_VERTEX_COLOR
    diffuseColor *= vVertexColor;
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
    #include <alpha_test_f>

    outColor = vec4(1., 1., 1., 1.);
    
    // gl_FragDepth = (currentRayProjectionPosition.z / currentRayProjectionPosition.w) * .5 + .5;
}
