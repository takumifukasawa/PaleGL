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

#include ./partial/noise.glsl

#include ./partial/depth-functions.glsl

// -----------------------------------------------------------
// uniform block
// -----------------------------------------------------------

#include ./partial/uniform-block-common.glsl
#include ./partial/uniform-block-transformations.glsl
#include ./partial/uniform-block-camera.glsl
#include ./partial/uniform-block-spot-light.glsl

// -----------------------------------------------------------

uniform sampler2D uDepthTexture;
uniform sampler2D uGBufferBTexture;
uniform float uBias;
uniform vec3 uJitterSize;
uniform float uSharpness;
uniform float uLengthMultiplier;
uniform float uStrength;

void main() {
    vec2 uv = vUv;
    
    vec3 rawLightPos = vec3(0., .5, 0.);

    float rawDepth = texture(uDepthTexture, uv).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    
    if(sceneDepth > .9999) {
        outColor = vec4(0., 0., 0., 1.);
        return;
    }
    
    vec3 worldNormal = normalize(texture(uGBufferBTexture, uv).xyz * 2. - 1.);
    vec3 viewNormal = normalize((uTransposeInverseViewMatrix * vec4(worldNormal, 1.)).xyz);
    
    vec3 worldPosition = reconstructWorldPositionFromDepth(
        uv,
        texture(uDepthTexture, uv).x,
        uInverseViewProjectionMatrix
    );
    
    const int MARCH_COUNT = 24;

    vec3 jitterOffset = normalize(vec3(
        noise(uv + uTime + .1),
        noise(uv + uTime + .2),
        0.
        // noise(uv + uTime + .3)
    ) * 2. - 1.);

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
    
    float occlusion = 0.;

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
            occlusion += sharpness;
        }
    }
    // #pragma UNROLL_END
    
    occlusion *= uStrength;

    outColor = vec4(vec3(occlusion), 1.);
}
