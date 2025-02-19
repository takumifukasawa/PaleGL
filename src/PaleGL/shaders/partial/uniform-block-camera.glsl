layout (std140) uniform ubCamera {
    vec3 uViewPosition;
    vec3 uViewDirection;
    float uNearClip;
    float uFarClip;
    float uAspect;
    float uFov;
};
