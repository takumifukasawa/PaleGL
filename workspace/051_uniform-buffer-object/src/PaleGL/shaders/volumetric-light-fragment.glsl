#version 300 es

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

uniform sampler2D uDepthTexture; // camera depth
uniform sampler2D uGBufferATexture;
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

float calcTransmittance(
    SpotLight spotLight,
    sampler2D spotLightShadowMap,
    vec3 rayOrigin,
    vec3 rayDir,
    out float rayStep,
    out float transmittance
) {
    vec3 rayPos = rayOrigin + rayDir * rayStep;
    vec4 shadowPos = spotLight.shadowMapProjectionMatrix * vec4(rayPos, 1.);
    vec3 shadowCoord = shadowPos.xyz / shadowPos.w;
    // vec3 shadowUv = shadowCoord * .5 + .5;
    vec3 shadowUv = shadowCoord;
    float shadowZ = shadowPos.z / shadowPos.w;
    float shadowDepth = texture(spotLightShadowMap, shadowUv.xy).r;
    float isShadowArea =
        step(0., shadowUv.x) * (1. - step(1., shadowUv.x)) *
        step(0., shadowUv.y) * (1. - step(1., shadowUv.y)) *
        step(0., shadowUv.z) * (1. - step(1., shadowUv.z));

    vec3 rayToLight = spotLight.position - rayPos;
    vec3 PtoL = normalize(rayToLight);
    vec3 LtoP = -PtoL;
    float lightDistance = length(rayToLight);
    float angleCos = dot(normalize(LtoP), spotLight.direction);

    if(all(
        bvec4(
            angleCos > spotLight.coneCos,
            testLightInRange(lightDistance, spotLight.distance),
            shadowDepth > shadowZ, // 深度がray.zよりも近い場合は光の影響を受けているとみなす
            shadowDepth < 1. // 1の時は影の影響を受けていないとみなす. ただし、床もcastshadowしておいた方がよい
        )
    )) {
        float spotEffect = smoothstep(spotLight.coneCos, spotLight.penumbraCos, angleCos);
        float attenuation = punctualLightIntensityToIrradianceFactor(lightDistance, spotLight.distance, spotLight.attenuation);
        // transmittance += (1. / float(MARCH_COUNT)) * attenuation * spotEffect; // cheap decay
        transmittance += (1. / 16.) * attenuation * spotEffect * isShadowArea; // cheap decay
        // transmittance += exp(-density); // TODO: 指数減衰使いたい
    }

    rayStep += uRayStep;
    
    return 0.;
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

    // geometry
    vec3 worldPosition = reconstructWorldPositionFromDepth(uv, rawDepth, uInverseViewProjectionMatrix);

    vec3 vpos = vec3(uv * 2. - 1., 1.);
    vec3 viewDir = (uInverseProjectionMatrix * vpos.xyzz * uFarClip).xyz;
    
    vec3 viewDirInWorld = (uInverseViewMatrix * vec4(viewDir, 0.)).xyz;
    // float viewDirInWorldLength = length(viewDirInWorld);
   
    // ワールド座標系でカメラの位置からレイを飛ばす
    vec3 rayOrigin = uViewPosition + vec3(jitterOffset, 0.);
    vec3 rayDir = normalize(viewDirInWorld);

    // vec3 rayPos = vec3(0.);
    // float distane = 0.;
    float rayStep = 0.;

    vec4 accColor = vec4(vec3(0.), 1.);
    float transmittance = 0.; // fogの透過度

    // vec3[MAX_SPOT_LIGHT_COUNT] rayPosArray;
    float[MAX_SPOT_LIGHT_COUNT] rayStepArray;
    // vec4[MAX_SPOT_LIGHT_COUNT] accColorArray;
    float[MAX_SPOT_LIGHT_COUNT] transmittanceArray;

    vec3 rayPosInWorld;
    vec4 rayPosInView;
    float viewZFromDepth = perspectiveDepthToEyeDepth(rawDepth, uNearClip, uFarClip);
    
    for(int i = 0; i < MARCH_COUNT; i++) {
        #pragma UNROLL_START
        for(int j = 0; j < MAX_SPOT_LIGHT_COUNT; j++) {
            rayPosInWorld = rayOrigin + rayDir * rayStepArray[UNROLL_j];
            rayPosInView = uViewMatrix * vec4(rayPosInWorld, 1.);
            if(abs(rayPosInView.z) < viewZFromDepth) {
                calcTransmittance(
                    uSpotLight[UNROLL_j],
                    uSpotLightShadowMap[UNROLL_j],
                    rayOrigin,
                    rayDir,
                    rayStepArray[UNROLL_j],
                    transmittanceArray[UNROLL_j]
                );
            }
        }
        #pragma UNROLL_END
    }

    #pragma UNROLL_START
    for(int i = 0; i < MAX_SPOT_LIGHT_COUNT; i++) {
    // for(int i = 0; i < 2; i++) {
        // TODO: intensityそのままかけるのよくない気がする
        // transmittanceArray[UNROLL_i] = saturate(transmittanceArray[UNROLL_i] * uSpotLight[UNROLL_i].intensity);
        accColor.xyz +=
            saturate(transmittanceArray[UNROLL_i] * uSpotLight[UNROLL_i].intensity * uBlendRate) *
            transmittanceArray[UNROLL_i] * saturate(uSpotLight[UNROLL_i].color.xyz);
            // saturate(transmittanceArray[UNROLL_i] * uSpotLightIntensity[UNROLL_i]) *
            // transmittanceArray[UNROLL_i] * saturate(uSpotLightColor[UNROLL_i].xyz);
    }
    #pragma UNROLL_END
   
    // transmittance = saturate(transmittance);
    // TODO: rgba255でclampしちゃって大丈夫？光の漏れは考慮しない？
    accColor = saturate(accColor);
    
    // accColor.rgb = vec3(
    //     uSpotLight[0].shadowMapProjectionMatrix[0][3],
    //     uSpotLight[0].shadowMapProjectionMatrix[1][3],
    //     uSpotLight[0].shadowMapProjectionMatrix[2][3]
    // );
   
    // outColor = vec4(vec3(transmittance), 1.);
    outColor = accColor;
}
