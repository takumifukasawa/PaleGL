
#ifdef USE_ALPHA_TEST
uniform float uAlphaTestThreshold;
#endif

void checkAlphaTest(float value, float threshold) {
    if(value < threshold) {
        discard;
    }
}

void checkAlphaTest(vec4 value, float threshold) {
    if(value.a < threshold) {
        discard;
    }
}
