#pragma DEFINES

#include <common>
#include <lighting>
#include <ub>
#include <tone>
#include <gbuffer>
// CUSTOM_BEGIN comment out
// #include <vcolor_fh>
// CUSTOM_END

// CUSTOM_BEGIN comment out
// #pragma APPEND_INCLUDE
// CUSTOM_END

uniform vec4 uBaseColor;
uniform sampler2D uBaseMap;
uniform vec4 uMapTiling;
uniform int uShadingModelId;

// CUSTOM_BEGIN comment out
// #pragma APPEND_UNIFORMS
// CUSTOM_END

// CUSTOM_BEGIN comment out
// #include <alpha_test>
// CUSTOM_END

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

// CUSTOM_BEGIN comment out
// #pragma APPEND_VARYINGS
// CUSTOM_END

#include <gbuffer_o>

// CUSTOM_BEGIN comment out
// #pragma BEGIN_MAIN
// CUSTOM_END

void main() {
    vec2 uv = vUv * uMapTiling.xy + uMapTiling.zw;
    
    vec4 baseColor = texture(uBaseMap, uv) * uBaseColor;

    vec3 worldNormal = normalize(vNormal);

// CUSTOM_BEGIN comment out
// #ifdef D_VERTEX_COLOR
//     baseColor *= vVertexColor;
// #endif
// CUSTOM_END

    vec4 resultColor = baseColor;

    // CUSTOM_BEGIN comment out
    // #include <alpha_test_f>
    // CUSTOM_END

    // baseColor = fGamma(baseColor); 
    
    outGBufferA = fEncodeGBufferA(vec3(0.));
    outGBufferB = fEncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = fEncodeGBufferC(0., 0.);
    outGBufferD = fEncodeGBufferD(baseColor.rgb);
    
    // for debug 
    // outGBufferD = fEncodeGBufferD(worldNormal.rgb);
    // outGBufferD = vec4(step(.5, uv.x), 0., 0., 1.);

    // CUSTOM_BEGIN comment out
    // #pragma AFTER_OUT
    // CUSTOM_END
}
