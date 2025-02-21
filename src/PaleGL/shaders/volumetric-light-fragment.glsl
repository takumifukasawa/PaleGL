#pragma DEFINES

// #include ./defines-light.glsl

#include <common>
#include <lighting>
#include <ub>
#include <rand>

#define MARCH_COUNT 64
#define MARCH_COUNT_F 64.

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

uniform sampler2D uSrcTexture;
uniform sampler2D uGBufferATexture;
uniform sampler2D uDepthTexture; // camera depth
uniform sampler2D uVolumetricDepthTexture;
uniform float uBlendRate;

uniform sampler2D uSpotLightShadowMap[MAX_SPOT_LIGHT_COUNT];
uniform float uDensityMultiplier;
uniform float uRayStep;
uniform vec3 uRayJitterSize;

#include ./partial/depth-functions.glsl

#include ./partial/gbuffer-functions.glsl

// voidでもいいが手動unrollの関係でバグるのでfloatで返す
float calcTransmittance(
    SpotLight spotLight,
    sampler2D spotLightShadowMap,
    vec3 rayPosInWorld,
    vec3 rayPosInView,
    float viewZFromDepth
) {
    float rate = 0.;
    
    vec4 rayPosInProjectionTexture = spotLight.shadowMapProjectionMatrix * vec4(rayPosInWorld, 1.);
    vec3 projectionCoord = rayPosInProjectionTexture.xyz / rayPosInProjectionTexture.w;
    vec3 shadowUv = projectionCoord;
    float rayDepthInProjection = rayPosInProjectionTexture.z / rayPosInProjectionTexture.w;
    float spotLightShadowDepth = texture(spotLightShadowMap, shadowUv.xy).r;
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
        // tmp
        // if(all(
        //     bvec4(
        //         angleCos > spotLight.coneCos,
        //         testLightInRange(lightDistance, spotLight.distance),
        //         spotLightShadowDepth > rayDepthInProjection, // 深度がray.zよりも近い場合は光の影響を受けているとみなす
        //         spotLightShadowDepth < 1. // 1の時は影の影響を受けていないとみなす. ただし、床もcastshadowしておいた方がよい
        //     )
        // )) {
        //     // TODO: 指数減衰使いたい
        //     rate = (1. / MARCH_COUNT_F) * attenuation * spotEffect * isShadowArea * uDensityMultiplier;
        // }
        
        if(all(bvec2(
            angleCos > spotLight.coneCos,
            testLightInRange(lightDistance, spotLight.distance)
        ))) {
            if(all(bvec2(
                spotLightShadowDepth < rayDepthInProjection, // 深度がray.zよりも近い場合は光の影響を受けているとみなす
                spotLightShadowDepth < 1. // 1の時は影の影響を受けていないとみなす. ただし、床もcastshadowしておいた方がよい
            ))) {
            } else {
                // TODO: 指数減衰使いたい
                rate += (1. / MARCH_COUNT_F) * attenuation * spotEffect * isShadowArea * uDensityMultiplier;
            }
        }
    }
    
    return rate;
}

void main() {
    vec2 uv = vUv;

    GBufferA gBufferA = DecodeGBufferA(uGBufferATexture, uv);
    float rawDepth = texture(uDepthTexture, uv).r;

    float jitter = rand(uv + uTime) * 2. - 1.;
    // vec3 jitterOffset = vec3(
    //     jitter * uRayJitterSize.x,
    //     jitter * uRayJitterSize.y * uViewport.z,
    //     jitter * uRayJitterSize.z
    // );
    // vec3 jitterOffset = uRayJitterSize * jitter * vec3(1., uViewport.z, 1.);
    vec3 jitterOffset = uRayJitterSize * jitter * vec3(1., 1., 1.);

    // // pattern_1: geometry from gbuffer
    // vec3 worldPosition = reconstructWorldPositionFromDepth(uv, rawDepth, uInverseViewProjectionMatrix);
    // pattern_2: geometry from frustum
    float rawDepthFrustum = texture(uVolumetricDepthTexture, vUv).r;
    float sceneDepthFrustum = perspectiveDepthToLinearDepth(rawDepthFrustum, uNearClip, uFarClip);
    vec3 worldPositionFrustum = reconstructWorldPositionFromDepth(
        vUv,
        texture(uVolumetricDepthTexture, vUv).x,
        uInverseViewProjectionMatrix
    );
    vec3 worldPosition = worldPositionFrustum;

    //
    // pattern_1: ワールド座標系でカメラの位置からレイを飛ばす
    // カメラの距離が変わるときに弱い
    //
    vec3 vpos = vec3(uv * 2. - 1., 1.);
    vec3 viewDir = (uInverseProjectionMatrix * vpos.xyzz * uFarClip).xyz;
    vec3 viewDirInWorld = (uInverseViewMatrix * vec4(viewDir, 0.)).xyz;
    vec3 rayDir = normalize(viewDirInWorld);
    vec3 rayOrigin = uViewPosition + jitterOffset * rayDir.xyz;
    // vec3 rayOrigin = uViewPosition + jitterOffset * rayDir.yxz; // TODO: こっちの方がきれいかも
    // pattern_1: end

    // //
    // // pattern_2: frustumの位置からレイを飛ばす
    // // カメラの距離が変わっても一定のfogは出るが、重なり部分がちょっとうまくいってない
    // //
    // vec3 rayOrigin = worldPosition + vec3(jitterOffset, 0.);
    // vec3 rayDir = normalize(rayOrigin - uViewPosition);
    // // pattern_2: end

    float rayStep = 0.;

    vec4 accColor = vec4(vec3(0.), 1.);
    float transmittance = 0.; // fogの透過度

    float[MAX_SPOT_LIGHT_COUNT] fogRateArray;

    vec3 rayPosInWorld;
    vec3 rayPosInView;
    float viewZFromDepth = perspectiveDepthToEyeDepth(rawDepth, uNearClip, uFarClip);
 
    for(int i = 0; i < MARCH_COUNT; i++) {
        rayStep = uRayStep * float(i);
        rayPosInWorld = rayOrigin + rayDir * rayStep;
        rayPosInView = (uViewMatrix * vec4(rayPosInWorld, 1.)).xyz;
        #pragma UNROLL_START MAX_SPOT_LIGHT_COUNT
            fogRateArray[UNROLL_N] += calcTransmittance(
                uSpotLight[UNROLL_N],
                uSpotLightShadowMap[UNROLL_N],
                rayPosInWorld,
                rayPosInView,
                viewZFromDepth
            );
        #pragma UNROLL_END
    }
   
    // for debug 
    // outColor = vec4(vec3(fogRateArray[0]), 1.);
    // return;
    
    vec4 fogColor = vec4(0.);
    float fogRate = 0.;
  
    vec4 currentFogColor = vec4(0.); 
    float currentFogRate = 0.; 
    
        // TODO: intensityそのままかけるのよくない気がする
        // // accColor.xyz +=
        //     // saturate(fogColorArray[UNROLL_i] * uSpotLight[UNROLL_i].intensity * uBlendRate) *
        //     // fogColorArray[UNROLL_i] * saturate(uSpotLight[UNROLL_i].color.xyz);
        // accColor +=
        //     // saturate(fogColorArray[UNROLL_i] * uSpotLight[UNROLL_i].intensity * uBlendRate) *
        //     fogColorArray[UNROLL_i] * uSpotLight[UNROLL_i].intensity * uBlendRate *
        //     fogColorArray[UNROLL_i] * saturate(uSpotLight[UNROLL_i].color);

    #pragma UNROLL_START MAX_SPOT_LIGHT_COUNT
        currentFogRate = fogRateArray[UNROLL_N] * uSpotLight[UNROLL_N].intensity * uBlendRate;
        fogRate += currentFogRate;

        currentFogColor = currentFogRate * uSpotLight[UNROLL_N].color;
        fogColor += currentFogColor;
    #pragma UNROLL_END

    accColor.a = fogRate; // TODO: saturateするべき？
    accColor.rgb = fogColor.xyz;
   
    accColor.a = 1.; // TODO: いる？
    outColor = accColor;
    
    // for debug
    // outColor = texture(uSrcTexture, vUv);
    // outColor = vec4(vec3(rayOrigin), 1.);
    // outColor = vec4(worldPositionFrustum.xyz, 1.);
}
