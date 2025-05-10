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
    
    outColor = resultColor;
}
