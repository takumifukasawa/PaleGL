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

// layout (location = 0) out vec4 outGBufferA;
// layout (location = 1) out vec4 outGBufferB;
// layout (location = 2) out vec4 outGBufferC;

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

#ifdef USE_ALPHA_TEST
void checkAlphaTest(float value, float threshold) {
    if(value < threshold) {
        discard;
    }
}
#endif

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

    Surface surface;
    surface.worldPosition = vWorldPosition;
    surface.worldNormal = worldNormal;
    
#ifdef USE_VERTEX_COLOR
    surface.diffuseColor = vVertexColor * uDiffuseColor * diffuseMapColor;
#else
    surface.diffuseColor = uDiffuseColor * diffuseMapColor;
#endif

    // surface.specularAmount = uSpecularAmount;
    
    resultColor = surface.diffuseColor;
    
    // emissiveはそのまま足す
    resultColor += uEmissiveColor;

#ifdef USE_ALPHA_TEST
    checkAlphaTest(resultColor.a, uAlphaTestThreshold);
#endif

    resultColor.rgb = gamma(resultColor.rgb);

    // correct
    // outGBufferA = vec4(resultColor.rgb, 1.);
    // outGBufferB = vec4(worldNormal * .5 + .5, 1.); 
    // outGBufferC = vec4(uMetallic, uRoughness, 0., 1.);
    outGBufferA = EncodeGBufferA(resultColor.rgb);
    outGBufferB = EncodeGBufferB(worldNormal);
    outGBufferC = EncodeGBufferC(uMetallic, uRoughness);
}
