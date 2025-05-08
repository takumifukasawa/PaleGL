uniform sampler2D uFontMap;
uniform vec4 uFontTiling;
uniform float uFontAspect;

float shapeFontAlpha(float f) {
    float smoothEdge = .5;
    float smoothRange = 0.01;
    return smoothstep(
        smoothEdge - smoothRange,
        smoothEdge + smoothRange,
        f
    );
}
