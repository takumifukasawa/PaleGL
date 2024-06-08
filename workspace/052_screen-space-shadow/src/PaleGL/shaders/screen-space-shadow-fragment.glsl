#version 300 es

precision highp float;

#pragma DEFINES

in vec2 vUv;

out vec4 outColor;

#include ./partial/uniform-block-transformations.glsl
#include ./partial/uniform-block-camera.glsl

uniform sampler2D uDepthTexture;
uniform sampler2D uGBufferBTexture;
uniform float uBlendRate;

#include ./partial/depth-functions.glsl

void main() {

    float occludedAcc = 0.;
    int samplingCount = 6;

    float eps = .0001;

    vec2 uv = vUv;
    
    vec3 lightPos = vec3(0., .5, -1.);
    
    float rawDepth = texture(uDepthTexture, uv).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    
    if(sceneDepth > .999) {
        outColor = vec4(0., 0., 0., 1.);
        return;
    }
    
    vec3 worldNormal = normalize(texture(uGBufferBTexture, uv).xyz * 2. - 1.);
    vec3 viewNormal = normalize((uTransposeInverseViewMatrix * vec4(worldNormal, 1.)).xyz);
    
    // vec3 viewPosition = reconstructViewPositionFromDepth(
    //     uv,
    //     texture(uDepthTexture, uv).x,
    //     uInverseProjectionMatrix
    // );
    vec3 worldPosition = reconstructWorldPositionFromDepth(
        uv,
        texture(uDepthTexture, uv).x,
        uInverseViewProjectionMatrix
    );
    
    const int MARCH_COUNT = 32;
    
    // 1: light to P
    vec3 rayOrigin = lightPos;
    vec3 diff = worldPosition - lightPos;
    // 2: P to light
    // vec3 rayOrigin = worldPosition;
    // vec3 diff = lightPos - worldPosition;
    
    vec3 rayDir = normalize(diff);
    // vec3 step = diff / float(MARCH_COUNT);
    float stepLength = length(diff) / float(MARCH_COUNT);
    float sharpness = 2. / float(MARCH_COUNT);
    
    float occlusion = 0.;

    // for debug
    // // rayの深度を計算
    // // vec3 currentStep = step * float(0);
    // // currentStep = diff;
    // float currentStepLength = stepLength * float(MARCH_COUNT);
    // vec3 currentRay = rayOrigin + rayDir * currentStepLength;
    // // vec3 currentRay = rayOrigin + currentStep;
    // vec4 currentRayInClip = uProjectionMatrix * uViewMatrix * vec4(currentRay, 1.);
    // currentRayInClip /= currentRayInClip.w;
    // float currentRayRawDepth = currentRayInClip.z;
    // float currentRayDepth = perspectiveDepthToLinearDepth(currentRayRawDepth, uNearClip, uFarClip);
    // vec2 rayUv = currentRayInClip.xy * .5 + .5;
    // float currentRawDepthInPixel = textureLod(uDepthTexture, rayUv, 0.).x;
    // outColor = vec4(vec3(perspectiveDepthToLinearDepth(currentRayRawDepth, uNearClip, uFarClip)), 1.);
    // outColor = vec4(vec3(perspectiveDepthToLinearDepth(currentRawDepthInPixel, uNearClip, uFarClip)), 1.);
    // // outColor = vec4(vec2(rayUv), 1., 1.);
    // return;

    // tmp
  
    // #pragma UNROLL_START
    for(int i = 0; i < MARCH_COUNT; i++) {
        // rayの深度を計算
        float currentStepLength = stepLength * float(i);
        vec3 currentRay = rayOrigin + rayDir * currentStepLength;
        vec4 currentRayInClip = uProjectionMatrix * uViewMatrix * vec4(currentRay, 1.);
        currentRayInClip /= currentRayInClip.w;
        float currentRayRawDepth = currentRayInClip.z;
        float currentRayDepth = perspectiveDepthToLinearDepth(currentRayRawDepth, uNearClip, uFarClip);
        
        // rayのピクセルの深度をdepth_textureから取得
        // float currentDepthInPixel = texture(uDepthTexture, currentRayInClip.xy * .5 + .5).x;
        vec2 rayUv = currentRayInClip.xy * .5 + .5;
        float currentRawDepthInPixel = texture(uDepthTexture, rayUv).x;
        // float currentRawDepthInPixel = textureLod(uDepthTexture, rayUv, 0.).x;
        float currentDepthInPixel = perspectiveDepthToLinearDepth(currentRawDepthInPixel, uNearClip, uFarClip);
        
        // rayの深度がピクセルの深度より大きい場合、遮蔽されてるとみなす
        if(currentRayDepth > currentDepthInPixel) {
            occlusion += sharpness;
            // occlusion = 1.;
        }
    }
    // #pragma UNROLL_END
    // 
    // outColor = vec4(worldNormal, 1.);
    // outColor = vec4(vec3(sceneDepth), 1.);
    // outColor = vec4(rayDir, 1.);
    // outColor = vec4(worldPosition, 1.);
    outColor = vec4(vec3(occlusion), 1.);
}
