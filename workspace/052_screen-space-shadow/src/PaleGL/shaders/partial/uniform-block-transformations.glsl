layout (std140) uniform ubTransformations {
    mat4 uWorldMatrix;
    mat4 uViewMatrix;
    mat4 uProjectionMatrix;
    mat4 uNormalMatrix;
    mat4 uInverseWorldMatrix;

    mat4 uViewProjectionMatrix;
    mat4 uInverseViewMatrix;
    mat4 uInverseProjectionMatrix;
    mat4 uInverseViewProjectionMatrix;
    mat4 uTransposeInverseViewMatrix;
};
