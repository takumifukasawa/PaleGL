#version 300 es

layout (std140) uniform Transformations {
    mat4 uWorldMatrix;
    mat4 uViewMatrix;
    mat4 uProjectionMatrix;
};

void main() {
}
