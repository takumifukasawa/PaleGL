#pragma DEFINES

#include <lighting>
#include <ub>
#include <tone>
#include <gbuffer>
#include <alpha_test>
#include <vcolor_fh>
#include <normal_map_fh>

uniform vec4 uBaseColor;
uniform sampler2D uBaseMap; 
uniform vec4 uBaseMapTiling;
uniform float uSpecularAmount;
uniform samplerCube uEnvMap;
uniform float uAmbientAmount;
uniform float uMetallic;
uniform sampler2D uMetallicMap;
uniform vec4 uMetallicMapTiling;
uniform float uRoughness;
uniform sampler2D uRoughnessMap;
uniform vec4 uRoughnessMapTiling;
uniform vec4 uEmissiveColor;
uniform int uShadingModelId;

#ifdef USE_HEIGHT_MAP
uniform sampler2D uHeightMap;
uniform vec4 uHeightMapTiling;
#endif

#pragma APPEND_UNIFORMS

in vec2 vUv;
in vec3 vNormal;

in vec3 vWorldPosition;

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

#include <gbuffer_o>

void main() {
    vec2 uv = vUv * uBaseMapTiling.xy + uBaseMapTiling.zw;
  
    vec4 baseMapColor = texture(uBaseMap, uv);
    vec4 baseColor = baseMapColor;
   
    vec3 worldNormal = vNormal;
    
    vec4 emissiveColor = vec4(0.);

    // #include <normal_map_f>
    #include ./partial/normal-map-fragment.partial.glsl

#ifdef USE_VERTEX_COLOR
    // 頂点カラーでuniformのcolorは計算済み
    baseColor *= vVertexColor;
    emissiveColor = vVertexEmissiveColor;
#else
    baseColor *= uBaseColor;
    emissiveColor = uEmissiveColor;
#endif

    // surface.specularAmount = uSpecularAmount;

    Surface surface;
    surface.worldPosition = vWorldPosition;
    surface.worldNormal = worldNormal;
    surface.baseColor = baseColor;
    
    // #include <alpha_test_f>
    #include ./partial/alpha-test-fragment.partial.glsl

    baseColor.rgb = gamma(baseColor.rgb);
   
    // TODO: metallic map, rough ness map を使う場合、使わない場合で出し分けたい
    float metallic = uMetallic;
    metallic *= texture(uMetallicMap, uv * uMetallicMapTiling.xy).r;
    float roughness = uRoughness;
    roughness *= texture(uRoughnessMap, uv * uRoughnessMapTiling.xy).r;
    
    emissiveColor.rgb = gamma(emissiveColor.rgb);
    
    #pragma BEFORE_OUT

    outGBufferA = EncodeGBufferA(baseColor.rgb);
    outGBufferB = EncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = EncodeGBufferC(metallic, roughness);
    outGBufferD = EncodeGBufferD(emissiveColor.rgb);
    
    // #ifdef USE_HEIGHT_MAP
    // // outGBufferD = EncodeGBufferD(texture(uHeightMap, uv * uHeightMapTiling.xy + uHeightMapTiling.zw).rgb);
    // // outGBufferD = EncodeGBufferD(texture(uHeightMap, uv * .5).rgb);
    // outGBufferD = EncodeGBufferD(texture(uNormalMap, uv * 1.).rgb);
    // outGBufferD = EncodeGBufferD(-vBinormal);
    // // outGBufferD = EncodeGBufferD(vec3(uv * .1, 1.));
    // #endif
}
