
#define MAX_SPOT_LIGHT_COUNT 2
// CUSTOM_BEGIN comment out
// #define MAX_POINT_LIGHT_COUNT 1
// CUSTOM_END

struct sSurface {
    vec3 smWorldNormal;
    vec3 smWorldPosition;
    vec4 smBaseColor;
    float smSpecularAmount;
};


struct sDirectionalLight {
    vec3 smDirection; // 光源自体の向く方向
    float smIntensity;
    vec4 smColor;
    mat4 smShadowMapProjectionMatrix;
};

struct sSpotLight {
    vec4 smColor;
    vec3 smPosition;
    vec3 smDirection; // spotlightの向き先
    float smIntensity;
    float smDistance;
    float smAttenuation;
    float smConeCos;
    float smPenumbraCos;
    mat4 smShadowMapProjectionMatrix;
};

// CUSTOM_BEGIN comment out
// struct sPointLight {
//     vec4 smColor;
//     vec3 smPosition;
//     float smIntensity;
//     float smDistance;
//     float smAttenuation;
// };
// CUSTOM_END
