#pragma DEFINES

#pragma ATTRIBUTES

#pragma APPEND_ATTRIBUTES

#include <lighting>
#include <ub>

// varyings
out vec2 vUv;

#pragma APPEND_UNIFORMS

#include <shape_font_h>

void main() {
    #pragma BEGIN_MAIN
    vec4 localPosition = vec4(aPosition, 1.);
    localPosition.x /= uViewport.z;
    if(uViewport.x > uViewport.y) {
        localPosition.xy *= uFontAspect * 2.;
    } else {
        localPosition.xy *= uFontAspect * 2.;
    }

    vUv = aUv;
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * localPosition;
    gl_Position = localPosition;
    #pragma END_MAIN
}
