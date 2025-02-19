
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

layout (std140) uniform ubSpotLight {
    SpotLight uSpotLight[MAX_SPOT_LIGHT_COUNT];
};
