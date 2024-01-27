#version 300 es

precision mediump float;

#pragma DEFINES

// -----------------------------------------------------------
// struct
// -----------------------------------------------------------

#include ./partial/lighting.glsl

// #include ./partial/directional-light-struct.glsl

#include ./partial/camera-struct.glsl

struct Surface {
    vec3 worldNormal;
    vec3 worldPosition;
    vec4 diffuseColor;
    float specularAmount;
};
        
struct Skybox {
    samplerCube cubeMap;
    float diffuseIntensity;
    float specularIntensity;
    float rotationOffset;
    float maxLodLevel;
};

// -----------------------------------------------------------
// functions
// -----------------------------------------------------------

// #include ./partial/pseudo-hdr.glsl       
        
// #pragma DEPTH_FUNCTIONS
#include ./partial/depth-functions.glsl

// #include ./partial/env-map-fragment-functions.glsl

// #ifdef USE_RECEIVE_SHADOW
// vec4 applyShadow(vec4 surfaceColor, sampler2D shadowMap, vec4 shadowMapUv, float shadowBias, vec4 shadowColor, float shadowBlendRate) {
//     vec3 projectionUv = shadowMapUv.xyz / shadowMapUv.w;
//     vec4 projectionShadowColor = texture(shadowMap, projectionUv.xy);
//     float sceneDepth = projectionShadowColor.r;
//     float depthFromLight = projectionUv.z;
//     float shadowOccluded = clamp(step(0., depthFromLight - sceneDepth - shadowBias), 0., 1.);
//     float shadowAreaRect =
//     step(0., projectionUv.x) * (1. - step(1., projectionUv.x)) *
//     step(0., projectionUv.y) * (1. - step(1., projectionUv.y)) *
//     step(0., projectionUv.z) * (1. - step(1., projectionUv.z));
//     float shadowRate = shadowOccluded * shadowAreaRect;
//     
//     vec4 resultColor = vec4(1.);
//     resultColor.xyz = mix(
//         surfaceColor.xyz,
//         mix(surfaceColor.xyz, shadowColor.xyz, shadowBlendRate),
//         shadowRate
//     );
//     resultColor.a = surfaceColor.a;
//     
//     return resultColor;
// }
// #include ./partial/receive-shadow-fragment-functions.glsl
// #endif
#include ./partial/receive-shadow-fragment-functions.glsl


// -----------------------------------------------------------
// varyings
// -----------------------------------------------------------

in vec2 vUv;
#include ./partial/receive-shadow-fragment-varyings.glsl

// -----------------------------------------------------------
// uniforms
// -----------------------------------------------------------

// #include ./partial/directional-light-uniforms.glsl
uniform DirectionalLight uDirectionalLight;
// TODO: spot light の最大数はどこかで定数管理したい
#define MAX_SPOT_LIGHT_COUNT 4
uniform SpotLight uSpotLight[MAX_SPOT_LIGHT_COUNT];

#include ./partial/receive-shadow-fragment-uniforms.glsl

#ifdef USE_RECEIVE_SHADOW
uniform mat4 uShadowCameraViewMatrix;
uniform mat4 uShadowCameraProjectionMatrix;
uniform mat4 uShadowMapProjectionMatrix;
uniform mat4 uShadowMapInverseViewProjectionMatrix;
uniform mat4 uShadowMapTextureMatrix;
uniform float uShadowCameraNearClip;
uniform float uShadowCameraFarClip;
#endif

uniform vec3 uViewPosition;

// TODO
// uniform sampler2D uAOTexture; 
uniform sampler2D uGBufferATexture;
uniform sampler2D uGBufferBTexture;
uniform sampler2D uGBufferCTexture;
uniform sampler2D uGBufferDTexture;
uniform sampler2D uDepthTexture;
uniform sampler2D uAmbientOcclusionTexture;
// uniform sampler2D uShadowMap;
// uniform samplerCube uEnvMap;

uniform float uNearClip;
uniform float uFarClip;

uniform float uTime;

uniform mat4 uInverseViewProjectionMatrix;
       
// TODO: loop
uniform Skybox uSkybox;

#include ./partial/gbuffer-functions.glsl
        
layout (location = 0) out vec4 outColor;

void main() {
    float eps = .0001;

    vec4 resultColor = vec4(0, 0, 0, 1);

    vec2 uv = vUv;

    GBufferA gBufferA = DecodeGBufferA(uGBufferATexture, uv);
    GBufferB gBufferB = DecodeGBufferB(uGBufferBTexture, uv);
    GBufferC gBufferC = DecodeGBufferC(uGBufferCTexture, uv);
    GBufferD gBufferD = DecodeGBufferD(uGBufferDTexture, uv);
       
    // TODO: use encode func
    // surface
    vec3 baseColor = gBufferA.baseColor;
    float metallic = gBufferC.metallic;
    float roughness = gBufferC.roughness;
    vec3 emissiveColor = gBufferD.emissiveColor;
    float shadingModelId = gBufferB.shadingModelId;
    vec3 worldNormal = gBufferB.normal;
    
    // depth
    float rawDepth = texture(uDepthTexture, uv).r; 
    float depth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    
    // geometry
    vec3 worldPosition = reconstructWorldPositionFromDepth(uv, rawDepth, uInverseViewProjectionMatrix);
    
    // depth guard
    if(step(rawDepth, 1. - eps) < .5) {
        outColor = vec4(baseColor, 1.);
        // 疑似HDRする場合
        // outColor = encodePseudoHDR(baseColor);
        return;
    }
    
    // unlit guard
    // unlit shading model id = 2
    if(1.5 < shadingModelId && shadingModelId < 2.5) {
        resultColor = vec4(emissiveColor, 1.);
        // TODO: unlitの場合って receive shadow なくてもいいよね？
// #ifdef USE_RECEIVE_SHADOW
//         vec4 shadowMapProjectionUv = uShadowMapProjectionMatrix * vec4(worldPosition, 1.);
//         if(dot(surface.worldNormal, uDirectionalLight.direction) > 0.) {
//             resultColor = applyShadow(resultColor, uShadowMap, shadowMapProjectionUv, uShadowBias, vec4(0., 0., 0., 1.), 0.5);
//         }
// #endif
        outColor = resultColor;
        return;
    }
   
    // for debug
    // outColor = vec4(baseColor, 1.);
    // outColor = vec4(baseColor, 1.);
    // outColor = vec4(vec3(metallic), 1.);
    // return;
    // outColor = vec4(vec3(step(1.5, shadingModelId)), 1.);
    // return;
    
    float aoRate = texture(uAmbientOcclusionTexture, uv).r;

    // for debug
    // outColor = vec4(worldPosition, 1.);
    // outColor = vec4(vec3(depth), 1.);
    // outColor = vec4(mod(uTime, 1.), 1., 1., 1.);
    // outColor = vec4(uViewPosition, 1.);
    // outColor = vec4(vec3(aoRate), 1.);
    // return;

    Surface surface;
    surface.worldPosition = worldPosition;
    surface.worldNormal = worldNormal;
    surface.diffuseColor = vec4(baseColor, 1.);
   
    // TODO: bufferから引っ張ってくる
    surface.specularAmount = .5;

    Camera camera;
    camera.worldPosition = uViewPosition;
   
    // phong
    // directional light
    // resultColor = calcDirectionalLight(surface, uDirectionalLight, camera);
    
    // pbr
    GeometricContext geometry;
    geometry.position = surface.worldPosition;
    geometry.normal = surface.worldNormal;
    geometry.viewDir = normalize(camera.worldPosition - surface.worldPosition);
    Material material;
    vec3 albedo = baseColor;
    material.baseColor = albedo;
    material.diffuseColor = mix(albedo, vec3(0.), metallic); // 金属は拡散反射しない
    material.specularColor = mix(vec3(.04), albedo, metallic); // 非金属でも4%は鏡面反射をさせる（多くの不導体に対応）
    material.roughness = roughness;
    material.metallic = metallic;
    ReflectedLight reflectedLight = ReflectedLight(vec3(0.), vec3(0.), vec3(0.), vec3(0.));
    // TODO: なくていい？
    float opacity = 1.;
        
    IncidentLight directLight;

    // directional light
    // TODO: directional light num
    DirectionalLight directionalLight;
    directionalLight.direction = uDirectionalLight.direction;
    directionalLight.color = uDirectionalLight.color;
    directionalLight.intensity = uDirectionalLight.intensity;
    // getDirectionalLightIrradiance(directionalLight, geometry, directLight);
    // RE_Direct(directLight, geometry, material, reflectedLight);

    // TODO: ponit light なくていいかも
    // point light
    // PointLight pointLight;
    // pointLight.position = uDirectionalLight.direction * 5.;
    // pointLight.color = uDirectionalLight.color;
    // pointLight.distance = 100.;
    // pointLight.attenuation = 1.;
    // getPointLightIrradiance(pointLight, geometry, directLight);
    // RE_Direct(directLight, geometry, material, reflectedLight);
    
    // spot light
    // for(int i = 0; i < MAX_SPOT_LIGHT_COUNT; i++) {
    for(int i = 0; i < 1; i++) { // TODO: fallbackしてるだけ. 存在しないライトを計算しないようにするため
        SpotLight spotLight;
        spotLight.position = uSpotLight[i].position;
        spotLight.direction = uSpotLight[i].direction;
        spotLight.color = uSpotLight[i].color;
        spotLight.distance = uSpotLight[i].distance;
        spotLight.attenuation = uSpotLight[i].attenuation;
        spotLight.coneCos = uSpotLight[i].coneCos;
        spotLight.penumbraCos = uSpotLight[i].penumbraCos;
        spotLight.intensity = uSpotLight[i].intensity;
        getSpotLightIrradiance(spotLight, geometry, directLight);
        RE_Direct(directLight, geometry, material, reflectedLight);
    }
    

    // ambient light
// TODO: IBL for pbr
// #ifdef USE_ENV_MAP
    SkyboxLight skyboxLight;
    // skyboxLight.cubeMap = uSkybox.cubeMap;
    skyboxLight.diffuseIntensity = uSkybox.diffuseIntensity;
    skyboxLight.specularIntensity = uSkybox.specularIntensity;
    skyboxLight.rotationOffset = uSkybox.rotationOffset;
    skyboxLight.maxLodLevel = uSkybox.maxLodLevel;
    IncidentSkyboxLight directSkyboxLight;
    getSkyboxLightIrradiance(skyboxLight, geometry, directSkyboxLight);
    RE_DirectSkyboxFakeIBL(uSkybox.cubeMap, directSkyboxLight, geometry, material, reflectedLight);

// #endif

// calc render equations

vec3 outgoingLight =
    reflectedLight.directDiffuse +
    reflectedLight.directSpecular +
    reflectedLight.indirectDiffuse +
    reflectedLight.indirectSpecular;
resultColor = vec4(outgoingLight, opacity);
    // debug start
    // outColor.xyz = vec3(uSpotLight[0].direction);
    // outColor.xyz = directLight.color.xyz;
    // outColor.xyz = directLight.direction.xyz;
    // outColor.xyz = reflectedLight.directDiffuse.xyz;
    // return;
    // debug end

// TODO: 影を落としたいmaterialとそうじゃないmaterialで出し分けたい
// TODO: shadow map の枚数
#ifdef USE_RECEIVE_SHADOW
    vec4 shadowMapProjectionUv = uShadowMapProjectionMatrix * vec4(worldPosition, 1.);
    // if(dot(surface.worldNormal, uDirectionalLight.direction) > 0.) {
    // if(dot(surface.worldNormal, -uSpotLight[0].direction) >= 0.) {
        // TODO: blend rate は light か何かに持たせたい
        resultColor = applyShadow(
            uv,
            resultColor,
            surface.worldPosition,
            uSpotLight[0].position,
            uShadowMap,
            uShadowCameraViewMatrix,
            uShadowCameraProjectionMatrix,
            uShadowMapProjectionMatrix,
            uShadowMapInverseViewProjectionMatrix,
            shadowMapProjectionUv,
            uShadowMapTextureMatrix,
            uShadowBias,
            uShadowCameraNearClip,
            uShadowCameraFarClip,
            vec4(0., 0., 0., 1.),
            0.5
        );
    // }
    // outColor = resultColor;
    // outColor = resultColor;
    // outColor.a = 1.;
    // return;
#endif

    // TODO: aoを考慮したライティング計算
    resultColor.xyz *= aoRate;
  
    // 自己発光も足す。1より溢れている場合はbloomで光が滲む感じになる
    resultColor.xyz += emissiveColor;
    
    outColor = resultColor;

    // 疑似HDRの場合
    // outColor = encodePseudoHDR(resultColor.xyz);

    // for debug
    // outColor = vec4(outgoingLight, 1.);
    // outColor = vec4(worldNormal, 1.);
    // outColor = vec4(depth, 1., 1., 1.);

    // // TODO: use encode func
    // // surface
    // vec3 baseColor = gBufferA.baseColor;
    // float metallic = gBufferC.metallic;
    // float roughness = gBufferC.roughness;
    // vec3 emissiveColor = gBufferD.emissiveColor;
    // float shadingModelId = gBufferB.shadingModelId;
    // vec3 worldNormal = gBufferB.normal * 2. - 1.;
    // float rawDepth = texture(uDepthTexture, uv).r;
    // float depth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    // vec3 worldPosition = reconstructWorldPositionFromDepth(uv, rawDepth, uInverseViewProjectionMatrix);

}
