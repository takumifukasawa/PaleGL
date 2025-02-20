const int MAX_ITERATION_NUM = 64;

#include ./partial/common.glsl
#include ./partial/depth-functions.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uDepthTexture;
uniform float uNearClip;
uniform float uFarClip;
uniform mat4 uInverseViewMatrix;
uniform mat4 uInverseProjectionMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

uniform float uRayStep;
uniform float uRayNearOffset;
uniform float uAttenuationBase;
uniform float uAttenuationPower;
uniform float uBlendRate;
uniform float uDepthBias;
uniform float uRayJitterSizeX;
uniform float uRayJitterSizeY;

uniform sampler2D uShadowMap;
uniform mat4 uShadowMapProjectionMatrix;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);
    float rawDepth = texture(uDepthTexture, vUv).r;
    float linearDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    
    vec3 rayOriginInView = vec3(0.);
    vec3 rayEndPositionInView = reconstructViewPositionFromDepth(vUv, rawDepth, uInverseProjectionMatrix);
    
    vec3 rayDirInView = normalize(rayEndPositionInView - rayOriginInView);
    
    float alpha = 0.;
    
    float rayStep = uRayStep;
    
    // vec3 v = (uInverseViewMatrix * vec4(rayEndPositionInView, 1.)).xyz;
    // // outColor = vec4(vec3(step(0., v.x)), 1.);
    // // outColor = vec4(rayDirInView, 1.);
    // outColor = vec4(vec3(step(0., rayDirInView.y)), 1.);
    // if(linearDepth > .99) {
    //     outColor = vec4(vec3(0.), 1.);
    // }
    // return;
   
    vec2 jitterOffset = (rand(vUv * uTime) * 2. - 1.) * vec2(uRayJitterSizeX, uRayJitterSizeY);
    
    for(int i = 0; i < MAX_ITERATION_NUM; i++) {
        vec3 currentRayStep = rayDirInView * vec3(rayStep * float(i) + uRayNearOffset);
        vec3 currentRayPositionInView = rayOriginInView + currentRayStep + vec3(jitterOffset, 0.);
        vec3 currentRayPositionInWorld = (uInverseViewMatrix * vec4(currentRayPositionInView, 1.)).xyz;
        
        vec4 shadowMapUv = uShadowMapProjectionMatrix * vec4(currentRayPositionInWorld, 1.);
        vec3 projectionUv = shadowMapUv.xyz / shadowMapUv.w;
        float shadowAreaRect =
        step(0., projectionUv.x) * (1. - step(1., projectionUv.x)) *
        step(0., projectionUv.y) * (1. - step(1., projectionUv.y)) *
        step(0., projectionUv.z) * (1. - step(1., projectionUv.z));
        // float shadowRate = shadowOccluded * shadowAreaRect;
        
        // float shadowRate = texture(uShadowMap, projectionUv.xy).r * shadowAreaRect;
        float sampleShadow = texture(uShadowMap, projectionUv.xy).r;

        if(
            shadowAreaRect < .5
            || sampleShadow >= 1.
            || (sampleShadow - uDepthBias) >= projectionUv.z
        ) {
            alpha += (1. / uAttenuationBase);
        }
       
        vec4 currentRayInClip = uProjectionMatrix * vec4(currentRayPositionInView, 1.); 
        currentRayInClip.xyz /= currentRayInClip.w;
        float currentRayRawDepth = currentRayInClip.z;
        
        // カメラから遮蔽されているところは打ち切ってもよいはず
        if(currentRayRawDepth >= rawDepth) {
            break;
        }
        
        // TODO: カメラとライトの角度でfalloff
    }
    
    alpha = clamp(alpha, 0., 1.);
    
    alpha = pow(alpha, uAttenuationPower);

    vec3 color = mix(vec3(0.), vec3(1., 1., 1.), alpha * uBlendRate);
 
    outColor = vec4(color, 1.);

    // for debug
    // outColor = vec4(vec3(alpha), 1.);
    // outColor = texture(uShadowMap, vUv);
    // outColor = sceneColor;
    // outColor = vec4(rayDirInView, 1.);
    // outColor = vec4(uAttenuationBase);
    // outColor = sceneColor;
    // outColor = vec4(vec3(eyeDepth), 1.);
    // outColor = vec4(vec3(d), 1.);
}
