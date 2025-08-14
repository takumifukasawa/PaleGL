layout (std140) uniform ubCommon {
    float uTime; // engine update time
    float uDeltaTime; // engine update delta time
    vec4 uViewport; // x: width, y: height, z: aspect(wid/hei), w: 0
};

layout (std140) uniform ubTransformations {
    mat4 uWorldMatrix;
    mat4 uViewMatrix;
    mat4 uProjectionMatrix;
    mat4 uWVPMatrix;
    mat4 uNormalMatrix;
    mat4 uInverseWorldMatrix;
    mat4 uViewProjectionMatrix;
    mat4 uInverseViewMatrix;
    mat4 uInverseProjectionMatrix;
    mat4 uInverseViewProjectionMatrix;
    mat4 uTransposeInverseViewMatrix;
};

layout (std140) uniform ubCamera {
    vec3 uViewPosition;
    vec3 uViewDirection;
    float uNearClip;
    float uFarClip;
    float uAspect;
    float uFov;
};
layout (std140) uniform ubDirectionalLight {
    DirectionalLight uDirectionalLight;
};

layout (std140) uniform ubSpotLight {
    SpotLight uSpotLight[MAX_SPOT_LIGHT_COUNT];
};

layout (std140) uniform ubPointLight {
    PointLight uPointLight[MAX_POINT_LIGHT_COUNT];
};

layout (std140) uniform ubTimeline {
    float uTimelineTime; // timeline time
    float uTimelineDeltaTime; // timeline delta time
};
