﻿#version 300 es

precision highp float;

#pragma DEFINES
#include ./defines-light.glsl
#define MARCH_COUNT 64

// TODO: spot light の最大数はどこかで定数管理したい
// #define MAX_SPOT_LIGHT_COUNT 1

#include ./partial/common.glsl
// #include ./partial/lighting.glsl

// 
// TODO: このblock、lighting用の構造体とある程度共通化できそう？
// struct SpotLight {
//     vec3 position;
//     vec3 direction; // spotlightの向き先
//     // vec4 color;
//     // vec4 uSpotLightColor;
//     float intensity;
//     float distance;
//     float attenuation;
//     float coneCos;
//     float penumbraCos;
//     mat4 shadowMapProjectionMatrix;
//     // float shadowBias;
// };

// 光源からの光が届くかどうかを判定
bool testLightInRange(const in float lightDistance, const in float cutoffDistance) {
    return any(bvec2(cutoffDistance == 0., lightDistance < cutoffDistance));
}

// 光源からの減衰率計算
float punctualLightIntensityToIrradianceFactor(const in float lightDistance, const in float cutoffDistance, const in float attenuationComponent) {
    if (attenuationComponent > 0.) {
        return pow(saturate(-lightDistance / cutoffDistance + 1.), attenuationComponent);
    }

    return 1.;
}

// TODO: ここまで

in vec2 vUv;

out vec4 outColor;

#include ./partial/uniform-block-common.glsl
#include ./partial/uniform-block-transformations.glsl
#include ./partial/uniform-block-camera.glsl
#include ./partial/uniform-block-spot-light.glsl

uniform sampler2D uSrcTexture;
uniform sampler2D uGBufferATexture;
uniform sampler2D uDepthTexture; // camera depth
uniform sampler2D uVolumetricDepthTexture;
// uniform mat4 uTransposeInverseViewMatrix;
// uniform mat4 uViewProjectionMatrix;
// uniform mat4 uInverseViewProjectionMatrix;
// uniform mat4 uInverseViewMatrix;
// uniform mat4 uInverseProjectionMatrix;
uniform float uBlendRate;
// uniform float uTime;

// uniform SpotLight uSpotLight[MAX_SPOT_LIGHT_COUNT];
uniform sampler2D uSpotLightShadowMap[MAX_SPOT_LIGHT_COUNT];
uniform float uDensityMultiplier;
uniform float uRayStep;
uniform float uRayJitterSizeX;
uniform float uRayJitterSizeY;

#include ./partial/depth-functions.glsl

#include ./partial/gbuffer-functions.glsl

// voidでもいいが手動unrollの関係でバグるのでfloatで返す
vec2 calcTransmittance(
    SpotLight spotLight,
    sampler2D spotLightShadowMap,
    vec3 rayPosInWorld,
    vec3 rayPosInView,
    float viewZFromDepth
    // out float fogColor,
    // out float fogRate
) {
    vec2 result = vec2(0.);
    
    vec4 shadowPos = spotLight.shadowMapProjectionMatrix * vec4(rayPosInWorld, 1.);
    vec3 shadowCoord = shadowPos.xyz / shadowPos.w;
    vec3 shadowUv = shadowCoord;
    float shadowZ = shadowPos.z / shadowPos.w;
    float shadowDepth = texture(spotLightShadowMap, shadowUv.xy).r;
    float isShadowArea =
        step(0., shadowUv.x) * (1. - step(1., shadowUv.x)) *
        step(0., shadowUv.y) * (1. - step(1., shadowUv.y)) *
        step(0., shadowUv.z) * (1. - step(1., shadowUv.z));

    vec3 rayToLight = spotLight.position - rayPosInWorld;
    vec3 PtoL = normalize(rayToLight);
    vec3 LtoP = -PtoL;
    float lightDistance = length(rayToLight);
    float angleCos = dot(normalize(LtoP), spotLight.direction);

    float spotEffect = smoothstep(spotLight.coneCos, spotLight.penumbraCos, angleCos);
    float attenuation = punctualLightIntensityToIrradianceFactor(lightDistance, spotLight.distance, spotLight.attenuation);
   
    if(abs(rayPosInView.z) < viewZFromDepth) {
        if(all(
            bvec4(
                angleCos > spotLight.coneCos,
                testLightInRange(lightDistance, spotLight.distance),
                shadowDepth > shadowZ, // 深度がray.zよりも近い場合は光の影響を受けているとみなす
                shadowDepth < 1. // 1の時は影の影響を受けていないとみなす. ただし、床もcastshadowしておいた方がよい
            )
        )) {
            // tmp
            // transmittance += exp(-density); // TODO: 指数減衰使いたい
            // TODO: マジックナンバーなのをやめたい 
            // TODO: 指数減衰使いたい
            // fogColor += (1. / 16.) * attenuation * spotEffect * isShadowArea; // cheap decay
            result.x = (1. / 16.) * attenuation * spotEffect * isShadowArea; // cheap decay
        }
    }

    // TODO: マジックナンバーなのをやめたい 
    // fogRate += (1. / 64.) * attenuation * spotEffect * isShadowArea;
    // fogRate += (1. / 64.) * attenuation * spotEffect * isShadowArea * uDensityMultiplier;
    result.y = (1. / 64.) * attenuation * spotEffect * isShadowArea * uDensityMultiplier;
    
    // for debug
    // fogRate = spotLight.direction.x;
    // fogRate += spotEffect;
    // fogRate += attenuation;
    // fogRate += isShadowArea; 
    // fogRate += rayStep;

    // tmp
    // rayStep += uRayStep;
    
    return result;
}

void main() {
    vec2 uv = vUv;

    float jitter = noise(uv + uTime) * 2. - 1.;
    // float jitter = noise(uv + vec2(noise(gl_FragCoord.xy))) * 2. - 1.;

    vec2 jitterOffset = vec2(
        jitter * uRayJitterSizeX,
        jitter * uRayJitterSizeY * uViewport.z
    );

    // outColor = vec4(vUv, 1., 1.);
    // outColor = texture(uGBufferATexture, vUv);
    // GBufferA gBufferA = DecodeGBufferA(texture(uGBufferATexture, uv));
    GBufferA gBufferA = DecodeGBufferA(uGBufferATexture, uv);
    // float rawDepth = texture(uSpotLightShadowMap[0], uv).r;
    float rawDepth = texture(uDepthTexture, uv).r;

    // pattern_1: geometry from gbuffer
    // vec3 worldPosition = reconstructWorldPositionFromDepth(uv, rawDepth, uInverseViewProjectionMatrix);
    // pattern_22: geometry from frustum
    float rawDepthFrustum = texture(uVolumetricDepthTexture, vUv).r;
    float sceneDepthFrustum = perspectiveDepthToLinearDepth(rawDepthFrustum, uNearClip, uFarClip);
    vec3 worldPositionFrustum = reconstructWorldPositionFromDepth(
        vUv,
        texture(uVolumetricDepthTexture, vUv).x,
        uInverseViewProjectionMatrix
    );
    vec3 worldPosition = worldPositionFrustum;

    // mask by frustum depth 
    // if(step(1. - 1e-6, sceneDepthFrustum) > .5) {
    //     outColor = vec4(0., 0., 0., 1.);
    //     return;
    // }

    //
    // pattern_1: ワールド座標系でカメラの位置からレイを飛ばす
    //
    // vec3 rayOrigin = uViewPosition + vec3(jitterOffset, 0.);
    // vec3 rayDir = normalize(viewDirInWorld);
    // vec3 vpos = vec3(uv * 2. - 1., 1.);
    // vec3 viewDir = (uInverseProjectionMatrix * vpos.xyzz * uFarClip).xyz;
    // vec3 viewDirInWorld = (uInverseViewMatrix * vec4(viewDir, 0.)).xyz;
    // // float viewDirInWorldLength = length(viewDirInWorld);
    //
    // pattern_2: frustumの位置からレイを飛ばす
    //
    vec3 rayOrigin = worldPosition + vec3(jitterOffset, 0.);
    // vec3 rayDir = normalize(worldPosition - uViewPosition);
    vec3 rayDir = normalize(rayOrigin - uViewPosition);
    // rayDir = uViewDirection;

    // vec3 rayPos = vec3(0.);
    // float distane = 0.;
    float rayStep = 0.;

    vec4 accColor = vec4(vec3(0.), 1.);
    float transmittance = 0.; // fogの透過度

    // vec3[MAX_SPOT_LIGHT_COUNT] rayPosArray;
    // float[MAX_SPOT_LIGHT_COUNT] rayStepArray;
    // vec4[MAX_SPOT_LIGHT_COUNT] accColorArray;
    float[MAX_SPOT_LIGHT_COUNT] fogColorArray;
    float[MAX_SPOT_LIGHT_COUNT] fogRateArray;

    vec3 rayPosInWorld;
    vec3 rayPosInView;
    float viewZFromDepth = perspectiveDepthToEyeDepth(rawDepth, uNearClip, uFarClip);
    vec2 transmittanceResult = vec2(0.);
 
    // float rayStep = 0.;
  
    for(int i = 0; i < MARCH_COUNT; i++) {
        rayStep = uRayStep * float(i);
        rayPosInWorld = rayOrigin + rayDir * rayStep;
        rayPosInView = (uViewMatrix * vec4(rayPosInWorld, 1.)).xyz;
        #pragma UNROLL_START
        for(int j = 0; j < MAX_SPOT_LIGHT_COUNT; j++) {
            transmittanceResult = calcTransmittance(
                uSpotLight[UNROLL_j],
                uSpotLightShadowMap[UNROLL_j],
                rayPosInWorld,
                rayPosInView,
                viewZFromDepth
                // fogColorArray[UNROLL_j],
                // fogRateArray[UNROLL_j]
            );
            fogColorArray[UNROLL_j] += transmittanceResult.x;
            fogRateArray[UNROLL_j] += transmittanceResult.y;
        }
        #pragma UNROLL_END
    }
   
    // for debug 
    // outColor = vec4(vec3(fogRateArray[0]), 1.);
    // return;
    
    vec4 fogColor = vec4(0.);
    float fogRate = 0.;
  
    vec4 currentFogColor = vec4(0.); 
    float currentFogRate = 0.; 
    
    #pragma UNROLL_START
    for(int i = 0; i < MAX_SPOT_LIGHT_COUNT; i++) {
    // for(int i = 0; i < 2; i++) {
        // TODO: intensityそのままかけるのよくない気がする
        // // accColor.xyz +=
        //     // saturate(fogColorArray[UNROLL_i] * uSpotLight[UNROLL_i].intensity * uBlendRate) *
        //     // fogColorArray[UNROLL_i] * saturate(uSpotLight[UNROLL_i].color.xyz);
        // accColor +=
        //     // saturate(fogColorArray[UNROLL_i] * uSpotLight[UNROLL_i].intensity * uBlendRate) *
        //     fogColorArray[UNROLL_i] * uSpotLight[UNROLL_i].intensity * uBlendRate *
        //     fogColorArray[UNROLL_i] * saturate(uSpotLight[UNROLL_i].color);
       
        currentFogRate = fogRateArray[UNROLL_i] * uSpotLight[UNROLL_i].intensity * uBlendRate;
        fogRate += currentFogRate;

        currentFogColor = currentFogRate * uSpotLight[UNROLL_i].color;
        fogColor += currentFogColor;
    }
    #pragma UNROLL_END

    // accColor.a = saturate(fogRate); // TODO: saturateするべき？
    // accColor.a = saturate(fogRate); // TODO: saturateするべき？
    accColor.a = fogRate; // TODO: saturateするべき？
    // accColor.xyz = saturate(vec3(fogRate)); // for debug
    accColor.rgb = fogColor.xyz;

    outColor = accColor;
    
    // for debug
    // outColor = texture(uSrcTexture, vUv);
    // outColor = vec4(vec3(rayOrigin), 1.);
    // outColor = vec4(worldPositionFrustum.xyz, 1.);
}
