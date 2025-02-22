#pragma DEFINES

#include <tone>
#include <gbuffer>
#include <alpha_test>
#include <vcolor_fh>

uniform vec4 uColor;
uniform int uShadingModelId;
uniform sampler2D uFontMap;
uniform vec4 uFontTiling;

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

#include <gbuffer_o>

const float threshold = .5;
const float smoothRange = .01;
float sdf2alpha(float sdf) {
    float alpha = smoothstep(
        threshold - smoothRange,
        threshold + smoothRange,
        sdf
    );
    return alpha;
}

float median(vec3 msdf) {
    return max(
        min(msdf.r, msdf.g),
        min(
            max(msdf.r, msdf.g),
            msdf.b
        )
    );
}

void main() {
    vec4 resultColor = uColor;

    vec2 uv = vUv;
    uv = uv * uFontTiling.xy + uFontTiling.zw;

    vec3 worldNormal = normalize(vNormal);
  
    float sdf = median(texture(uFontMap, uv).rgb);

    float alpha = sdf2alpha(sdf);

    // depth側でdiscardしてるのでなくてもよいが、z-fightな状況だとdiscardしてる部分がちらつく対策
    #include <alpha_test_f>
    
    resultColor.a = alpha;

    // for debug
    // resultColor.rgb = mix(vec3(vUv, 1.), resultColor.rgb, resultColor.a);
    // resultColor.rgb = mix(vec3(1., 0., 0.), resultColor.rgb, resultColor.a);
    
    resultColor.rgb = gamma(resultColor.rgb);
    
    outGBufferA = EncodeGBufferA(vec3(0.));
    outGBufferB = EncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = EncodeGBufferC(0., 0.);
    outGBufferD = EncodeGBufferD(resultColor.rgb);
}
