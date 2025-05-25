#pragma DEFINES

#include <common>
#include <lighting>
#include <ub>
#include <tone>
#include <gbuffer>
#include <vcolor_fh>

#pragma APPEND_INCLUDE

uniform vec4 uBaseColor;
uniform sampler2D uBaseMap;
uniform vec4 uBaseMapTiling;
uniform int uShadingModelId;

#pragma APPEND_UNIFORMS

#include <alpha_test>

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

#pragma APPEND_VARYINGS

#include <gbuffer_o>

#ifdef USE_VAT
uniform sampler2D uPositionMap;
#endif

#pragma BEGIN_MAIN

void main() {
    vec2 uv = vUv * uBaseMapTiling.xy + uBaseMapTiling.zw;
    
    vec4 baseColor = texture(uBaseMap, uv) * uBaseColor;

    vec3 worldNormal = vNormal;

#ifdef USE_NORMAL_MAP
    worldNormal = calcNormal(vNormal, vTangent, vBinormal, uNormalMap, uv);
#else
    worldNormal = normalize(vNormal);
#endif

#ifdef USE_VERTEX_COLOR
    baseColor *= vVertexColor;
#endif

    vec4 resultColor = baseColor;

    #include ./partial/alpha-test-fragment.partial.glsl

    baseColor = gamma(baseColor);

    outGBufferA = EncodeGBufferA(vec3(0.));
    outGBufferB = EncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = EncodeGBufferC(0., 0.);
    outGBufferD = EncodeGBufferD(baseColor.rgb);

// for debug    
//     // outGBufferD = vec4(vUv,1.,1.);
// #ifdef USE_VAT
//     // outGBufferD = EncodeGBufferD(texture(uPositionMap, vUv).rgb);
//     // outGBufferD = EncodeGBufferD(texture(uBaseMap, vUv).rgb);
//     outGBufferD = vec4(vUv,1.,1.);
//     outGBufferD = EncodeGBufferD(texture(uPositionMap, vUv).xyz);
// #endif
    
    #pragma AFTER_OUT
}
