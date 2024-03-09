
// TODO: このblock、lighting用の構造体とある程度共通化できそう？
struct SpotLight {
    vec4 color;
    vec3 position;
    vec3 direction; // spotlightの向き先
// vec4 uSpotLightColor;
    float intensity;
    float distance;
    float attenuation;
    float coneCos;
    float penumbraCos;
    mat4 lightViewProjectionMatrix;
// float shadowBias;
};

// struct SpotLightBlock {
//     float intensity;
//     vec4 color;
// };

layout (std140) uniform ubSpotLight {
    // vec3 uSpotLightPosition;
    // vec3 uSpotLightDirection; // spotlightの向き先
    // vec4 uSpotLightColor;
    // float uSpotLightIntensity;
    // float uSpotLightDistance;
    // float uSpotLightAttenuation;
    // float uSpotLightConeCos;
    // float uSpotLightPenumbraCos;
    // mat4 uSpotLightLightViewProjectionMatrix;
    // float uSpotLightShadowBias;

    // float uSpotLightIntensity[MAX_SPOT_LIGHT_COUNT];
    // vec4 uSpotLightColor[MAX_SPOT_LIGHT_COUNT];
    SpotLight uSpotLight[MAX_SPOT_LIGHT_COUNT];
};
