#version 300 es

precision mediump float;

#pragma DEFINES

uniform vec4 uDiffuseColor;
uniform sampler2D uDiffuseMap; 
uniform vec2 uDiffuseMapUvScale;
uniform float uSpecularAmount;
uniform samplerCube uEnvMap;
uniform float uAmbientAmount;
uniform float uMetallic;
uniform float uRoughness;
uniform vec4 uEmissiveColor;
uniform int uShadingModelId;

#pragma APPEND_UNIFORMS

#include ./partial/tone-mapping.glsl

#include ./partial/normal-map-fragment-uniforms.glsl

uniform vec3 uViewPosition;

#include ./partial/alpha-test-fragment-uniforms.glsl

#include ./partial/directional-light-struct.glsl
#include ./partial/directional-light-uniforms.glsl

struct Surface {
    vec3 worldNormal;
    vec3 worldPosition;
    vec4 diffuseColor;
    // float specularAmount;
};

#include ./partial/camera-struct.glsl

in vec2 vUv;
in vec3 vNormal;

#include ./partial/normal-map-fragment-varyings.glsl

in vec3 vWorldPosition;

#include ./partial/vertex-color-fragment-varyings.glsl
// layout (location = 3) out vec4 outGBufferD;

#include ./partial/gbuffer-functions.glsl

#ifdef USE_NORMAL_MAP
vec3 calcNormal(vec3 normal, vec3 tangent, vec3 binormal, sampler2D normalMap, vec2 uv) {
    vec3 n = normalize(normal);
    vec3 t = normalize(tangent);
    vec3 b = normalize(binormal);
    mat3 tbn = mat3(t, b, n);
    vec3 nt = texture(normalMap, uv).xyz;
    nt = nt * 2. - 1.;

    // 2: normal from normal map
    vec3 resultNormal = normalize(tbn * nt);
    // blend mesh normal ~ normal map
    // vec3 normal = mix(normal, normalize(tbn * nt));
    // vec3 normal = mix(normal, normalize(tbn * nt), 1.);

    return resultNormal;
}
#endif

#include ./partial/alpha-test-functions.glsl

#include ./partial/gbuffer-layout.glsl

void main() {
    vec4 resultColor = vec4(0, 0, 0, 1);
    
    vec2 uv = vUv * uDiffuseMapUvScale;
  
    vec4 diffuseMapColor = texture(uDiffuseMap, uv);
    vec4 diffuseColor = uDiffuseColor * diffuseMapColor;
   
    vec3 worldNormal = vNormal;
   
#ifdef USE_NORMAL_MAP
    worldNormal = calcNormal(vNormal, vTangent, vBinormal, uNormalMap, uv);
#else
    worldNormal = normalize(vNormal);
#endif  
    
#ifdef USE_VERTEX_COLOR
    diffuseColor *= vVertexColor;
#endif

    // surface.specularAmount = uSpecularAmount;

    Surface surface;
    surface.worldPosition = vWorldPosition;
    surface.worldNormal = worldNormal;
    surface.diffuseColor = diffuseColor;
    
    resultColor = surface.diffuseColor;
    
#ifdef USE_ALPHA_TEST
    checkAlphaTest(resultColor.a, uAlphaTestThreshold);
#endif

    resultColor.rgb = gamma(resultColor.rgb);

    outGBufferA = EncodeGBufferA(resultColor.rgb);
    outGBufferB = EncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = EncodeGBufferC(uMetallic, uRoughness);
    outGBufferD = EncodeGBufferD(uEmissiveColor.rgb);
}
