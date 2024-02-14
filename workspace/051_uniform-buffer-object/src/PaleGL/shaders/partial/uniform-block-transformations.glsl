


layout(std140) uniform Engine {
    float uHoge;
};

layout (std140) uniform Transformations {
    mat4 uWorldMatrix;
    mat4 uViewMatrix;
    mat4 uProjectionMatrix;
    mat4 uNormalMatrix;
};
