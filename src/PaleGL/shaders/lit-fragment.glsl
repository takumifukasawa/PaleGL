#pragma DEFINES

#include <common>
#include <lighting>
#include <ub>
#include <tone>
#include <gbuffer>
#include <alpha_test>
#include <vcolor_fh>
#include <normal_map_fh>

uniform vec4 uBaseColor;
uniform sampler2D uBaseMap;
uniform vec4 uMapTiling;
uniform float uSpecularAmount;
uniform samplerCube uEnvMap;
uniform float uAmbientAmount;
uniform float uMetallic;
uniform sampler2D uMetallicMap;
uniform float uRoughness;
uniform sampler2D uRoughnessMap;
uniform vec4 uEmissiveColor;
uniform int uShadingModelId;

#ifdef D_HEIGHT_MAP
uniform sampler2D uHeightMap;
#endif

#pragma APPEND_UNIFORMS

in vec2 vUv;
in vec3 vNormal;

in vec3 vWorldPosition;

// #ifdef D_NORMAL_MAP
// vec3 fCalcNormal(vec3 normal, vec3 tangent, vec3 binormal, sampler2D normalMap, vec2 uv) {
//     vec3 n = normalize(normal);
//     vec3 t = normalize(tangent);
//     vec3 b = normalize(binormal);
//     mat3 tbn = mat3(t, b, n);
//     vec3 nt = texture(normalMap, uv).xyz;
//     nt = nt * 2. - 1.;
// 
//     // 2: normal from normal map
//     vec3 resultNormal = normalize(tbn * nt);
//     // blend mesh normal ~ normal map
//     // vec3 resultNormal = mix(normal, normalize(tbn * nt));
//     // vec3 normal = mix(normal, normalize(tbn * nt), 1.);
// 
//     return resultNormal;
// }
// #endif

#include <gbuffer_o>

void main() {
    vec2 uv = vUv * uMapTiling.xy + uMapTiling.zw;
  
    vec4 baseMapColor = texture(uBaseMap, uv);
    vec4 baseColor = baseMapColor;
   
    vec3 worldNormal = vNormal;
    
    vec4 emissiveColor = vec4(0.);

    // #include <normal_map_f>
    #include ./partial/normal-map-fragment.partial.glsl

// CUSTOM_BEGIN comment out
// #ifdef D_VERTEX_COLOR
//     // 頂点カラーでuniformのcolorは計算済み
//     baseColor *= vVertexColor;
//     emissiveColor = vVertexEmissiveColor;
// #else
// CUSTOM_END
    baseColor *= uBaseColor;
    emissiveColor = uEmissiveColor;
// CUSTOM_BEGIN comment out
// #endif
// CUSTOM_END



    // surface.smSpecularAmount = uSpecularAmount;

    // sSurface surface;
    // surface.smWorldPosition = vWorldPosition;
    // surface.smWorldNormal = worldNormal;
    // surface.smBaseColor = baseColor;
    
    #include <alpha_test_f>
    // #include ./partial/alpha-test-fragment.partial.glsl

    // baseColor.rgb = fGamma(baseColor.rgb);
   
    // TODO: metallic map, rough ness map を使う場合、使わない場合で出し分けたい
    float metallic = uMetallic;
    metallic *= texture(uMetallicMap, uv).r;
    float roughness = uRoughness;
    roughness *= texture(uRoughnessMap, uv).r;
    
    // emissiveColor.rgb = fGamma(emissiveColor.rgb);
    
    #pragma BEFORE_OUT

    outGBufferA = fEncodeGBufferA(baseColor.rgb);
    outGBufferB = fEncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = fEncodeGBufferC(metallic, roughness);
    outGBufferD = fEncodeGBufferD(emissiveColor.rgb);
    
    // for debug 
    // outGBufferD = vec4(worldNormal, 1.);
    // #ifdef D_HEIGHT_MAP
    // // outGBufferD = fEncodeGBufferD(texture(uHeightMap, uv).rgb);
    // // outGBufferD = fEncodeGBufferD(texture(uHeightMap, uv * .5).rgb);
    // outGBufferD = fEncodeGBufferD(texture(uNormalMap, uv * 1.).rgb);
    // outGBufferD = fEncodeGBufferD(-vBinormal);
    // // outGBufferD = fEncodeGBufferD(vec3(uv * .1, 1.));
    // #endif
    
    #pragma AFTER_OUT
}
