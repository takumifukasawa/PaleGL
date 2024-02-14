

layout (std140) uniform ubTransformations {
    mat4 uWorldMatrix;
    mat4 uViewMatrix;
    mat4 uProjectionMatrix;
    mat4 uNormalMatrix;
    mat4 uInverseWorldMatrix;
    // vec3 uViewPosition;
    // vec3 uViewDirection;
};
