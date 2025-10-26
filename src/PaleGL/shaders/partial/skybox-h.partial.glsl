
struct sSkybox {
    samplerCube smCubeMap;
    float smDiffuseIntensity;
    float smSpecularIntensity;
    float smRotationOffset;
    float smMaxLodLevel;
};

uniform sSkybox uSkybox;

struct sSkyboxLight {
    float smDiffuseIntensity;
    float smSpecularIntensity;
    float smRotationOffset;
    float smMaxLodLevel;
};

struct sIncidentSkyboxLight {
    // samplerCube cubeMap;
    // vec3 baseColor;
    vec3 smDiffuseDirection;
    float smDiffuseIntensity;
    // vec3 specularColor;
    vec3 smSpecularDirection;
    float smSpecularIntensity;
    float smMaxLodLevel;
};

vec3 fCalcEnvMapSampleDir(vec3 reflectDir, float rotationOffset) {
    reflectDir.x *= -1.;
    float c = cos(3.14 + rotationOffset);
    float s = sin(3.14 + rotationOffset);
    reflectDir.xz *= mat2(c, s, -s, c);
    return reflectDir;
}

void fGetSkyboxLightIrradiance(
    const in sSkyboxLight skyboxLight,
    const in sGeometricContext geometry,
    out sIncidentSkyboxLight directLight
) {
    vec3 envDir = reflect(
        -geometry.smViewDir,
        normalize(geometry.smNormal)
    );

    vec3 envDiffuseDir = fCalcEnvMapSampleDir(geometry.smNormal, skyboxLight.smRotationOffset);
    vec3 envSpecularDir = fCalcEnvMapSampleDir(envDir, skyboxLight.smRotationOffset);

    // directLight.smCubeMap = skyboxLight.smCubeMap;
    directLight.smDiffuseDirection = envDiffuseDir;
    directLight.smDiffuseIntensity = skyboxLight.smDiffuseIntensity;
    directLight.smSpecularDirection = envSpecularDir;
    directLight.smSpecularIntensity = skyboxLight.smSpecularIntensity;
    directLight.smMaxLodLevel = skyboxLight.smMaxLodLevel;
}
