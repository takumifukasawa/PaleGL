#pragma APPEND_ATTRIBUTES

#pragma DEFINES

#pragma ATTRIBUTES

// #include ./partial/uniform-block-transformations.glsl
// #include ./partial/uniform-block-camera.glsl

#include <lighting>
#include <ub>

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
