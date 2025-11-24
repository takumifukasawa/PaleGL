#pragma DEFINES

// CUSTOM_BEGIN comment out
// #include <alpha_test>
// CUSTOM_END
#include <shape_font_h>

in vec2 vUv;

// CUSTOM_BEGIN comment out
// #ifdef D_VERTEX_COLOR
// in vec4 vVertexColor;
// #endif
// CUSTOM_END

out vec4 outColor;

void main() {
    vec4 resultColor = fCalcShapeFont(vUv);
  
    // TODO: alpha test 
    // CUSTOM_BEGIN comment out
    // // #include <alpha_test_f>
    // // result color がなぜか minify されちゃうので一旦明示的に
    // #ifdef D_ALPHA_TEST
    //     fCheckAlphaTest(resultColor, uAlphaTestThreshold);
    // #endif
    // CUSTOM_END

    // outColor = vec4(1., 1., 1., 1.);
    outColor = resultColor;
}
