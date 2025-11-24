#pragma DEFINES

// CUSTOM_BEGIN comment out
// #include <alpha_test>
// CUSTOM_END

uniform sampler2D uFontMap;
uniform vec4 uFontTiling;

in vec2 vUv;

// CUSTOM_BEGIN comment out
// #ifdef D_VERTEX_COLOR
// in vec4 vVertexColor;
// #endif
// CUSTOM_END

out vec4 outColor;

const float threshold = .5;
const float smoothRange = .01;

float fSdf2alpha(float sdf) {
    float alpha = smoothstep(
        threshold - smoothRange,
        threshold + smoothRange,
        sdf
    );
    return alpha;
}

float fMedian(vec3 msdf) {
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

    float sdf = fMedian(texture(uFontMap, uv).rgb);

    float alpha = fSdf2alpha(sdf);
    resultColor.a = alpha;
   
    // TODO: alpha test 
    // CUSTOM_BEGIN comment out 
    // #include <alpha_test_f>
    #include ./partial/alpha-test-fragment.partial.glsl
    // CUSTOM_END

    outColor = vec4(1., 1., 1., 1.);
}
