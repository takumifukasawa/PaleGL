#pragma DEFINES

#include <lighting>
#include <ub>
#include <tone>
#include <gbuffer>
#include <vcolor_fh>

uniform vec4 uDiffuseColor;
uniform sampler2D uDiffuseMap;
uniform vec4 uDiffuseMapTiling;
uniform int uShadingModelId;

#include <alpha_test>

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

#include <gbuffer_o>

void main() {
    vec2 uv = vUv * uDiffuseMapTiling.xy + uDiffuseMapTiling.zw;
    
    vec4 diffuseColor = texture(uDiffuseMap, uv) * uDiffuseColor;

    vec3 worldNormal = vNormal;

#ifdef USE_NORMAL_MAP
    worldNormal = calcNormal(vNormal, vTangent, vBinormal, uNormalMap, uv);
#else
    worldNormal = normalize(vNormal);
#endif

#ifdef USE_VERTEX_COLOR
    diffuseColor *= vVertexColor;
#endif

    vec4 resultColor = diffuseColor; // for alpha test

    #include ./partial/alpha-test-fragment.partial.glsl

    diffuseColor = gamma(diffuseColor);

    outGBufferA = EncodeGBufferA(vec3(0.));
    outGBufferB = EncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = EncodeGBufferC(0., 0.);
    outGBufferD = EncodeGBufferD(diffuseColor.rgb);
}
