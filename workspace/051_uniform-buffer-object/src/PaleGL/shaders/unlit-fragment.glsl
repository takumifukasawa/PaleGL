#version 300 es

precision highp float;

#pragma DEFINES

uniform vec4 uDiffuseColor;
uniform sampler2D uDiffuseMap;
uniform vec2 uDiffuseMapUvScale;
uniform vec4 uEmissiveColor;
uniform int uShadingModelId;

#include ./partial/tone-mapping.glsl

#include ./partial/uniform-block-camera.glsl
// uniform vec3 uViewPosition;

#include ./partial/alpha-test-fragment-uniforms.glsl

#include ./partial/camera-struct.glsl

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

#include ./partial/vertex-color-fragment-varyings.glsl

#include ./partial/gbuffer-functions.glsl

#include ./partial/alpha-test-functions.glsl

#include ./partial/gbuffer-layout.glsl

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

#ifdef USE_ALPHA_TEST
    checkAlphaTest(resultColor.a, uAlphaTestThreshold);
#endif
    
    resultColor.rgb = gamma(resultColor.rgb);
    vec3 emissiveColor = gamma(uEmissiveColor.rgb);
    
    outGBufferA = EncodeGBufferA(resultColor.rgb);
    outGBufferB = EncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = EncodeGBufferC(0., 0.);
    outGBufferD = EncodeGBufferD(emissiveColor);
}
