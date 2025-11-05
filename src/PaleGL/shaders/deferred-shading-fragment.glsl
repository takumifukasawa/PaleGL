#pragma DEFINES

#include <common>
#include <lighting>
#include <ub>
#include <depth>
#include <gbuffer>
#include <geometry_h>
#include <skybox_h>

// -----------------------------------------------------------
// lighting functions
// -----------------------------------------------------------

//
// ref: https://zenn.dev/mebiusbox/books/619c81d2fbeafd/viewer/7c1069
//

struct sIncidentLight {
    vec3 smColor;
    vec3 smDirection; // 光源への方向
    bool smVisible;
    float smIntensity;
};

struct sReflectedLight {
    vec3 smDirectBase;
    vec3 smDirectSpecular;
    vec3 smIndirectBase;
    vec3 smIndirectSpecular;
};

struct sMaterial {
    vec3 smBaseColor;
    vec3 smSpecularColor;
    float smRoughness;
    float smMetallic;
};

// -------------------------------------------------------------------------------
// lights
// -------------------------------------------------------------------------------

// 光源からの光が届くかどうかを判定
bool fTestLightInRange(const in float lightDistance, const in float cutoffDistance) {
    return any(bvec2(cutoffDistance == 0., lightDistance < cutoffDistance));
}

// 光源からの減衰率計算
float fPunctualLightIntensityToIrradianceFactor(const in float lightDistance, const in float cutoffDistance, const in float attenuationComponent) {
    if (attenuationComponent > 0.) {
        return pow(saturate(-lightDistance / cutoffDistance + 1.), attenuationComponent);
    }

    return 1.;
}

//
// directional light
//

void fGetsDirectionalLightIrradiance(const in sDirectionalLight directionalLight, const in sGeometricContext geometry, out sIncidentLight directLight) {
    directLight.smColor = directionalLight.smColor.xyz;
    directLight.smDirection = -directionalLight.smDirection; // 光源への方向にするので反転
    directLight.smVisible = true;
    directLight.smIntensity = directionalLight.smIntensity;
}

//
// spot light
//

void fGetSpotLightIrradiance(const in sSpotLight spotLight, const in sGeometricContext geometry, out sIncidentLight directLight) {
    // vec3 L = spotLight.smPosition - geometry.smPosition;
    vec3 surfaceToLight = spotLight.smPosition - geometry.smPosition;
    vec3 PtoL = normalize(surfaceToLight);
    vec3 LtoP = -PtoL;
    directLight.smDirection = PtoL;
    directLight.smIntensity = spotLight.smIntensity;

    float lightDistance = length(surfaceToLight);
    // float angleCos = dot(directLight.smDirection, spotLight.smDirection);
    float angleCos = dot(LtoP, spotLight.smDirection);

    // directLight.smColor = vec3(lightDistance / 10.);
    // directLight.smColor = vec3(angleCos);
    // return;

    // TODO: 1から引かないようにしたい
    float coneCos = spotLight.smConeCos;
    float penumbraCos = spotLight.smPenumbraCos;

    if (all(
    bvec2(
    angleCos > coneCos,
    fTestLightInRange(lightDistance, spotLight.smDistance)
    )
    )) {
        float spotEffect = smoothstep(coneCos, penumbraCos, angleCos);
        directLight.smColor = spotLight.smColor.xyz;
        directLight.smColor *= spotEffect * fPunctualLightIntensityToIrradianceFactor(lightDistance, spotLight.smDistance, spotLight.smAttenuation);
        directLight.smVisible = true;
    } else {
        directLight.smColor = vec3(0.);
        directLight.smVisible = false;
    }
}

//
// point light
//

void fGetPointLightIrradiance(const in sPointLight pointLight, const in sGeometricContext geometry, out sIncidentLight directLight) {
    vec3 surfaceToLight = pointLight.smPosition - geometry.smPosition;
    float lightDistance = length(surfaceToLight);
    vec3 L = normalize(surfaceToLight);

    directLight.smDirection = L;
    directLight.smIntensity = pointLight.smIntensity;

    if (fTestLightInRange(lightDistance, pointLight.smDistance)) {
        directLight.smColor = pointLight.smColor.xyz;
        directLight.smColor *= fPunctualLightIntensityToIrradianceFactor(lightDistance, pointLight.smDistance, pointLight.smAttenuation);
        directLight.smVisible = true;
    } else {
        directLight.smColor = vec3(0.);
        directLight.smVisible = false;
    }

    // directLight.smColor = vec3(fTestLightInRange(lightDistance, pointLight.smDistance) ? 1. : 0.);

    // for debug
    // directLight.smColor = vec3(1.);
    // directLight.smVisible = true;
    // directLight.smColor = vec3(lightDistance);
    // directLight.smColor = pointLight.smPosition;
}

// -------------------------------------------------------------------------------
// brdfs
// -------------------------------------------------------------------------------

// normalized lambert

vec3 fBaseBRDF(vec3 baseColor) {
    return baseColor / PI;
}

// TODO: schlickの公式まとめる

vec3 fF_Shhlick(vec3 specularColor, vec3 H, vec3 V) {
    return (specularColor + (1. - specularColor) * pow(1. - saturate(dot(V, H)), 5.));
}

// ref: http://d.hatena.ne.jp/hanecci/20130525/p3
vec3 fSchlick(vec3 f0, float product) {
    return f0 + (1. - f0) * pow((1. - product), 5.);
}

float fD_GGX(float a, float dotNH) {
    float a2 = a * a;
    float dotNH2 = dotNH * dotNH;
    float d = dotNH2 * (a2 - 1.) + 1.;
    return a2 / max((PI * d * d), EPSILON);
}

float fG_Smith_Schlick_GGX(float a, float dotNV, float dotNL) {
    float k = a * a * .5 + EPSILON;
    float gl = dotNL / (dotNL * (1. - k) + k);
    float gv = dotNV / (dotNV * (1. - k) + k);
    return gl * gv;
}

// cook-torrance

// vec3 fSpecularBRDF(const in sIncidentLight directLight, const in sGeometricContext geometry, vec3 specularColor, float roughnessFactor) {
vec3 fSpecularBRDF(const vec3 lightDirection, const in sGeometricContext geometry, vec3 specularColor, float roughnessFactor) {
    vec3 N = normalize(geometry.smNormal);
    vec3 V = normalize(geometry.smViewDir);
    vec3 L = normalize(lightDirection);

    float dotNL = saturate(dot(N, L));
    float dotNV = saturate(dot(N, V));
    vec3 H = normalize(L + V);
    float dotNH = saturate(dot(N, H));
    float dotVH = saturate(dot(V, H));
    float dotLV = saturate(dot(L, V));

    float a = roughnessFactor * roughnessFactor;

    float D = fD_GGX(a, dotNH);
    float G = fG_Smith_Schlick_GGX(a, dotNV, dotNL);
    vec3 F = fF_Shhlick(specularColor, V, H);

    return (F * (G * D)) / (4. * dotNL * dotNV + EPSILON);
}

// -------------------------------------------------------------------------------
// render equations
// -------------------------------------------------------------------------------

void fRE_Direct(
    const in sIncidentLight directLight,
    const in sGeometricContext geometry,
    const in sMaterial material,
    inout sReflectedLight reflectedLight,
    const in float shadow
) {
    // directionは光源への方向
    float dotNL = saturate(dot(geometry.smNormal, directLight.smDirection));
    vec3 irradiance = dotNL * directLight.smColor;

    // punctual light
    irradiance *= PI;
    irradiance *= directLight.smIntensity;
    irradiance *= (1. - shadow);

    // fbase
    reflectedLight.smDirectBase +=
        irradiance *
        clamp(
            fBaseBRDF(material.smBaseColor),
            -10.,
            10.
        ); // overflow fallback
    // specular
    // reflectedLight.smDirectSpecular += irradiance * fSpecularBRDF(directLight, geometry, material.smSpecularColor, material.smRoughness);
    reflectedLight.smDirectSpecular +=
        irradiance *
        clamp(
            fSpecularBRDF(
                directLight.smDirection,
                geometry,
                material.smSpecularColor,
                material.smRoughness
            ),
        -10.,
        10.
    ); // overflow fallback
}

// fbase: https://qiita.com/kaneta1992/items/df1ae53e352f6813e0cd
void fRE_DirectSkyboxFakeIBL(
    samplerCube cubeMap,
    const in sIncidentSkyboxLight skyboxLight,
    const in sGeometricContext geometry,
    const in sMaterial material,
    inout sReflectedLight reflectedLight
) {
    //
    // fbase
    //

    vec3 envDiffuseColor = textureLod(
        cubeMap,
        skyboxLight.smDiffuseDirection,
        skyboxLight.smMaxLodLevel
    ).xyz;

    // 拡散: metalness,roughnessを考慮しない
    reflectedLight.smDirectBase +=
        material.smBaseColor
        * envDiffuseColor
        * skyboxLight.smDiffuseIntensity;

    //
    // specular
    //

    // 鏡面反射: roughnes を考慮
    // TODO: metallicも考慮すべき？
    float specularLod = log2(material.smRoughness * pow(2., skyboxLight.smMaxLodLevel));
    vec3 envSpecularColor = textureLod(
        cubeMap,
        skyboxLight.smSpecularDirection,
        specularLod
    ).xyz;

    // vec3 f0 = mix(vec3(.04), material.smBaseColor, material.smMetallic);

    vec3 fresnel = fSchlick(material.smSpecularColor, max(0., dot(geometry.smViewDir, geometry.smNormal)));

    //
    // result
    //

    reflectedLight.smDirectSpecular += mix(
        envSpecularColor * skyboxLight.smSpecularIntensity * material.smSpecularColor,
        envSpecularColor * skyboxLight.smSpecularIntensity,
        fresnel
    );

    // for debug
    // reflectedLight.smDirectSpecular.xyz = envSpecularColor;
    // reflectedLight.smDirectSpecular.xyz = vec3(fresnel);
}


// -----------------------------------------------------------

// ref:
// https://matcha-choco010.net/2020/04/10/opengl-deferred-spot-light-shadow/
// https://www.opengl-tutorial.org/jp/intermediate-tutorials/tutorial-16-shadow-mapping/


const vec2 poissonDisk[4] = vec2[](
    vec2(-0.94201624, -0.39906216),
    vec2(0.94558609, -0.76890725),
    vec2(-0.094184101, -0.92938870),
    vec2(0.34495938, 0.29387760)
);


float fCalcDirectionalLightShadowAttenuation(
    vec3 worldPosition,
    vec3 worldNormal,
    vec3 lightDirection, // 光源自体の向き
    mat4 shadowMapProjectionMatrix,
    sampler2D shadowMap,
    float shadowBias,
    vec4 shadowColor,
    float shadowBlendRate
) {
    float NoL = max(dot(worldNormal, -lightDirection), 0.);
    float bias = .005 * tan(acos(NoL));
    bias = clamp(bias, .1, .5); // 大きくすればするほどアクネは少なくなるが、影の領域が少なくなる
    
    vec4 lightPos = shadowMapProjectionMatrix * vec4(worldPosition, 1.);
    vec2 uv = lightPos.xy;
    float depthFromWorldPos = lightPos.z;

    float shadowAreaSmooth = .25;
    float shadowAreaRect =
        // // 1: step
        // step(0., uv.x) * (1. - step(1., uv.x)) *
        // step(0., uv.y) * (1. - step(1., uv.y)) *
        // step(0., depthFromWorldPos) * (1. - step(1., depthFromWorldPos));
        // 2: smoothstep
        smoothstep(0., shadowAreaSmooth, uv.x) * (1. - smoothstep(1. - shadowAreaSmooth, 1., uv.x)) *
        smoothstep(0., shadowAreaSmooth, uv.y) * (1. - smoothstep(1. - shadowAreaSmooth, 1., uv.y)) *
        step(0., depthFromWorldPos) * (1. - step(1., depthFromWorldPos));

    float visibility = 1.;
    float readDepth = 0.;
    vec2 offset = vec2(0.);

    // for(int i = 0; i < 4; i++) {
    #pragma UNROLL_START 4
        offset = poissonDisk[UNROLL_N] / 800.;
        readDepth = textureLod(shadowMap, uv + offset, 0.).r;
        // visibility -= step(readDepth, depthFromWorldPos - bias) * .25;
        if(readDepth < lightPos.z - bias) {
            visibility -= .25;
        }
    #pragma UNROLL_END
    // }


    // for debug
    // vec3 color = mix(
    //     vec3(0., 0., 1.),
    //     vec3(1., 0., 0.),
    //     (1. - visibility) * shadowAreaRect
    // );
    // return vec4(color, 1.);
    // return mix(surfaceColor, shadowColor, isShadow * shadowAreaRect * shadowBlendRate);

    float shadow = (1. - visibility) * shadowAreaRect * shadowBlendRate;
    return clamp(shadow, 0., 1.);
}

float fCalcsSpotLightShadowAttenuation(
    vec3 worldPosition,
    vec3 worldNormal,
    vec3 lightDirection, // 光源自体の向き
    mat4 lightViewProjectionTextureMatrix,
    sampler2D shadowMap,
    float shadowBias,
    vec4 shadowColor,
    float shadowBlendRate
) {
    float rNoL = dot(worldNormal, -lightDirection);
    float NoL = max(rNoL, 0.);
    float bias = .005 * tan(acos(NoL));
    bias = clamp(bias, .01, .02); // 大きくすればするほどアクネは少なくなるが、影の領域が少なくなる

    vec4 lightPos = lightViewProjectionTextureMatrix * vec4(worldPosition, 1.);
    vec2 uv = lightPos.xy / lightPos.w;
    float depthFromWorldPos = lightPos.z / lightPos.w;
    
    float shadowAreaSmooth = .25;
    float shadowAreaRect =
        // // 1: step
        // step(0., uv.x) * (1. - step(1., uv.x)) *
        // step(0., uv.y) * (1. - step(1., uv.y)) *
        // step(0., depthFromWorldPos) * (1. - step(1., depthFromWorldPos));
        // 2: smoothstep
        smoothstep(0., shadowAreaSmooth, uv.x) * (1. - smoothstep(1. - shadowAreaSmooth, 1., uv.x)) *
        smoothstep(0., shadowAreaSmooth, uv.y) * (1. - smoothstep(1. - shadowAreaSmooth, 1., uv.y)) *
        step(0., depthFromWorldPos) * (1. - step(1., depthFromWorldPos));

    float visibility = 1.;
    vec2 offset = vec2(0.);
    float readDepth = 0.;

    // PCF
    // vec3 uvc = vec3(uv, depthFromWorldPos + .00001);
    // float readDepth = textureProj(shadowMap, uvc).r;
    // for(int i = 0; i < 4; i++) {
    #pragma UNROLL_START 4
        offset = poissonDisk[UNROLL_N] / 100.;
        readDepth = textureLod(shadowMap, uv + offset, 0.).r;
        visibility -= step(readDepth, depthFromWorldPos - bias) * .25;
        // if(readDepth < depthFromWorldPos - bias) {
        //     visibility -= .25;
        // }
    #pragma UNROLL_END
    // }

    // for debug
    // vec3 color = mix(
    //     vec3(0., 0., 1.),
    //     vec3(1., 0., 0.),
    //     // shadowAreaRect
    //     (1. - visibility) * shadowAreaRect
    //     // (1. - visibility) * shadowAreaRect
    // );
    // // return vec4(color, 1.);
    // return shadowAreaRect;

    // // return vec4(vec3(uv.xy, 1.) * shadowAreaRect, 1.);
    // // return vec4(vec3(shadow * shadowAreaRect), 1.);
    // return vec4(vec3(readDepth * shadowAreaRect), 1.);
    
    float faceSmooth = smoothstep(0., 0.001, rNoL);
    
    float shadow = (1. - visibility) * shadowAreaRect * shadowBlendRate * faceSmooth;
    return clamp(shadow, 0., 1.);
}

// -----------------------------------------------------------
// receive shadow
// -----------------------------------------------------------

// #ifdef USE_RECEIVE_SHADOW
uniform float uShadowBias;
// #endif

// -----------------------------------------------------------

in vec2 vUv;

uniform sampler2D uDirectionalLightShadowMap;
uniform sampler2D uSpotLightShadowMap[MAX_SPOT_LIGHT_COUNT];

uniform sampler2D uGBufferATexture;
uniform sampler2D uGBufferBTexture;
uniform sampler2D uGBufferCTexture;
uniform sampler2D uGBufferDTexture;
uniform sampler2D uScreenSpaceShadowTexture;
uniform sampler2D uAmbientOcclusionTexture;

// uniform float uTime;

// uniform mat4 uInverseViewProjectionMatrix;
       
// TODO: loop
// uniform Skybox uSkybox;

layout (location = 0) out vec4 outColor;

void main() {
    vec4 resultColor = vec4(0, 0, 0, 1);

    vec2 uv = vUv;

    sGBufferA gBufferA = fDecodeGBufferA(uGBufferATexture, uv);
    sGBufferB gBufferB = fDecodeGBufferB(uGBufferBTexture, uv);
    sGBufferC gBufferC = fDecodeGBufferC(uGBufferCTexture, uv);
    sGBufferD gBufferD = fDecodeGBufferD(uGBufferDTexture, uv);

    // TODO: use encode func
    // surface
    vec3 baseColor = gBufferA.smBaseColor;
    float metallic = gBufferC.smMetallic;
    float roughness = gBufferC.smRoughness;
    vec3 emissiveColor = gBufferD.smEmissiveColor;
    float shadingModelId = gBufferB.smShadingModelId;
    vec3 worldNormal = gBufferB.smNormal;

    // depth
    float rawDepth = texture(uDepthTexture, uv).r;
    float depth = fPerspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);

    // geometry
    vec3 worldPosition = fReconstructWorldPositionFromDepth(uv, rawDepth, uInverseViewProjectionMatrix);

    // depth guard
    if (step(rawDepth, 1. - .00001) < .5) {
        outColor = vec4(baseColor, 1.); 
        // outColor = vec4(1., 0., 0., 1.); // TODO: 本当はこっちを使いたい: skyboxを後合成にしたい
        // 疑似HDRする場合
        // outColor = fEncodePseudoHDR(baseColor);
        return;
    }

    // unlit guard
    // unlit shading model id = 2
    if (1.5 < shadingModelId && shadingModelId < 2.5) {
        resultColor = vec4(emissiveColor, 1.);
        // TODO: unlitの場合って receive shadow なくてもいいよね？
        // #ifdef USE_RECEIVE_SHADOW
        //         vec4 shadowMapProjectionUv = uShadowMapProjectionMatrix * vec4(worldPosition, 1.);
        //         if(dot(surface.smWorldNormal, uDirectionalLight.smDirection) > 0.) {
        //             resultColor = applyShadow(resultColor, uShadowMap, shadowMapProjectionUv, uShadowBias, vec4(0., 0., 0., 1.), 0.5);
        //         }
        // #endif
        outColor = resultColor;
        return;
    }
    
    // skybox
    // 3
  
    //  
    // CUSTOM_BEGIN --------------------------------
    // additional materials
    // if(3.5 < shadingModelId && shadingModelId < 4.5) {
    //     return;
    // }

    //  
    // CUSTOM_END ----------------------------------
    //  
    
    // ここから先はlit(shadingModel=1)が走る
    
    // for debug
    // outColor = vec4(1., 0., 0., 1.);
    // return;
    // outColor = vec4(vec3(step(1.5, shadingModelId)), 1.);
    // return;

    float aoRate = texture(uAmbientOcclusionTexture, uv).r;
    float sssRate = texture(uScreenSpaceShadowTexture, uv).x;

    // for debug
    // outColor = vec4(worldPosition, 1.);
    // outColor = vec4(vec3(depth), 1.);
    // outColor = vec4(mod(uTime, 1.), 1., 1., 1.);
    // outColor = vec4(uViewPosition, 1.);
    // outColor = vec4(vec3(aoRate), 1.);
    // return;

    sSurface surface;
    surface.smWorldPosition = worldPosition;
    surface.smWorldNormal = worldNormal;
    surface.smBaseColor = vec4(baseColor, 1.);

    // TODO: bufferから引っ張ってくる
    surface.smSpecularAmount = .5;

    // phong
    // directional light
    // resultColor = calcDirectionalLight(surface, uDirectionalLight, camera);

    // pbr
    sGeometricContext geometry;
    geometry.smPosition = surface.smWorldPosition;
    geometry.smNormal = surface.smWorldNormal;
    geometry.smViewDir = normalize(uViewPosition - surface.smWorldPosition);
    sMaterial material;
    vec3 albedo = baseColor;
    material.smBaseColor = albedo;
    material.smBaseColor = mix(albedo, vec3(0.), metallic);// 金属は拡散反射しない
    material.smSpecularColor = mix(vec3(.04), albedo, metallic);// 非金属でも4%は鏡面反射をさせる（多くの不導体に対応）
    material.smRoughness = roughness;
    material.smMetallic = metallic;
    sReflectedLight reflectedLight = sReflectedLight(vec3(0.), vec3(0.), vec3(0.), vec3(0.));
    // TODO: なくていい？
    float opacity = 1.;

    sIncidentLight directLight;
    float shadow = 0.;

    // TODO: 影を落としたいmaterialとそうじゃないmaterialで出し分けたい
    // TODO: shadow map の枚数
    // #ifdef USE_RECEIVE_SHADOW

    //
    // directional light
    //

    sDirectionalLight directionalLight;
    directionalLight.smDirection = uDirectionalLight.smDirection;
    directionalLight.smColor = uDirectionalLight.smColor;
    directionalLight.smIntensity = uDirectionalLight.smIntensity;
    fGetsDirectionalLightIrradiance(directionalLight, geometry, directLight);
    shadow = fCalcDirectionalLightShadowAttenuation(
        worldPosition,
        surface.smWorldNormal,
        uDirectionalLight.smDirection,
        uDirectionalLight.smShadowMapProjectionMatrix,
        uDirectionalLightShadowMap,
        uShadowBias,
        vec4(vec3(.02), 1.), // TODO: pass color
        .5 // TODO: pass parameter
    );
    fRE_Direct(directLight, geometry, material, reflectedLight, shadow);
    
    //
    // spot light
    //
    sSpotLight spotLight;
    // TODO: shadow blend rate は light か何かに持たせたい
    // for(int i = 0; i < MAX_SPOT_LIGHT_COUNT; i++) {
    #pragma UNROLL_START MAX_SPOT_LIGHT_COUNT
        fGetSpotLightIrradiance(uSpotLight[UNROLL_N], geometry, directLight);
        shadow = fCalcsSpotLightShadowAttenuation(
            worldPosition,
            surface.smWorldNormal,
            uSpotLight[UNROLL_N].smDirection,
            uSpotLight[UNROLL_N].smShadowMapProjectionMatrix,
            uSpotLightShadowMap[UNROLL_N], // constantな必要がある
            uShadowBias,
            vec4(vec3(.02), 1.), // TODO: pass color
            .65 // TODO: pass parameter
        );
        fRE_Direct(directLight, geometry, material, reflectedLight, shadow);
    #pragma UNROLL_END
    // }
 
    //
    // point light
    //

    sPointLight pointLight;

    // for(int i = 0; i < MAX_POINT_LIGHT_COUNT; i++) {
    #pragma UNROLL_START MAX_POINT_LIGHT_COUNT
       fGetPointLightIrradiance(uPointLight[UNROLL_N], geometry, directLight);
       fRE_Direct(directLight, geometry, material, reflectedLight, sssRate * .25); // TODO: pass parameter
    #pragma UNROLL_END
    // }

    //
    // ambient light
    //

#ifdef USE_ENV_MAP
    sSkyboxLight skyboxLight;
    skyboxLight.smDiffuseIntensity = uSkybox.smDiffuseIntensity;
    skyboxLight.smSpecularIntensity = uSkybox.smSpecularIntensity;
    skyboxLight.smRotationOffset = uSkybox.smRotationOffset;
    skyboxLight.smMaxLodLevel = uSkybox.smMaxLodLevel;
    sIncidentSkyboxLight directSkyboxLight;
    directSkyboxLight.smDiffuseDirection = vec3(0.); // minifierでdirectSkyboxLightを消さないtrick
    fGetSkyboxLightIrradiance(skyboxLight, geometry, directSkyboxLight);
    fRE_DirectSkyboxFakeIBL(uSkybox.smCubeMap, directSkyboxLight, geometry, material, reflectedLight);
#endif

    //
    // calc render equations
    //

    vec3 outgoingLight =
        reflectedLight.smDirectBase
        + reflectedLight.smDirectSpecular
        + reflectedLight.smIndirectBase
        + reflectedLight.smIndirectSpecular
        ;
    resultColor = vec4(outgoingLight, opacity);

    // 遮蔽はそのまま色にかけてしまう
    resultColor.xyz *= aoRate;

    // 自己発光も足す。1より溢れている場合はbloomで光が滲む感じになる
    resultColor.xyz += emissiveColor;
    
    outColor = resultColor;
   
    // TODO: 足したくないが何かがおかしい
    // outColor = resultColor + sssRate;

    // for debug
    // // surface
    // vec3 baseColor = gBufferA.smBaseColor;
    // float metallic = gBufferC.smMetallic;
    // float roughness = gBufferC.smRoughness;
    // vec3 emissiveColor = gBufferD.smEmissiveColor;
    // float shadingModelId = gBufferB.smShadingModelId;
    // vec3 worldNormal = gBufferB.smNormal * 2. - 1.;
    // float rawDepth = texture(uDepthTexture, uv).r;
    // float depth = fPerspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    // vec3 worldPosition = fReconstructWorldPositionFromDepth(uv, rawDepth, uInverseViewProjectionMatrix);
    // vec4 sssRate = texture(uScreenSpaceShadowTexture, uv);
    // outColor = sssRate;
}
