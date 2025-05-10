#pragma DEFINES

#include <alpha_test>
#include <shape_font_h>

in vec2 vUv;

#ifdef USE_VERTEX_COLOR
in vec4 vVertexColor;
#endif

out vec4 outColor;

void main() {
    vec4 resultColor = vec4(1, 1, 1, 1);

    #include <shape_font_f>
   
    #include <alpha_test_f>

    outColor = vec4(1., 1., 1., 1.);
}
