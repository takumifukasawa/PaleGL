#pragma DEFINES

#include <lighting>
#include <ub>
#include <tone>
#include <gbuffer>

uniform vec4 uDiffuseColor;
uniform sampler2D uDiffuseMap;
uniform vec2 uDiffuseMapUvScale;
uniform vec4 uEmissiveColor;
uniform int uShadingModelId;

#include <alpha_test>

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

#include ./partial/vertex-color-fragment-varyings.glsl

#include <gbuffer_o>

void main() {
    vec4 resultColor = vec4(0, 0, 0, 1);

    vec2 uv = vUv * uDiffuseMapUvScale;

    vec4 diffuseMapColor = texture(uDiffuseMap, uv);


    vec3 worldNormal = vNormal;

#ifdef USE_NORMAL_MAP
    worldNormal = calcNormal(vNormal, vTangent, vBinormal, uNormalMap, uv);
#else
    worldNormal = normalize(vNormal);
#endif

#ifdef USE_VERTEX_COLOR
    diffuseColor *= vVertexColor;
#endif

    resultColor = diffuseMapColor; 

    float alpha = resultColor.a;
    #include <alpha_test_f>

    resultColor.rgb = gamma(resultColor.rgb);
    vec3 emissiveColor = gamma(uEmissiveColor.rgb);

    outGBufferA = EncodeGBufferA(resultColor.rgb);
    outGBufferB = EncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = EncodeGBufferC(0., 0.);
    // outGBufferD = EncodeGBufferD(emissiveColor);
    outGBufferD = EncodeGBufferD(diffuseMapColor.xyz);
}
