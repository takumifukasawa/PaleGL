
#ifdef USE_ALPHA_TEST
uniform float uAlphaTestThreshold;
#endif

void fCheckAlphaTest(float value, float threshold) {
    if(value < threshold) {
        discard;
    }
}

void fCheckAlphaTest(vec4 value, float threshold) {
    if(value.a < threshold) {
        discard;
    }
}
