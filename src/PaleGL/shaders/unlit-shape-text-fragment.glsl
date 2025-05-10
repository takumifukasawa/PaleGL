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
    vec4 resultColor = uColor;

    #include <shape_font_f>

    vec3 worldNormal = normalize(vNormal);
  
    // depth側でdiscardしてるのでなくてもよいが、z-fightな状況だとdiscardしてる部分がちらつく対策
    #include <alpha_test_f>

    resultColor.rgb = gamma(resultColor.rgb);
    
    outGBufferA = EncodeGBufferA(vec3(0.));
    outGBufferB = EncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = EncodeGBufferC(0., 0.);
    outGBufferD = EncodeGBufferD(resultColor.rgb);
}
