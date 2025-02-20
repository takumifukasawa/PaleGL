#pragma DEFINES

in vec2 vUv;

out vec4 outColor;

#include ./partial/common.glsl
#include ./partial/noise.glsl

#include ./partial/uniform-block-common.glsl
#include ./partial/uniform-block-transformations.glsl
#include ./partial/uniform-block-camera.glsl

#include ./partial/gbuffer-functions.glsl

uniform sampler2D uSrcTexture;
uniform sampler2D uDepthTexture;
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

// #pragma DEPTH_FUNCTIONS
#include ./partial/depth-functions.glsl

void main() {
    float eps = .001;

    int maxIterationNum = 16;
    int binarySearchNum = 4;

    //

    vec2 uv = vUv;
   
    GBufferA gBufferA = DecodeGBufferA(uGBufferATexture, uv);
    GBufferB gBufferB = DecodeGBufferB(uGBufferBTexture, uv);
    GBufferC gBufferC = DecodeGBufferC(uGBufferCTexture, uv);

    vec3 worldNormal = gBufferB.normal;
    vec3 viewNormal = normalize((uTransposeInverseViewMatrix * vec4(worldNormal, 1.)).xyz);
    
    vec4 baseColor = texture(uSrcTexture, uv);
    vec4 reflectionColor = vec4(0., 0., 0., 1.);

    vec3 viewPosition = reconstructViewPositionFromDepth(
        vUv,
        texture(uDepthTexture, uv).r,
        uInverseProjectionMatrix
    );
   
    // TODO: noiseを計算せずにテクスチャで渡すなりした方がいいはず
    vec3 randomDir = normalize(vec3(
        noise(uv + .1),
        noise(uv + .2),
        noise(uv + .3)
    ) * 2. - 1.);

    vec3 incidentViewDir = normalize(viewPosition);
    vec3 reflectViewDir = reflect(incidentViewDir, viewNormal);
    vec3 rayViewDir = reflectViewDir + randomDir * gBufferC.roughness * uReflectionRoughnessPower;

    vec3 rayViewOrigin = viewPosition;

    float rayDeltaStep = uRayMaxDistance / float(maxIterationNum);

    vec3 currentRayInView = rayViewOrigin;

    bool isHit = false;

    float fadeFactor = 1.;

    float jitter = noise(uv + uTime) * 2. - 1.;

    vec2 jitterOffset = vec2(
        jitter * uReflectionRayJitterSizeX,
        jitter * uReflectionRayJitterSizeY
    );

    float rawDepth = texture(uDepthTexture, uv).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    if (sceneDepth > 1. - eps) {
        outColor = baseColor;
        return;
    }

    for (int i = 0; i < maxIterationNum; i++) {
        float stepLength = rayDeltaStep * (float(i) + 1.) + uRayNearestDistance;
        currentRayInView = rayViewOrigin + vec3(jitterOffset, 0.) + rayViewDir * stepLength;
        // float sampledDepth = texture(uDepthTexture, currentRayInView.xy).r;
        float sampledDepth = sampleRawDepthByViewPosition(
            uDepthTexture,
            currentRayInView,
            uProjectionMatrix,
            vec3(0.)
        );
        vec3 sampledViewPosition = reconstructViewPositionFromDepth(uv, sampledDepth, uInverseProjectionMatrix);

        vec4 currentRayInClip = uProjectionMatrix * vec4(currentRayInView, 1.);
        currentRayInClip.xyz = currentRayInClip.xyz / currentRayInClip.w;

        if (abs(currentRayInClip.x) > 1. || abs(currentRayInClip.y) > 1.) {
            break;
        }

        float dist = sampledViewPosition.z - currentRayInView.z;

        if (uRayDepthBias < dist && dist < uReflectionRayThickness) {
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
            float sampledRawDepth = sampleRawDepthByViewPosition(
                uDepthTexture,
                currentRayInView,
                uProjectionMatrix,
                vec3(0.)
            );
            sampledViewPosition = reconstructViewPositionFromDepth(
                uv,
                sampledRawDepth,
                uInverseProjectionMatrix
            );
            float dist = sampledViewPosition.z - currentRayInView.z;
            stepSign = uRayDepthBias < dist ? -1. : 1.;
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
                gBufferA.baseColor * gBufferC.metallic,
                gBufferC.metallic
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
