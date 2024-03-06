
struct SpotLightBlock {
    float intensity;
    vec4 color;
};
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
    SpotLightBlock uSpotLightBlock[MAX_SPOT_LIGHT_COUNT];
};
