#pragma DEFINES

#include <lighting>
#include <ub>
#include <tone>
#include <gbuffer>
#include <vcolor_fh>

uniform vec4 uEmissiveColor;
uniform sampler2D uEmissiveMap;
uniform vec4 uEmissiveMapTiling;
uniform int uShadingModelId;

#include <alpha_test>

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

#include <gbuffer_o>

void main() {
    vec2 uv = vUv * uEmissiveMapTiling.xy + uEmissiveMapTiling.zw;
    
    vec4 emissiveColor = texture(uEmissiveMap, uv) * uEmissiveColor;

    vec3 worldNormal = vNormal;

#ifdef USE_NORMAL_MAP
    worldNormal = calcNormal(vNormal, vTangent, vBinormal, uNormalMap, uv);
#else
    worldNormal = normalize(vNormal);
#endif

#ifdef USE_VERTEX_COLOR
    emissiveColor *= vVertexColor;
#endif

    vec4 resultColor = emissiveColor; // for alpha test

    #include ./partial/alpha-test-fragment.partial.glsl

    emissiveColor = gamma(emissiveColor);

    outGBufferA = EncodeGBufferA(vec3(0.));
    outGBufferB = EncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = EncodeGBufferC(0., 0.);
    outGBufferD = EncodeGBufferD(emissiveColor.rgb);
}
