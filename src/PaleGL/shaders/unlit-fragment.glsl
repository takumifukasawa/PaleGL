#pragma DEFINES

#include <common>
#include <lighting>
#include <ub>
#include <tone>
#include <gbuffer>
#include <vcolor_fh>
#include <normal_map_fh>

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

#pragma BEGIN_MAIN

void main() {
    vec2 uv = vUv * uBaseMapTiling.xy + uBaseMapTiling.zw;
    
    vec4 baseColor = texture(uBaseMap, uv) * uBaseColor;

    vec3 worldNormal = vNormal;

#ifdef USE_NORMAL_MAP
    worldNormal = fCalcNormal(vNormal, vTangent, vBinormal, uNormalMap, uv);
#else
    worldNormal = normalize(vNormal);
#endif

#ifdef USE_VERTEX_COLOR
    baseColor *= vVertexColor;
#endif

    vec4 resultColor = baseColor;

    #include <alpha_test_f>

    baseColor = fGamma(baseColor); 

    outGBufferA = fEncodeGBufferA(vec3(0.));
    outGBufferB = fEncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = fEncodeGBufferC(0., 0.);
    outGBufferD = fEncodeGBufferD(baseColor.rgb);
    
    // for debug 
    // outGBufferD = fEncodeGBufferD(worldNormal.rgb);
    // outGBufferD = vec4(step(.5, uv.x), 0., 0., 1.);

    #pragma AFTER_OUT
}
