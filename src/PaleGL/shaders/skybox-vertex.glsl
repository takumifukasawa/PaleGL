
#pragma DEFINES

#pragma BASE_ATTRIBUTES

// CUSTOM_BEGIN comment out
// #pragma APPEND_ATTRIBUTES
// CUSTOM_END

#include <lighting>
#include <ub>

// CUSTOM_BEGIN comment out
// #pragma APPEND_UNIFORMS
// CUSTOM_END

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
