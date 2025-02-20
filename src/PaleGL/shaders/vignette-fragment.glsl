#include ./partial/common.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform float uVignetteRadiusFrom;
uniform float uVignetteRadiusTo;
uniform float uVignettePower;
uniform float uBlendRate;
uniform float uAspect;

void main() {
    vec2 uv = vUv;
    vec2 centerUv = vUv * 2. - 1.; // -1 ~ 1
    centerUv.x *= uAspect;
    float d = dot(centerUv, centerUv);
    // pattern_1
    // float factor = pow(min(1., d / uVignetteRadius), uVignettePower) * uBlendRate;
    // pattern_2
    float factor = pow(smoothstep(uVignetteRadiusFrom, uVignetteRadiusTo, d), uVignettePower) * uBlendRate;
    vec3 vignetteColor = vec3(0.);
    vec3 srcColor = texture(uSrcTexture, uv).rgb;
    outColor = vec4(mix(srcColor, vignetteColor, factor), 1.);
}
