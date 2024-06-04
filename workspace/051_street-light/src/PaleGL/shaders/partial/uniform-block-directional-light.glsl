
struct DirectionalLight {
    vec3 direction; // 光源自体の向く方向
    float intensity;
    vec4 color;
    mat4 shadowMapProjectionMatrix;
};

layout (std140) uniform ubDirectionalLight {
    DirectionalLight uDirectionalLight;
};
