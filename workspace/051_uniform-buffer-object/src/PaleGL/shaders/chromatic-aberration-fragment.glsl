#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform float uTargetWidth;
uniform float uTargetHeight;

const int ARRAY_NUM = 5;

const float SCALE = .02;

const vec3 chromaticAberrationFilter[ARRAY_NUM] = vec3[](
    vec3(0., 0., .5),
    vec3(0., .25, .5),
    vec3(0., .5, 0.),
    vec3(.5, .25, 0.),
    vec3(.5, 0., 0.)
);

void main() {
    vec2 uv = vUv;
    vec2 centerUv = vUv * 2. - 1.;
    outColor = vec4(0.);
    for(int i = 0; i < ARRAY_NUM; i++) {
        vec2 tempUv = centerUv * (1. - SCALE * (float(i) + 1.) / float(ARRAY_NUM));
        tempUv = (tempUv + 1.) * .5;
        vec3 mask = chromaticAberrationFilter[i];
        vec4 color = texture(uSrcTexture, tempUv);
        outColor += vec4(color.rgb * mask, 1.);
    }
}
