#pragma DEFINES

#pragma ATTRIBUTES

#pragma APPEND_ATTRIBUTES

#include <lighting>
#include <ub>

// varyings
out vec2 vUv;

#pragma APPEND_UNIFORMS

void main() {
    #pragma BEGIN_MAIN
    vec4 localPosition = vec4(aPosition, 1.);
    vUv = aUv;
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * localPosition;
    gl_Position = localPosition;
    #pragma END_MAIN
}
