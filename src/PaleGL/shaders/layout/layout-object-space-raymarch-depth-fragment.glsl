#pragma DEFINES

in vec2 vUv;
in vec3 vLocalPosition;
in vec3 vNormal;
in mat4 vWorldMatrix;
in vec3 vWorldPosition;
in mat4 vInverseWorldMatrix;

#include <common>
#include <lighting>
#include <ub>
#include <tone>
#include <depth>
#include <gbuffer>
// CUSTOM_BEGIN comment out
// #include <alpha_test>
// #include <vcolor_fh>
// CUSTOM_END

#include <surface_h>

#include <inst_fh>
// #ifdef D_INSTANCING
// in float vInstanceId;
// // in vec4 vInstanceState;
// #endif

#pragma BLOCK_BEFORE_RAYMARCH_CONTENT

// raymarch
#include <raymarch_df>

// #pragma BLOCK_RAYMARCH_SCENE
#pragma RAYMARCH_SCENE

#include <raymarch_sf>
#include <os_raymarch_f>

#pragma GBUFFER_BUILDER_RAYMARCH

// TODO: surfaceもdefineで置き換える方向にする
// #if !defined(D_OVERRIDE_SURFACE)
// void fOverrideGBufferSurface(
//     inout sGBufferSurface s,
//     vec2 raymarchResult
// ) {}
// #endif

#ifndef D_OVERRIDE_DEPTH
void fOverrideGBufferDepth(
    inout sGBufferDepth s,
    vec2 raymarchResult
) {}
#endif

// uniform vec4 uBaseColor;
// uniform sampler2D uBaseMap;
// uniform vec4 uMapTiling;
uniform float uIsPerspective;
uniform float uUseWorld;
uniform vec3 uBoundsScale;

out vec4 outColor;

void main() {
    vec2 uv = vUv * uMapTiling.xy + uMapTiling.zw;

    vec4 baseMapColor = texture(uBaseMap, uv);
    vec4 baseColor = uBaseColor * baseMapColor;

    vec4 resultColor = baseColor;

// CUSTOM_BEGIN comment out
// #ifdef D_VERTEX_COLOR
//     baseColor *= vVertexColor;
// #endif
// CUSTOM_END

    //
    // NOTE: raymarch block
    //

    vec3 wp = vWorldPosition;
    vec3 currentRayPosition = wp;
    vec3 rayDirection = fGetOSRaymarchViewRayDirection(currentRayPosition, uViewPosition, uIsPerspective);
    
    vec2 result = fOsRaymarch(
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

    sGBufferDepth gBufferDepth = fBuildGBufferDepth(
        currentRayPosition,
        vec2(0.), // uv
        resultColor
    );
    fOverrideGBufferDepth(gBufferDepth, result);

    // CUSTOM_BEGIN comment out
    // float alpha = baseColor.a; // TODO: fbase color を渡して alpha をかける
    // #include <alpha_test_f>
    // CUSTOM_END

    outColor = vec4(1.);
}
