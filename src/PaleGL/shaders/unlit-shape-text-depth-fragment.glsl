#pragma DEFINES

#include <alpha_test>
#include <shape_font_h>

in vec2 vUv;

// CUSTOM_BEGIN comment out
// #ifdef USE_VERTEX_COLOR
// in vec4 vVertexColor;
// #endif
// CUSTOM_END

out vec4 outColor;

void main() {
    // vec4 resultColor = vec4(1, 1, 1, 1);

    // #include <shape_font_f>
    
    vec4 resultColor = fCalcShapeFont(vUv);
   
    // #include <alpha_test_f>
// result color がなぜか minify されちゃうので一旦明示的に
#ifdef USE_ALPHA_TEST
    fCheckAlphaTest(resultColor, uAlphaTestThreshold);
#endif

    // outColor = vec4(1., 1., 1., 1.);
    outColor = resultColor;
}
