#pragma DEFINES

uniform sampler2D uFontMap;
uniform vec4 uFontTiling;

#include ./partial/alpha-test-fragment-uniforms.glsl

in vec2 vUv;

#ifdef USE_VERTEX_COLOR
in vec4 vVertexColor;
#endif

out vec4 outColor;

#include ./partial/alpha-test-functions.glsl

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
    vec4 resultColor = vec4(0, 0, 0, 1);

    vec2 uv = vUv;
    uv = uv * uFontTiling.xy + uFontTiling.zw;

    float sdf = median(texture(uFontMap, uv).rgb);

    float alpha = sdf2alpha(sdf);
    resultColor.a = alpha;

#ifdef USE_ALPHA_TEST
    checkAlphaTest(resultColor.a, uAlphaTestThreshold);
#endif

    outColor = vec4(1., 1., 1., 1.);
}
