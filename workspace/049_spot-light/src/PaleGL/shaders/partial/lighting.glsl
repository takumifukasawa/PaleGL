//
// ref: https://zenn.dev/mebiusbox/books/619c81d2fbeafd/viewer/7c1069
//

// -------------------------------------------------------------------------------
// defines
// -------------------------------------------------------------------------------

#define saturate(a) clamp(a, 0., 1.)

#define PI 3.14159265359
#define PI2 6.28318530718
#define RECIPROCAL_PI 0.31830988618
#define RECIPROCAL_PI2 0.15915494
#define LOG2 1.442695
#define EPSILON 1e-6


// -------------------------------------------------------------------------------
// struct
// -------------------------------------------------------------------------------

struct IncidentLight {
    vec3 color;
    vec3 direction;
    bool visible;
    float intensity;
};

struct IncidentSkyboxLight {
    // samplerCube cubeMap;
    // vec3 diffuseColor;
    vec3 diffuseDirection;
    float diffuseIntensity;
    // vec3 specularColor;
    vec3 specularDirection;
    float specularIntensity;
    float maxLodLevel;
};

struct ReflectedLight {
    vec3 directDiffuse;
    vec3 directSpecular;
    vec3 indirectDiffuse;
    vec3 indirectSpecular;
};

struct GeometricContext {
    vec3 position;
    vec3 normal;
    vec3 viewDir;
};

struct Material {
    vec3 baseColor;
    vec3 diffuseColor;
    vec3 specularColor;
    float roughness;
    float metallic;
    // float roughnessSquared;
    // float reflectivity;
    // float clearCoat;
    // float clearCoatRoughness;
};

// -------------------------------------------------------------------------------
// lights
// -------------------------------------------------------------------------------

bool testLightInRange(const in float lightDistance, const in float cutoffDistance) {
    return any(bvec2(cutoffDistance == 0., lightDistance < cutoffDistance));
}

float punctualLightIntensityToIrradianceFactor(const in float lightDistance, const in float cutoffDistance, const in float attenuationComponent) {
    if (attenuationComponent > 0.) {
        return pow(saturate(-lightDistance / cutoffDistance + 1.), attenuationComponent);
    }

    return 1.;
}

// directional light

struct DirectionalLight {
    vec3 direction;
    float intensity;
    vec4 color;
};

void getDirectionalLightIrradiance(const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight directLight) {
    directLight.color = directionalLight.color.xyz;
    directLight.direction = directionalLight.direction;
    directLight.visible = true;
    directLight.intensity = directionalLight.intensity;
}

// point light
// TODO: point light なくてもいいかも

struct PointLight {
    vec3 position;
    vec4 color;
    float distance;
    float attenuation;
};

void getPointLightIrradiance(const in PointLight pointLight, const in GeometricContext geometry, out IncidentLight directLight) {
    vec3 L = pointLight.position - geometry.position;
    directLight.direction = normalize(L);

    float lightDistance = length(L);
    if (testLightInRange(lightDistance, pointLight.distance)) {
        directLight.color = pointLight.color.xyz;
        directLight.color *= punctualLightIntensityToIrradianceFactor(lightDistance, pointLight.distance, pointLight.attenuation);
        directLight.visible = true;
    } else {
        directLight.color = vec3(0.);
        directLight.visible = false;
    }
}

// spot light

struct SpotLight {
    vec3 position;
    vec3 direction;
    vec4 color;
    float distance;
    float attenuation;
    float coneCos;
    float penumbraCos;
};

void getSpotLightIrradiance(const in SpotLight spotLight, const in GeometricContext geometry, out IncidentLight directLight) {
    vec3 L = spotLight.position - geometry.position;
    directLight.direction = normalize(L);

    float lightDistance = length(L);
    float angleCos = dot(normalize(L), spotLight.direction);

    if (all(
        bvec2(
            angleCos > spotLight.coneCos,
            testLightInRange(lightDistance, spotLight.distance)
        )
    )) {
        float spotEffect = smoothstep(spotLight.coneCos, spotLight.penumbraCos, angleCos);
        directLight.color = spotLight.color.xyz;
        directLight.color *= spotEffect * punctualLightIntensityToIrradianceFactor(lightDistance, spotLight.distance, spotLight.attenuation);
        directLight.visible = true;
    } else {
        directLight.color = vec3(0.);
        directLight.visible = false;
    }
}

// -------------------------------------------------------------------------------
// skybox
// -------------------------------------------------------------------------------

struct SkyboxLight {
    // samplerCube cubeMap;
    float diffuseIntensity;
    float specularIntensity;
    float rotationOffset;
    float maxLodLevel;
    // vec3 diffuseColor;
    // vec3 specularColor;
    // vec3 diffuseDirection;
    // vec3 specularDirection;
    // bool visible;
};

#include ./env-map-fragment-functions.glsl

void getSkyboxLightIrradiance(const in SkyboxLight skyboxLight, const in GeometricContext geometry, out IncidentSkyboxLight directLight) {
    vec3 envDir = reflect(
        -geometry.viewDir,
        // normalize(geometry.position - camera.worldPosition),
        normalize(geometry.normal)
    );
                
    // TODO: rotatoinを考慮
    vec3 envDiffuseDir = calcEnvMapSampleDir(geometry.normal, skyboxLight.rotationOffset);
    vec3 envSpecularDir = calcEnvMapSampleDir(envDir, skyboxLight.rotationOffset);

    // directLight.cubeMap = skyboxLight.cubeMap;
    directLight.diffuseDirection = envDiffuseDir;
    directLight.diffuseIntensity = skyboxLight.diffuseIntensity;
    directLight.specularDirection = envSpecularDir;
    directLight.specularIntensity = skyboxLight.specularIntensity;
    directLight.maxLodLevel = skyboxLight.maxLodLevel;
}

// -------------------------------------------------------------------------------
// lights uniforms
// -------------------------------------------------------------------------------

// #define LIGHT_MAX 4
// uniform DirectionalLight directionalLights[LIGHT_MAX];
// uniform PointLight pointLights[LIGHT_MAX];
// uniform SpotLight spotLights[LIGHT_MAX];
// uniform int numDirectionalLights;
// uniform int numPointLights;
// uniform int numSpotLights;

// -------------------------------------------------------------------------------
// brdfs
// -------------------------------------------------------------------------------

// normalized lambert

vec3 DiffuseBRDF(vec3 diffuseColor) {
    return diffuseColor / PI;
}

// TODO: schlickの公式まとめる
        
vec3 F_Shhlick(vec3 specularColor, vec3 H, vec3 V) {
    return (specularColor + (1. - specularColor) * pow(1. - saturate(dot(V, H)), 5.));
}

// ref: http://d.hatena.ne.jp/hanecci/20130525/p3
vec3 schlick(vec3 f0, float product) {
    return f0 + (1. - f0) * pow((1. - product), 5.);
}

float D_GGX(float a, float dotNH) {
    float a2 = a * a;
    float dotNH2 = dotNH * dotNH;
    float d = dotNH2 * (a2 - 1.) + 1.;
    return a2 / (PI * d * d);
}

float G_Smith_Schlick_GGX(float a, float dotNV, float dotNL) {
    float k = a * a * .5 + EPSILON;
    float gl = dotNL / (dotNL * (1. - k) + k);
    float gv = dotNV / (dotNV * (1. - k) + k);
    return gl * gv;
}

// cook-torrance

// vec3 SpecularBRDF(const in IncidentLight directLight, const in GeometricContext geometry, vec3 specularColor, float roughnessFactor) {
vec3 SpecularBRDF(const vec3 lightDirection, const in GeometricContext geometry, vec3 specularColor, float roughnessFactor) {
    vec3 N = normalize(geometry.normal);
    vec3 V = normalize(geometry.viewDir);
    vec3 L = normalize(lightDirection);

    float dotNL = saturate(dot(N, L));
    float dotNV = saturate(dot(N, V));
    vec3 H = normalize(L + V);
    float dotNH = saturate(dot(N, H));
    float dotVH = saturate(dot(V, H));
    float dotLV = saturate(dot(L, V));
    
    float a = roughnessFactor * roughnessFactor;
    
    float D = D_GGX(a, dotNH);
    float G = G_Smith_Schlick_GGX(a, dotNV, dotNL);
    vec3 F = F_Shhlick(specularColor, V, H);
  
    return (F * (G * D)) / (4. * dotNL * dotNV + EPSILON);
}

// -------------------------------------------------------------------------------
// render equations
// -------------------------------------------------------------------------------

void RE_Direct(const in IncidentLight directLight, const in GeometricContext geometry, const in Material material, inout ReflectedLight reflectedLight) {
    float dotNL = saturate(dot(geometry.normal, directLight.direction));
    vec3 irradiance = dotNL * directLight.color;
    
    // punctual light
    irradiance *= PI;
    irradiance *= directLight.intensity;

    // diffuse
    reflectedLight.directDiffuse +=
        irradiance *
        DiffuseBRDF(material.diffuseColor);
    // specular
    // reflectedLight.directSpecular += irradiance * SpecularBRDF(directLight, geometry, material.specularColor, material.roughness);
    reflectedLight.directSpecular +=
        irradiance *
        SpecularBRDF(
            directLight.direction,
            geometry,
            material.specularColor,
            material.roughness
        );
}

// base: https://qiita.com/kaneta1992/items/df1ae53e352f6813e0cd
void RE_DirectSkyboxFakeIBL(samplerCube cubeMap, const in IncidentSkyboxLight skyboxLight, const in GeometricContext geometry, const in Material material, inout ReflectedLight reflectedLight) {
    //
    // diffuse
    //
            
    vec3 envDiffuseColor = textureLod(
        cubeMap,
        skyboxLight.diffuseDirection,
        skyboxLight.maxLodLevel
    ).xyz;
        
    // 拡散: metalness,roughnessを考慮しない
    reflectedLight.directDiffuse +=
        material.diffuseColor
        * envDiffuseColor
        * skyboxLight.diffuseIntensity;

    //
    // specular
    //

    float specularLod = log2(material.roughness * pow(2., skyboxLight.maxLodLevel));
    vec3 envSpecularColor = textureLod(
        cubeMap,
        skyboxLight.specularDirection,
        specularLod
    ).xyz;

    // vec3 f0 = mix(vec3(.04), material.baseColor, material.metallic);

    vec3 fresnel = schlick(material.specularColor, max(0., dot(geometry.viewDir, geometry.normal)));
        
    //
    // result
    //
      
    // 鏡面反射: metalness,roughnes を考慮
    reflectedLight.directSpecular += mix(
        envSpecularColor * skyboxLight.specularIntensity * material.specularColor,
        envSpecularColor * skyboxLight.specularIntensity,
        fresnel
    );
}
