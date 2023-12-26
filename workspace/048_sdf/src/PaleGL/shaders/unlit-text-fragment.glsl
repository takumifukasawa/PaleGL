#version 300 es

precision mediump float;

#pragma DEFINES

uniform vec4 uBaseColor;
uniform vec4 uEmissiveColor;
uniform int uShadingModelId;

uniform sampler2D uFontMap;
uniform vec4 uFontTiling;

#include ./partial/tone-mapping.glsl

#include ./partial/alpha-test-fragment-uniforms.glsl

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

#include ./partial/vertex-color-fragment-varyings.glsl

#include ./partial/gbuffer-functions.glsl

#include ./partial/alpha-test-functions.glsl

#include ./partial/gbuffer-layout.glsl

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
    // vec4 resultColor = vec4(0, 0, 0, 1);
    vec4 resultColor = uEmissiveColor;

    vec2 uv = vUv;
    // uv = uv * uFontTiling.xy;
    uv = uv * uFontTiling.xy + uFontTiling.zw;

    vec3 worldNormal = normalize(vNormal);
  
    float sdf = median(texture(uFontMap, uv).rgb);

    float alpha = sdf2alpha(sdf);
    resultColor.rgb = vec3(1.);
    resultColor.a = alpha;
    
    // if(resultColor.a < .5) {
    //     discard;
    // }
    
    resultColor.rgb = vec3(alpha);
    if(alpha < .5) {
        discard;
    }

    #include ./partial/alpha-test-calc.glsl

    resultColor.rgb = gamma(resultColor.rgb);
    
    outGBufferA = EncodeGBufferA(vec3(0.));
    outGBufferB = EncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = EncodeGBufferC(0., 0.);
    outGBufferD = EncodeGBufferD(resultColor.rgb);
}
