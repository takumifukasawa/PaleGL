#pragma DEFINES

#include <common>
#include <lighting>
#include <ub>
#include <rand>
#include <depth>
#include <tone>
#include <gbuffer>

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uGBufferATexture;
uniform sampler2D uGBufferBTexture;
uniform sampler2D uGBufferCTexture;
uniform float uBlendRate;

uniform float uRayDepthBias;
uniform float uRayNearestDistance;
uniform float uRayMaxDistance;
uniform float uReflectionRayThickness;

uniform float uReflectionRayJitterSizeX;
uniform float uReflectionRayJitterSizeY;

uniform float uReflectionFadeMinDistance;
uniform float uReflectionFadeMaxDistance;

uniform float uReflectionScreenEdgeFadeFactorMinX;
uniform float uReflectionScreenEdgeFadeFactorMaxX;
uniform float uReflectionScreenEdgeFadeFactorMinY;
uniform float uReflectionScreenEdgeFadeFactorMaxY;

uniform float uReflectionRoughnessPower;

uniform float uReflectionAdditionalRate;

const int maxIterationNum = 16;
const int binarySearchNum = 4;

void main() {
    float eps = .001;

    //

    vec2 uv = vUv;
   
    sGBufferA gBufferA = fDecodeGBufferA(uGBufferATexture, uv);
    sGBufferB gBufferB = fDecodeGBufferB(uGBufferBTexture, uv);
    sGBufferC gBufferC = fDecodeGBufferC(uGBufferCTexture, uv);

    vec3 worldNormal = gBufferB.smNormal;
    vec3 viewNormal = normalize((uTransposeInverseViewMatrix * vec4(worldNormal, 1.)).xyz);
    
    vec4 baseColor = texture(uSrcTexture, uv);
    vec4 reflectionColor = vec4(0., 0., 0., 1.);

    vec3 viewPosition = fReconstructViewPositionFromDepth(
        vUv,
        texture(uDepthTexture, uv).r,
        uInverseProjectionMatrix
    );
   
    // TODO: noiseを計算せずにテクスチャで渡すなりした方がいいはず
    vec3 randomDir = normalize(vec3(
        fRand(uv + .1),
        fRand(uv + .2),
        fRand(uv + .3)
    ) * 2. - 1.);

    vec3 incidentViewDir = normalize(viewPosition);
    vec3 reflectViewDir = reflect(incidentViewDir, viewNormal);
    vec3 rayViewDir = reflectViewDir + randomDir * gBufferC.smRoughness * uReflectionRoughnessPower;

    vec3 rayViewOrigin = viewPosition;

    float rayDeltaStep = uRayMaxDistance / float(maxIterationNum);

    vec3 currentRayInView = rayViewOrigin;

    bool isHit = false;

    float fadeFactor = 1.;

    float jitter = fRand(uv + uTime) * 2. - 1.;

    vec2 jitterOffset = vec2(
        jitter * uReflectionRayJitterSizeX,
        jitter * uReflectionRayJitterSizeY
    );

    float rawDepth = texture(uDepthTexture, uv).x;
    float sceneDepth = fPerspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    if (sceneDepth > 1. - eps) {
        outColor = baseColor;
        return;
    }

    for (int i = 0; i < maxIterationNum; i++) {
        float stepLength = rayDeltaStep * (float(i) + 1.) + uRayNearestDistance;
        currentRayInView = rayViewOrigin + vec3(jitterOffset, 0.) + rayViewDir * stepLength;
        // float sampledDepth = texture(uDepthTexture, currentRayInView.xy).r;
        float sampledDepth = fSampleRawDepthByViewPosition(
            uDepthTexture,
            currentRayInView,
            uProjectionMatrix,
            vec3(0.)
        );
        vec3 sampledViewPosition = fReconstructViewPositionFromDepth(uv, sampledDepth, uInverseProjectionMatrix);

        vec4 currentRayInClip = uProjectionMatrix * vec4(currentRayInView, 1.);
        currentRayInClip.xyz = currentRayInClip.xyz / currentRayInClip.w;

        if (abs(currentRayInClip.x) > 1. || abs(currentRayInClip.y) > 1.) {
            break;
        }

        float fdist = sampledViewPosition.z - currentRayInView.z;

        if (uRayDepthBias < fdist && fdist < uReflectionRayThickness) {
            isHit = true;
            break;
        }
    }

    if (isHit) {
        currentRayInView -= rayViewDir * rayDeltaStep;

        float rayBinaryStep = rayDeltaStep;
        float stepSign = 1.;
        vec3 sampledViewPosition = viewPosition;

        for (int i = 0; i < binarySearchNum; i++) {
            rayBinaryStep *= .5 * stepSign;
            currentRayInView += rayViewDir * rayBinaryStep;
            float sampledRawDepth = fSampleRawDepthByViewPosition(
                uDepthTexture,
                currentRayInView,
                uProjectionMatrix,
                vec3(0.)
            );
            sampledViewPosition = fReconstructViewPositionFromDepth(
                uv,
                sampledRawDepth,
                uInverseProjectionMatrix
            );
            float fdist = sampledViewPosition.z - currentRayInView.z;
            stepSign = uRayDepthBias < fdist ? -1. : 1.;
        }

        vec4 currentRayInClip = uProjectionMatrix * vec4(currentRayInView, 1.);
        vec2 rayUV = (currentRayInClip.xy / currentRayInClip.w) * .5 + .5;

        float screenEdgeFadeFactorX = (abs(uv.x * 2. - 1.) - uReflectionScreenEdgeFadeFactorMinX) / max(uReflectionScreenEdgeFadeFactorMaxX - uReflectionScreenEdgeFadeFactorMinX, eps);
        float screenEdgeFadeFactorY = (abs(uv.y * 2. - 1.) - uReflectionScreenEdgeFadeFactorMinY) / max(uReflectionScreenEdgeFadeFactorMaxY - uReflectionScreenEdgeFadeFactorMinY, eps);

        screenEdgeFadeFactorX = 1. - clamp(screenEdgeFadeFactorX, 0., 1.);
        screenEdgeFadeFactorY = 1. - clamp(screenEdgeFadeFactorY, 0., 1.);

        float rayWithSampledPositionDistance = distance(viewPosition, sampledViewPosition);
        float distanceFadeRate = (rayWithSampledPositionDistance - uReflectionFadeMinDistance) / max(uReflectionFadeMaxDistance - uReflectionFadeMinDistance, eps);
        distanceFadeRate = clamp(distanceFadeRate, 0., 1.);
        distanceFadeRate = 1. - distanceFadeRate * distanceFadeRate;

        fadeFactor = distanceFadeRate * screenEdgeFadeFactorX * screenEdgeFadeFactorY;
    
        // pattern1: add reflection
        vec4 surfaceCoefficient = vec4(
            mix(
                vec3(.04),
                gBufferA.smBaseColor * gBufferC.smMetallic,
                gBufferC.smMetallic
            ),
            1.
        );
        reflectionColor += texture(uSrcTexture, rayUV) * surfaceCoefficient * fadeFactor * uReflectionAdditionalRate;
        
        // pattern2: [wip] blend reflection
        // baseColor += texture(uSrcTexture, rayUV);
    }

    vec4 color = mix(baseColor, baseColor + reflectionColor, uBlendRate);
    outColor = color;
    
    // for debug
    // outColor = reflectionColor;
}
