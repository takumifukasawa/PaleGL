#pragma DEFINES

#include <common>
#include <lighting>
#include <ub>
#include <tone>
#include <depth>
#include <alpha_test>
#include <vcolor_fh>

#ifdef USE_INSTANCING
in float vInstanceId;
in vec4 vInstanceColor;
in vec4 vInstanceEmissiveColor;
in vec4 vInstanceState;
#endif

#pragma BLOCK_BEFORE_RAYMARCH_CONTENT

#include <raymarch_df>

// #pragma BLOCK_RAYMARCH_SCENE
#pragma RAYMARCH_SCENE

#include <raymarch_sf>
#include <os_raymarch_f>

uniform vec4 uBaseColor;
uniform sampler2D uBaseMap;
uniform vec4 uBaseMapTiling;
uniform vec4 uEmissiveColor;
uniform int uShadingModelId;

#pragma APPEND_UNIFORMS

uniform float uIsPerspective;
uniform float uUseWorld;
uniform vec3 uBoundsScale;

// transparentの時に使用可能
uniform sampler2D uSceneTexture;

in vec2 vUv;

in vec3 vLocalPosition;
in mat4 vWorldMatrix;
in vec3 vWorldPosition;
in mat4 vInverseWorldMatrix;

out vec4 outColor;

void main() {
    vec4 resultColor = uBaseColor * vec4(0.);

    vec2 uv = vUv * uBaseMapTiling.xy + uBaseMapTiling.zw;

    vec4 baseMapColor = texture(uBaseMap, uv);
    vec4 baseColor = uBaseColor * baseMapColor;

#ifdef USE_VERTEX_COLOR
    baseColor *= vVertexColor;
#endif
    
    vec3 emissiveColor = uEmissiveColor.rgb;
#ifdef USE_INSTANCING
    emissiveColor = vInstanceEmissiveColor.xyz; // demo用に頂点シェーダー側でblend
#endif

    //
    // NOTE: raymarch block
    //

    vec3 wp = vWorldPosition;
    vec3 currentRayPosition = wp;
    vec3 rayDirection = getOSRaymarchViewRayDirection(currentRayPosition, uViewPosition, uIsPerspective);

    osRaymarch(
        wp,
        rayDirection,
        EPS,
        uViewMatrix,
        uProjectionMatrix,
        vInverseWorldMatrix,
        1.,
        uBoundsScale,
        uUseWorld,
        true,
        currentRayPosition
    );
   
    // TODO: unlitでもopaqueの場合は必要なので出し分けたい
    // checkDiscardByCompareRayDepthAndSceneDepth(
    //     currentRayPosition,
    //     uDepthTexture,
    //     uNearClip,
    //     uFarClip,
    //     uViewMatrix
    // );
    
    //
    // NOTE: end raymarch block
    //

    resultColor = baseColor;

    float alpha = resultColor.a;
    #include <alpha_test_f>

    resultColor.rgb = gamma(resultColor.rgb);
    
    #pragma BEFORE_OUT
    
    outColor = resultColor;
    
    #pragma AFTER_OUT
}
