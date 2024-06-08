#version 300 es

precision highp float;

#pragma DEFINES

in vec2 vUv;

out vec4 outColor;

#include ./partial/noise.glsl

#include ./partial/uniform-block-common.glsl
#include ./partial/uniform-block-transformations.glsl
#include ./partial/uniform-block-camera.glsl

uniform sampler2D uDepthTexture;
uniform sampler2D uGBufferBTexture;
uniform vec3 uJitterSize;
uniform float uStrength;
uniform float uBlendRate;

#include ./partial/depth-functions.glsl

void main() {

    float occludedAcc = 0.;
    int samplingCount = 6;

    float eps = .0001;

    vec2 uv = vUv;
    
    vec3 lightPos = vec3(0., .5, 0.);


    float rawDepth = texture(uDepthTexture, uv).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    
    if(sceneDepth > .999) {
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

    vec3 rayOrigin = lightPos + jitterOffset * uJitterSize;
    vec3 diff = worldPosition - lightPos;
    
    vec3 rayDir = normalize(diff);
    // vec3 step = diff / float(MARCH_COUNT);
    float stepLength = length(diff) / float(MARCH_COUNT);
    float sharpness = .5 / float(MARCH_COUNT);
    
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

        // rayの深度がピクセルの深度より大きい場合、遮蔽されてるとみなす
        if(currentRayRawDepth > currentRawDepthInPixel + .001) {
            occlusion += sharpness;
        }
    }
    // #pragma UNROLL_END
    
    occlusion *= uStrength;

    outColor = vec4(vec3(occlusion), 1.);
}
