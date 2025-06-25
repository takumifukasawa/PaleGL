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

    #include <alpha_test_f>

    baseColor = gamma(baseColor); 

    outGBufferA = EncodeGBufferA(vec3(0.));
    outGBufferB = EncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = EncodeGBufferC(0., 0.);
    outGBufferD = EncodeGBufferD(baseColor.rgb);
   
    // for debug 
    // outGBufferD = EncodeGBufferD(worldNormal.rgb);

    #pragma AFTER_OUT
}
