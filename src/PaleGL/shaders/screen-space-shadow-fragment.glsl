#pragma DEFINES

#include <common>
#include <lighting>
#include <ub>
#include <rand>
#include <depth>

const int MARCH_COUNT = 48;

in vec2 vUv;

out vec4 outColor;

// -----------------------------------------------------------

uniform sampler2D uGBufferBTexture;
uniform float uBias;
uniform vec3 uJitterSize;
uniform float uSharpness;
uniform float uStrength;
uniform float uRayStepMultiplier;

void fCalcOcclusion(sPointLight pointLight, vec3 worldPosition, vec3 viewPosition, vec3 jitterOffset, out float occlusion) {
    vec3 rawLightPos = pointLight.smPosition;
    vec3 rawLightPosInView = (uViewMatrix * vec4(pointLight.smPosition, 1.)).xyz;

    // TODO: jitterはviewかclipでやるべきかも
    //
    // 1: world space jitter
    //
    // vec3 rayOrigin = rawLightPos + jitterOffset * uJitterSize * 0.;
    // vec3 lightPos = rawLightPos;
    // vec3 diff = worldPosition - lightPos;
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
    // vec3 diff = worldPosition - lightPos;
    //
    // 3: view space jitter
    //
    vec3 rayOriginInView = rawLightPosInView + jitterOffset * uJitterSize;
    vec3 lightPosInView = rawLightPosInView;
    vec3 diffInView = viewPosition - rayOriginInView;

    vec3 rayDirInView = normalize(diffInView);
    float stepLength = (length(diffInView) / float(MARCH_COUNT)) * uRayStepMultiplier;
    float sharpness = uSharpness / float(MARCH_COUNT);

    // float occlusion = 0.;

    vec3 debugValue = vec3(0.);

    for(int i = 0; i < MARCH_COUNT; i++) {
        // rayの深度を計算
        float currentStepLength = stepLength * float(i);
        vec3 currentRayInView = rayOriginInView + rayDirInView * currentStepLength;
        vec4 currentRayInClip = uProjectionMatrix * vec4(currentRayInView, 1.);
        currentRayInClip /= currentRayInClip.w;
        float currentRayRawDepth = fNdcZToRawDepth(currentRayInClip.z);

        // rayのピクセルの深度をdepth_textureから取得
        vec2 rayUv = currentRayInClip.xy * .5 + .5;
        // float currentRawDepthInPixel = texture(uDepthTexture, rayUv).x;
        float currentRawDepthInPixel = textureLod(uDepthTexture, rayUv, 0.).x;
        vec3 currentViewPositionInPixel = fReconstructViewPositionFromDepth(
            rayUv,
            currentRawDepthInPixel,
            uInverseProjectionMatrix
        );
        
        //
        // 1: 深度で比較
        // rayの深度がピクセルの深度より大きい場合、遮蔽されてるとみなす
        //
        // if(currentRayRawDepth > currentRawDepthInPixel + uBias) {
        //     occlusion += sharpness * saturate(pointLight.smIntensity);
        // }

        //
        // 2: view z で比較
        //
        float dz = abs(currentRayInView.z);
        if(
            dz > abs(currentViewPositionInPixel.z)
        ) {
            // occlusion += sharpness * saturate(pointLight.smIntensity);
            // test fade
            occlusion += sharpness * saturate(pointLight.smIntensity) * (1. - smoothstep(60., 80., dz));
        }
    }
}

void main() {
    vec2 uv = vUv;

    float rawDepth = texture(uDepthTexture, uv).x;
    float sceneDepth = fPerspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    
    if(sceneDepth > .9999) {
        outColor = vec4(0., 0., 0., 1.);
        return;
    }
    
    vec3 worldPosition = fReconstructWorldPositionFromDepth(
        uv,
        texture(uDepthTexture, uv).x,
        uInverseViewProjectionMatrix
    );
    vec3 viewPosition = (uViewMatrix * vec4(worldPosition, 1.)).xyz;
    viewPosition = fReconstructViewPositionFromDepth(
        uv,
        texture(uDepthTexture, uv).x,
        uInverseProjectionMatrix
    );

    float jitterSpeed = 1.;
    vec3 jitterOffset = normalize(vec3(
        fRand(uv + uTime * jitterSpeed + .1),
        fRand(uv + uTime * jitterSpeed + .2),
        // 0.
        fRand(uv + uTime * jitterSpeed + .3)
    ) * 2. - 1.);

    float occlusion = 0.;
   
    // for(int i = 0; i < MAX_POINT_LIGHT_COUNT; i++) {
    // TODO: point light count
    #pragma UNROLL_START 1
        fCalcOcclusion(uPointLight[UNROLL_N], worldPosition, viewPosition, jitterOffset, occlusion);
    #pragma UNROLL_END

    occlusion *= uStrength;

    outColor = vec4(vec3(occlusion), 1.);
    
    // for debug
    // outColor = vec4(vec3(viewPosition), 1.);
}
