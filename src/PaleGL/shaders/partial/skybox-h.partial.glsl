
struct sSkybox {
    samplerCube cubeMap;
    float diffuseIntensity;
    float specularIntensity;
    float rotationOffset;
    float maxLodLevel;
};

uniform sSkybox uSkybox;

struct sSkyboxLight {
    float diffuseIntensity;
    float specularIntensity;
    float rotationOffset;
    float maxLodLevel;
};

struct sIncidentSkyboxLight {
    // samplerCube cubeMap;
    // vec3 baseColor;
    vec3 diffuseDirection;
    float diffuseIntensity;
    // vec3 specularColor;
    vec3 specularDirection;
    float specularIntensity;
    float maxLodLevel;
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
        -geometry.viewDir,
        normalize(geometry.normal)
    );

    vec3 envDiffuseDir = fCalcEnvMapSampleDir(geometry.normal, skyboxLight.rotationOffset);
    vec3 envSpecularDir = fCalcEnvMapSampleDir(envDir, skyboxLight.rotationOffset);

    // directLight.cubeMap = skyboxLight.cubeMap;
    directLight.diffuseDirection = envDiffuseDir;
    directLight.diffuseIntensity = skyboxLight.diffuseIntensity;
    directLight.specularDirection = envSpecularDir;
    directLight.specularIntensity = skyboxLight.specularIntensity;
    directLight.maxLodLevel = skyboxLight.maxLodLevel;
}
