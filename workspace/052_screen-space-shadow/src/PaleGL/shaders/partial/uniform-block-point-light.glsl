
struct PointLight {
    vec3 position;
    vec4 color;
    float intensity;
    float distance;
    float attenuation;
};

layout (std140) uniform ubPointLight {
    PointLight uPointLight[MAX_POINT_LIGHT_COUNT];
};
