
struct PointLight {
    vec4 color;
    vec3 position;
    float intensity;
    float distance;
    float attenuation;
};

layout (std140) uniform ubPointLight {
    PointLight uPointLight[MAX_POINT_LIGHT_COUNT];
};
