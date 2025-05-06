float shapeFontAlpha(float f) {
    float smoothEdge = .5;
    float smoothRange = 0.01;
    return smoothstep(
        smoothEdge - smoothRange,
        smoothEdge + smoothRange,
        f
    );
}
