#pragma DEFINES

#include <common>
#include <lighting>
#include <ub>
#include <tone>
#include <depth>
#include <gbuffer>
#include <alpha_test>
#include <vcolor_fh>
#include <normal_map_fh>

#ifdef D_INSTANCING
in float vInstanceId;
in vec4 vInstanceColor;
in vec4 vInstanceEmissiveColor;
in vec4 vInstanceState;
#endif

#pragma BLOCK_BEFORE_RAYMARCH_CONTENT

#include <raymarch_df>

// #pragma BLOCK_RAYMARCH_SCENE
#pragma RAYMARCH_SCENE

#include <raymarch_sf>
#include <os_raymarch_f>

uniform vec4 uBaseColor;
uniform sampler2D uBaseMap;
uniform vec4 uMapTiling;
uniform float uSpecularAmount;
uniform float uAmbientAmount;
uniform float uMetallic;
uniform sampler2D uMetallicMap;
uniform float uRoughness;
uniform sampler2D uRoughnessMap;
uniform vec4 uEmissiveColor;
uniform int uShadingModelId;

#pragma APPEND_UNIFORMS

uniform float uIsPerspective;
uniform float uUseWorld;
uniform vec3 uBoundsScale;

in vec2 vUv;
in vec3 vNormal;

in vec3 vLocalPosition;
in mat4 vWorldMatrix;
in vec3 vWorldPosition;
in mat4 vInverseWorldMatrix;

#pragma GBUFFER_BUILDER_RAYMARCH

#include <gbuffer_o>

void main() {
    vec4 resultColor = vec4(0, 0, 0, 1);

    vec2 uv = vUv * uMapTiling.xy + uMapTiling.zw;

    vec4 baseMapColor = texture(uBaseMap, uv);
    vec4 baseColor = uBaseColor * baseMapColor;

    vec3 worldNormal = vNormal;

    #include <normal_map_f>

    // CUSTOM_BEGIN comment out
    // #ifdef D_VERTEX_COLOR
    // baseColor *= vVertexColor;
    // #endif
    // CUSTOM_END
    
    // baseColor = vec4(1.);

    // surface.smSpecularAmount = uSpecularAmount;

    vec3 emissiveColor = uEmissiveColor.rgb;
#ifdef D_INSTANCING
    emissiveColor = vInstanceEmissiveColor.xyz; // demo用に頂点シェーダー側でblend
#endif

    //
    // NOTE: raymarch block
    //

    vec3 wp = vWorldPosition;
    vec3 currentRayPosition = wp;
    mat4 inverseWorldMatrix = vInverseWorldMatrix;
    vec3 rayDirection = fGetOSRaymarchViewRayDirection(currentRayPosition, uViewPosition, uIsPerspective);

    vec2 result = fOsRaymarch(
        wp,
        rayDirection,
        EPS,
        uViewMatrix,
        uProjectionMatrix,
        vInverseWorldMatrix,
        1.,
        uBoundsScale,
        uUseWorld,
        true,
        currentRayPosition
    );

    fCheckDiscardByCompareRayDepthAndSceneDepth(
        currentRayPosition,
        uDepthTexture,
        uNearClip,
        uFarClip,
        uViewMatrix
    );

    if(result.x > 0.) {
        worldNormal = fGetNormalObjectSpaceDfScene(
            currentRayPosition,
            inverseWorldMatrix,
            uBoundsScale,
            uUseWorld
        );
    }
 
    //
    // NOTE: end raymarch block
    //

    resultColor = baseColor;

    float alpha = resultColor.a;
    #include <alpha_test_f>

    // TODO: metallic map, rough ness map を使う場合、使わない場合で出し分ける？
    float metallic = uMetallic;
    metallic *= texture(uMetallicMap, uv).r;
    float roughness = uRoughness;
    roughness *= texture(uRoughnessMap, uv).r;

    sGBufferSurface gBufferSurface = fBuildGBufferSurface(
        currentRayPosition,
        worldNormal,
        resultColor.xyz,
        metallic,
        roughness,
        emissiveColor
    );
    fOverrideGBufferSurface(gBufferSurface, result);

    #pragma BEFORE_OUT

    // outGBufferA = fEncodeGBufferA(resultColor.rgb);
    // outGBufferB = fEncodeGBufferB(worldNormal, uShadingModelId);
    // outGBufferC = fEncodeGBufferC(metallic, roughness);
    // outGBufferD = fEncodeGBufferD(emissiveColor.rgb);
    
    outGBufferA = fEncodeGBufferA(gBufferSurface.smBaseColor.rgb);
    outGBufferB = fEncodeGBufferB(gBufferSurface.smWorldNormal, uShadingModelId);
    outGBufferC = fEncodeGBufferC(gBufferSurface.smMetallic, gBufferSurface.smRoughness);
    outGBufferD = fEncodeGBufferD(gBufferSurface.smEmissiveColor.rgb);
    
    #pragma END_MAIN
}
