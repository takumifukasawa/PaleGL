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

#ifdef USE_INSTANCING
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
uniform vec4 uBaseMapTiling;
uniform float uSpecularAmount;
uniform float uAmbientAmount;
uniform float uMetallic;
uniform sampler2D uMetallicMap;
uniform vec4 uMetallicMapTiling;
uniform float uRoughness;
uniform sampler2D uRoughnessMap;
uniform vec4 uRoughnessMapTiling;
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
    vec4 resultColor = vec4(0, 0, 0, 1);

    vec2 uv = vUv * uBaseMapTiling.xy + uBaseMapTiling.zw;

    vec4 baseMapColor = texture(uBaseMap, uv);
    vec4 baseColor = uBaseColor * baseMapColor;

    vec3 worldNormal = vNormal;

    // #include <normal_map_f>
    #include ../partial/normal-map-fragment.partial.glsl

    #ifdef USE_VERTEX_COLOR
    baseColor *= vVertexColor;
    #endif
    
    // baseColor = vec4(1.);

    // surface.specularAmount = uSpecularAmount;

    vec3 emissiveColor = uEmissiveColor.rgb;
#ifdef USE_INSTANCING
    emissiveColor = vInstanceEmissiveColor.xyz; // demo用に頂点シェーダー側でblend
#endif

    //
    // NOTE: raymarch block
    //

    vec3 wp = vWorldPosition;
    // vec3 wp = (vWorldMatrix * vec4(vLocalPosition, 1.)).xyz;

    vec3 rayOrigin = wp;
    vec3 rayDirection = uIsPerspective > .5
        ? normalize(wp - uViewPosition)
        : normalize(-uViewPosition);
    float accLen = 0.;
    vec3 currentRayPosition = rayOrigin;
    float minDistance = EPS;
    
    mat4 inverseWorldMatrix = vInverseWorldMatrix;
    // mat4 inverseWorldMatrix = inverse(uWorldMatrix); 


    // vec2 result;
    // for(int i = 0; i < OI; i++) {
    //     currentRayPosition = rayOrigin + rayDirection * accLen;
    //     result = objectSpaceDfScene(currentRayPosition, inverseWorldMatrix, uBoundsScale, uUseWorld);
    //     accLen += result.x;
    //     if(!isDfInnerBox(toLocal(currentRayPosition, inverseWorldMatrix, uBoundsScale), uBoundsScale)) {
    //         break;
    //     }
    //     if(result.x <= minDistance) {
    //         break;
    //     }
    // }

    // if(result.x > minDistance) {
    //     discard;
    // }

    vec2 result = osRaymarch(
        rayOrigin,
        rayDirection,
        minDistance,
        uProjectionMatrix,
        uViewMatrix,
        inverseWorldMatrix,
        uBoundsScale,
        uUseWorld,
        currentRayPosition
    );

    // 既存の深度値と比較して、奥にある場合は破棄する
    float rawDepth = texelFetch(uDepthTexture, ivec2(gl_FragCoord.xy), 0).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    vec4 currentRayViewPosition = (uViewMatrix * vec4(currentRayPosition, 1.));
    float currentDepth = viewZToLinearDepth(currentRayViewPosition.z, uNearClip, uFarClip);
    if(currentDepth >= sceneDepth) {
        discard;
    }
    
    if(result.x > 0.) {
        worldNormal = getNormalObjectSpaceDfScene(currentRayPosition, inverseWorldMatrix, uBoundsScale, uUseWorld);
    }
 
    //
    // NOTE: end raymarch block
    //

    resultColor = baseColor;

    float alpha = resultColor.a;
    #include <alpha_test_f>

    resultColor.rgb = gamma(resultColor.rgb);

    // TODO: metallic map, rough ness map を使う場合、使わない場合で出し分けたい
    float metallic = uMetallic;
    metallic *= texture(uMetallicMap, uv * uMetallicMapTiling.xy).r;
    float roughness = uRoughness;
    roughness *= texture(uRoughnessMap, uv * uRoughnessMapTiling.xy).r;

    outGBufferA = EncodeGBufferA(resultColor.rgb);
    outGBufferB = EncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = EncodeGBufferC(metallic, roughness);
    outGBufferD = EncodeGBufferD(emissiveColor.rgb);
}
