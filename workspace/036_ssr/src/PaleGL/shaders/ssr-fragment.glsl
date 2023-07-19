#version 300 es

precision highp float;

#pragma DEFINES

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uBaseColorTexture;
uniform sampler2D uDepthTexture;
uniform sampler2D uNormalTexture;
uniform float uNearClip;
uniform float uFarClip;
uniform mat4 uTransposeInverseViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uInverseProjectionMatrix;
uniform mat4 uInverseViewProjectionMatrix;
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

uniform float uReflectionAdditionalRate;

#pragma DEPTH_FUNCTIONS

// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float noise(vec2 seed)
{
    return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    float eps = .001;


    int maxIterationNum = 32;
    int binarySearchNum = 8;

    //

    vec2 uv = vUv;

    vec3 worldNormal = normalize(texture(uNormalTexture, uv).xyz * 2. - 1.);
    vec3 viewNormal = normalize((uTransposeInverseViewMatrix * vec4(worldNormal, 1.)).xyz);

    vec4 baseColor = texture(uSrcTexture, uv);
    vec4 cachedBaseColor = baseColor;

    vec3 viewPosition = reconstructViewPositionFromDepth(
        vUv,
        texture(uDepthTexture, uv).r,
        uInverseProjectionMatrix
    );

    vec3 incidentViewDir = normalize(viewPosition);
    vec3 reflectViewDir = reflect(incidentViewDir, viewNormal);
    vec3 rayViewDir = reflectViewDir;

    vec3 rayViewOrigin = viewPosition;

    float rayDeltaStep = uRayMaxDistance / float(maxIterationNum);

    vec3 currentRayInView = rayViewOrigin;

    bool isHit = false;

    float jitter = noise(uv) * 2. - 1.;

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

    // // debugs
    // float sampledDepth = sampleRawDepthByViewPosition(
    //     uDepthTexture,
    //     currentRayInView,
    //     uProjectionMatrix,
    //     vec3(0.)
    // );
    // // currentRayInView = rayViewOrigin;
    // float stepLength = rayDeltaStep * (float(10) + 1.) + uRayNearestDistance;
    // currentRayInView = rayViewOrigin + vec3(jitterOffset, 0.) + rayViewDir * stepLength;
    // vec3 sampledViewPosition = reconstructViewPositionFromDepth(uv, sampledDepth, uInverseProjectionMatrix);
    // vec4 currentRayInClip = uProjectionMatrix * vec4(currentRayInView, 1.);
    // currentRayInClip.xyz = currentRayInClip.xyz / currentRayInClip.w;
    // outColor = vec4(currentRayInClip.xyz, 1.);
    // float dist = sampledViewPosition.z - currentRayInView.z;
    // return;

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
    
    float fadeFactor = 1.;

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
        baseColor += texture(uSrcTexture, rayUV) * fadeFactor * uReflectionAdditionalRate;
        
        // pattern2: [wip] blend reflection
        // baseColor += texture(uSrcTexture, rayUV);
    }

    // outColor = vec4(fadeFactor, 0., 0., 1.);
    // return;
    // 
    // outColor = baseColor;
  
    // return;

    vec4 color = mix(cachedBaseColor, baseColor, uBlendRate);
    outColor = color;
}
