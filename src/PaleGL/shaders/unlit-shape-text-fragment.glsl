#pragma DEFINES

#include <tone>
#include <gbuffer>
#include <alpha_test>
#include <shape_font_h>
#include <vcolor_fh>

uniform vec4 uColor;
uniform int uShadingModelId;
uniform sampler2D uFontMap;
uniform vec4 uFontTiling;

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

#include <gbuffer_o>

void main() {
    vec4 resultColor = uColor;

    // vec2 uv = vUv;
    // uv = uv * uFontTiling.xy + uFontTiling.zw;
    // 
    // resultColor = texture(uFontMap, uv);

    // float smoothEdge = .5;
    // float smoothRange = 0.01;
    // float font = resultColor.r;
    // resultColor.a *= smoothstep(
    //     smoothEdge - smoothRange,
    //     smoothEdge + smoothRange,
    //     font
    // );
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
