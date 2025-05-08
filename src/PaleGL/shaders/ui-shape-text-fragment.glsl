#pragma DEFINES

#include <lighting>
#include <ub>
#include <shape_font_h>

uniform vec4 uColor;

in vec2 vUv;

out vec4 outColor;

void main() {
    vec4 resultColor = uColor;

    #include <shape_font_f>

    // depth側でdiscardしてるのでなくてもよいが、z-fightな状況だとdiscardしてる部分がちらつく対策
    #include <alpha_test_f>

    outColor = resultColor;
}
