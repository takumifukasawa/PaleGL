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

vec4 calcShapeFont(vec2 suv) {
    vec2 uv = suv;
    uv = uv * uFontTiling.xy + uFontTiling.zw;
    vec4 resultColor = texture(uFontMap, uv);
    resultColor.a *= shapeFontAlpha(resultColor.r);
    return resultColor;
}
