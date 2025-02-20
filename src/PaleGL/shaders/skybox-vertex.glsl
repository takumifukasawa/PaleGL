#pragma APPEND_ATTRIBUTES

#pragma DEFINES

#pragma ATTRIBUTES

#include ./partial/uniform-block-transformations.glsl
#include ./partial/uniform-block-camera.glsl

// uniform mat4 uWorldMatrix;
// uniform mat4 uViewMatrix;
// uniform mat4 uProjectionMatrix;
// uniform mat4 uNormalMatrix;

#pragma APPEND_UNIFORMS

out vec2 vUv;
out vec3 vNormal;
out vec3 vWorldPosition;

void main() {
    vUv = aUv;
    vNormal = (uNormalMatrix * vec4(aNormal, 1)).xyz;
    vec4 worldPosition = uWorldMatrix * vec4(aPosition, 1);
    vWorldPosition = worldPosition.xyz;
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
