#pragma DEFINES

#include <common>
#include <lighting>
#include <ub>
#include <tone>
#include <gbuffer>
// CUSTOM_BEGIN comment out
// #include <alpha_test>
// #include <vcolor_fh>
// CUSTOM_END

#include <surface_h>
uniform int uShadingModelId;

#pragma APPEND_UNIFORMS

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

#pragma GBUFFER_BUILDER_DEFAULT

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

    // CUSTOM_BEGIN comment out
    // #include <alpha_test_f>
    // // #include ./partial/alpha-test-fragment.partial.glsl
    // CUSTOM_END

    // TODO: metallic map, rough ness map を使う場合、使わない場合で出し分ける？
    float metallic = uMetallic;
    metallic *= texture(uMetallicMap, uv).r;
    float roughness = uRoughness;
    roughness *= texture(uRoughnessMap, uv).r;
    
    sGBufferSurface gBufferSurface = fBuildGBufferSurface(
        vWorldPosition,
        worldNormal,
        uv,
        baseColor.xyz,
        metallic,
        roughness,
        emissiveColor.xyz
    );
    fOverrideGBufferSurface(gBufferSurface);
    
    #pragma BEFORE_OUT

    // outGBufferA = fEncodeGBufferA(baseColor.rgb);
    // outGBufferB = fEncodeGBufferB(worldNormal, uShadingModelId);
    // outGBufferC = fEncodeGBufferC(metallic, roughness);
    // outGBufferD = fEncodeGBufferD(emissiveColor.rgb);
   
   
    outGBufferA = fEncodeGBufferA(gBufferSurface.smBaseColor.rgb);
    outGBufferB = fEncodeGBufferB(gBufferSurface.smWorldNormal, uShadingModelId);
    outGBufferC = fEncodeGBufferC(gBufferSurface.smMetallic, gBufferSurface.smRoughness);
    outGBufferD = fEncodeGBufferD(gBufferSurface.smEmissiveColor.rgb);
    
    
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
