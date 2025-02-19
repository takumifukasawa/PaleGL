#version 300 es
            
precision mediump float;

//
// ref:
// https://techblog.kayac.com/unity-height-related-fog
// https://github.com/hiryma/UnitySamples/blob/master/Fog/Assets/Shaders/Fog.cginc
// https://hikita12312.hatenablog.com/entry/2017/12/30/142137
//

in vec2 vUv;

out vec4 outColor;

#include ./partial/common.glsl
#include ./partial/uniform-block-common.glsl
#include ./partial/uniform-block-transformations.glsl
#include ./partial/uniform-block-camera.glsl

uniform sampler2D uSrcTexture;
uniform sampler2D uLightShaftTexture;
uniform sampler2D uVolumetricLightTexture;
uniform sampler2D uSSSTexture;
uniform sampler2D uDepthTexture;
uniform sampler2D uNoiseTexture;
uniform vec4 uFogColor;
uniform float uFogStrength;
uniform float uFogDensity;
uniform float uFogDensityAttenuation;
uniform float uFogEndHeight;
uniform float uDistanceFogStart;
uniform float uDistanceFogEnd;
uniform float uDistanceFogPower;
uniform float uSSSFogRate;
uniform vec4 uSSSFogColor;
uniform float uBlendRate;
uniform float uTexelSize;

#include ./partial/depth-functions.glsl

// 1に近いほどfogが強い
float calcFogHeightExp(vec3 objectPositionInWorld, vec3 cameraPositionInWorld, float densityY0, float densityAttenuation) {
    vec3 v = cameraPositionInWorld - objectPositionInWorld;
    float l = length(v);
    float ret;
    float tmp = l * densityY0 * exp(-densityAttenuation * objectPositionInWorld.y);
    if(v.y == 0.) {
        ret = exp(-tmp);
    } else {
        float kvy = densityAttenuation * v.y;
        ret = exp(tmp / kvy * (exp(-kvy) - 1.));
    }
    
    return 1. - ret;
}

// 1に近いほどfogが強い
float calcFogHeightUniform(vec3 objectPositionInWorld, vec3 cameraPositionInWorld, float fogDensity, float fogEndHeight) {
    vec3 v = cameraPositionInWorld - objectPositionInWorld;
    float t;
    if(objectPositionInWorld.y < fogEndHeight) {
        if(cameraPositionInWorld.y > fogEndHeight) {
            t = (fogEndHeight - objectPositionInWorld.y) / v.y;
        } else {
            t = 1.;
        }
    } else {
        if(cameraPositionInWorld.y < fogEndHeight) {
            t = (cameraPositionInWorld.y - fogEndHeight) / v.y;
        } else {
            t = 0.;
        }
    }
    float dist = length(v) * t;
    float fog = exp(-dist * fogDensity);
    return 1. - fog;
}

// 1に近いほどfogが強い
float calcDistanceFog(vec3 objectPositionInWorld, vec3 cameraPositionInWorld, float expStart, float fogEnd, float expPower) {
    float dist = length(cameraPositionInWorld - objectPositionInWorld);
    dist = max(0., dist - expStart);
    return max(0., 1. - exp(-dist * expPower)) * smoothstep(expStart, fogEnd, dist);
}

void main() {
    vec2 uv = vUv;
    
    vec4 sceneColor = texture(uSrcTexture, uv);
    vec4 destColor = sceneColor;
    vec4 lightShaftColor = texture(uLightShaftTexture, uv);
    vec4 volumetricLightColor = texture(uVolumetricLightTexture, uv);
    float sssRate = texture(uSSSTexture, uv).r;

    vec2 aspect = vec2(uAspect, 1.);
  
    // 煙っぽい表現
    // 数値は一旦シェーダーの中に入れちゃう
    vec2 viewCoef = uViewDirection.xy * .4;
    float noiseRate1 = texture(uNoiseTexture, (uv + viewCoef + uTime * vec2(.04, .02)) * aspect * 1.2).x;
    float noiseRate2 = texture(uNoiseTexture, (uv + viewCoef + uTime * vec2(-.03, .015) + noiseRate1 * .02) * aspect * 1.2).x;
    float noiseRate = 1. - (noiseRate1 * .13 + noiseRate2 * .17);
    
    // 高ければ高いほど遮蔽されてる
    float occlusion = saturate(lightShaftColor.x);

    float rawDepth = texture(uDepthTexture, uv).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    vec3 viewPositionFromDepth = reconstructViewPositionFromDepth(uv, rawDepth, uInverseProjectionMatrix);
    vec3 worldPositionFromDepth = reconstructWorldPositionFromDepth(uv, rawDepth, uInverseViewProjectionMatrix);
 
    float constantFogScale = .1;
  
    vec3 fogColor = uFogColor.xyz;
    // constant fog
    // TODO: constant fog も考慮すべき？
    // カメラから見て奥は-z
    float rate = constantFogScale * max(0., 1. - exp(-uFogStrength * -viewPositionFromDepth.z));
   
    // height fog
    float fogRate = calcFogHeightExp(worldPositionFromDepth, uViewPosition, uFogDensity, uFogDensityAttenuation);
    fogRate *= 1. - step(1. - .0001, rawDepth);
    // distance fog
    fogRate += calcDistanceFog(worldPositionFromDepth, uViewPosition, uDistanceFogStart, uDistanceFogEnd, uDistanceFogPower);
    // clamp
    fogRate = saturate(fogRate) * noiseRate;

    // TODO: fog->occlusionの方が正しい？
    vec4 applyOcclusionColor = sceneColor * (1. - occlusion);
    outColor = vec4(mix(applyOcclusionColor.xyz, fogColor.xyz, fogRate), 1.);
    
    // volumetric fog
    // TODO: 加算ではなく混ぜる方が正しいはず(手前にvolumetric, 奥にemissiveがある場合、volumetricの方が強いはず)
    // TODO: しかし、どう混ぜるかという問題がある。手前と奥をどう判断するか
    // patter1: add
    outColor += vec4(volumetricLightColor.xyz * noiseRate, 0.);
    // outColor = vec4(mix(sceneColor.xyz, outColor.xyz, 1.), 1.);
    
    // pattern2: mix
    // outColor = vec4(mix(
    //     outColor.xyz,
    //     volumetricLightColor.xyz,
    //     saturate(volumetricLightColor.a)
    // ), 1.);

    // sss fog
    outColor += vec4(uSSSFogColor.xyz * (1. - sssRate) * uSSSFogRate * fogRate, 0.);
    
    // for debug
    // outColor = vec4(vec3(noiseRate2), 1.);
    // outColor = sceneColor;
    // outColor = vec4(vec3(occlusion), 1.);
    // outColor = vec4(vec3(sceneDepth), 1.);
    // outColor = vec4(mix(sceneColor.xyz, fogColor.xyz, rate), 1.);
    // outColor = vec4(applyOcclusionColor.xyz, 1.);
    // outColor = vec4(vec3(fogRate), 1.);
    // outColor = vec4(vec3(worldPositionFromDepth.y), 1.);
    // outColor = vec4(worldPositionFromDepth, 1.);
    // outColor = vec4(vec3(uFogStrength), 1.);
    // outColor = volumetricLightColor;
}           
