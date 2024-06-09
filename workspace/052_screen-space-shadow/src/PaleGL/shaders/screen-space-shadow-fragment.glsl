#version 300 es

precision highp float;

#pragma DEFINES

#include ./defines-light.glsl

// -----------------------------------------------------------

in vec2 vUv;

out vec4 outColor;

// -----------------------------------------------------------
// utils
// -----------------------------------------------------------

#include ./partial/common.glsl
#include ./partial/noise.glsl

#include ./partial/depth-functions.glsl

// -----------------------------------------------------------
// uniform block
// -----------------------------------------------------------

#include ./partial/uniform-block-common.glsl
#include ./partial/uniform-block-transformations.glsl
#include ./partial/uniform-block-camera.glsl
#include ./partial/uniform-block-point-light.glsl

// -----------------------------------------------------------

uniform sampler2D uDepthTexture;
uniform sampler2D uGBufferBTexture;
uniform float uBias;
uniform vec3 uJitterSize;
uniform float uSharpness;
uniform float uLengthMultiplier;
uniform float uStrength;

const int MARCH_COUNT = 24;

void calcOcclusion(PointLight pointLight, vec3 worldPosition, vec3 jitterOffset, out float occlusion) {
    vec3 rawLightPos = pointLight.position;

    // TODO: jitterはclipでやるべきかも
    //
    // 1: world space jitter
    //
    vec3 rayOrigin = rawLightPos + jitterOffset * uJitterSize;
    vec3 lightPos = rawLightPos;
    //
    // 2: clip space jitter
    //
    // vec4 rawLightPosInClip = uProjectionMatrix * uViewMatrix * vec4(rawLightPos, 1.);
    // rawLightPosInClip /= rawLightPosInClip.w;
    // rawLightPosInClip.xyz += jitterOffset * uJitterSize;
    // vec4 rawLightPosOffseted = uInverseViewProjectionMatrix * rawLightPosInClip;
    // rawLightPosOffseted /= rawLightPosOffseted.w;
    // vec3 rawLightPosJittered = rawLightPosOffseted.xyz;
    // vec3 rayOrigin = rawLightPosJittered;
    // vec3 lightPos = rawLightPosJittered;

    vec3 diff = worldPosition - lightPos;

    vec3 rayDir = normalize(diff);
    float stepLength = length(diff) * uLengthMultiplier / float(MARCH_COUNT);
    float sharpness = uSharpness / float(MARCH_COUNT);

    // float occlusion = 0.;

    vec3 debugValue = vec3(0.);

    // #pragma UNROLL_START
    for(int i = 0; i < MARCH_COUNT; i++) {
        // rayの深度を計算
        float currentStepLength = stepLength * float(i);
        vec3 currentRay = rayOrigin + rayDir * currentStepLength;
        vec4 currentRayInClip = uProjectionMatrix * uViewMatrix * vec4(currentRay, 1.);
        currentRayInClip /= currentRayInClip.w;
        float currentRayRawDepth = ndcZToRawDepth(currentRayInClip.z);

        // rayのピクセルの深度をdepth_textureから取得
        vec2 rayUv = currentRayInClip.xy * .5 + .5;
        // float currentRawDepthInPixel = texture(uDepthTexture, rayUv).x;
        float currentRawDepthInPixel = textureLod(uDepthTexture, rayUv, 0.).x;

        // TODO: 深度じゃなくてview座標系で調整した方がいいような気もする
        // rayの深度がピクセルの深度より大きい場合、遮蔽されてるとみなす
        if(currentRayRawDepth > currentRawDepthInPixel + uBias) {
            occlusion += sharpness * saturate(pointLight.intensity);
        }
    }
    // #pragma unroll_end
    
    // return occlusion;
}

void main() {
    vec2 uv = vUv;

    float rawDepth = texture(uDepthTexture, uv).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    
    if(sceneDepth > .9999) {
        outColor = vec4(0., 0., 0., 1.);
        return;
    }
    
    vec3 worldPosition = reconstructWorldPositionFromDepth(
        uv,
        texture(uDepthTexture, uv).x,
        uInverseViewProjectionMatrix
    );

    vec3 jitterOffset = normalize(vec3(
        noise(uv + uTime + .1),
        noise(uv + uTime + .2),
        0.
        // noise(uv + uTime + .3)
    ) * 2. - 1.);

    float occlusion = 0.;
    
    for(int i = 0; i < MAX_POINT_LIGHT_COUNT; i++) {
        calcOcclusion(uPointLight[i], worldPosition, jitterOffset, occlusion);
    }

    occlusion *= uStrength;

    outColor = vec4(vec3(occlusion), 1.);
}
