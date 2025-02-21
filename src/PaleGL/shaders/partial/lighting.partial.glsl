
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

struct DirectionalLight {
    vec3 direction; // 光源自体の向く方向
    float intensity;
    vec4 color;
    mat4 shadowMapProjectionMatrix;
};

struct SpotLight {
    vec4 color;
    vec3 position;
    vec3 direction; // spotlightの向き先
    float intensity;
    float distance;
    float attenuation;
    float coneCos;
    float penumbraCos;
    mat4 shadowMapProjectionMatrix;
};

struct PointLight {
    vec4 color;
    vec3 position;
    float intensity;
    float distance;
    float attenuation;
};
