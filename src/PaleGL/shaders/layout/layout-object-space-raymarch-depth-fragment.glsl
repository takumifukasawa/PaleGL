#pragma DEFINES

#include <common>
#include <lighting>
#include <ub>
#include <tone>
#include <depth>
#include <gbuffer>
#include <alpha_test>
#include <vcolor_fh>

#include <surface_h>


#ifdef D_INSTANCING
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

// uniform vec4 uBaseColor;
// uniform sampler2D uBaseMap;
// uniform vec4 uMapTiling;
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
    vec2 uv = vUv * uMapTiling.xy + uMapTiling.zw;

    vec4 baseMapColor = texture(uBaseMap, uv);

    vec4 baseColor = uBaseColor * baseMapColor;

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
    
    fOsRaymarch(
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

    // NOTE: end raymarch block
    //

    float alpha = baseColor.a; // TODO: fbase color を渡して alpha をかける
    #include <alpha_test_f>

    outColor = vec4(1., 1., 1., 1.);
}
