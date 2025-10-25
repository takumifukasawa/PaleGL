#pragma DEFINES

#include <tone>
#include <gbuffer>
#include <alpha_test>
#include <shape_font_h>
#include <vcolor_fh>

uniform vec4 uColor;
uniform int uShadingModelId;

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

#include <gbuffer_o>

void main() {
    // vec4 resultColor = uColor;

    // #include <shape_font_f>
    
    vec4 resultColor = fCalcShapeFont(vUv) * uColor;
 
    vec3 worldNormal = normalize(vNormal);
  
    // depth側でdiscardしてるのでなくてもよいが、z-fightな状況だとdiscardしてる部分がちらつく対策
    // #include <alpha_test_f>
// result color がなぜか minify されちゃうので一旦明示的に
#ifdef USE_ALPHA_TEST
    fCheckAlphaTest(resultColor, uAlphaTestThreshold);
#endif

    resultColor.rgb = fGamma(resultColor.rgb);
    
    outGBufferA = fEncodeGBufferA(vec3(0.));
    outGBufferB = fEncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = fEncodeGBufferC(0., 0.);
    outGBufferD = fEncodeGBufferD(resultColor.rgb);
}
