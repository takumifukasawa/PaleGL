#pragma DEFINES

#include <tone>
#include <gbuffer>
// CUSTOM_BEGIN comment out
// #include <alpha_test>
// #include <vcolor_fh>
// CUSTOM_END
#include <shape_font_h>

uniform vec4 uColor;
uniform int uShadingModelId;

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

#include <gbuffer_o>

void main() {
    vec4 resultColor = fCalcShapeFont(vUv) * uColor;
 
    vec3 worldNormal = normalize(vNormal);

    // TODO: alpha test 
    // CUSTOM_BEGIN comment out
    // // depth側でdiscardしてるのでなくてもよいが、z-fightな状況だとdiscardしてる部分がちらつく対策
    // // #include <alpha_test_f>
    // // result color がなぜか minify されちゃうので一旦明示的に
    // #ifdef D_ALPHA_TEST
    //     fCheckAlphaTest(resultColor, uAlphaTestThreshold);
    // #endif
    // CUSTOM_END

    resultColor.rgb = fGamma(resultColor.rgb);
    
    outGBufferA = fEncodeGBufferA(vec3(0.));
    outGBufferB = fEncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = fEncodeGBufferC(0., 0.);
    outGBufferD = fEncodeGBufferD(resultColor.rgb);
}
