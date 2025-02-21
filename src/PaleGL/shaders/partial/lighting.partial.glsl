
#define MAX_SPOT_LIGHT_COUNT 2
#define MAX_POINT_LIGHT_COUNT 1

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
