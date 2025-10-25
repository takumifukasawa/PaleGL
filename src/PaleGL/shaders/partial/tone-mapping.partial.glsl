vec3 reinhard(vec3 x) {
    return x / (x + vec3(1.));
}

vec3 fReinhardExposure(vec3 x, float exposure) {
    float l2 = exposure * exposure;
    return (x / (x + vec3(1.))) * (1. + (x / exposure));
}

vec3 fAces(vec3 x) {
    float a = 2.51;
    float b = .03;
    float c = 2.43;
    float d = .59;
    float e = .14;
    vec3 y = (x * (a * x + b)) / (x * (c * x + d) + e);
    return clamp(y, 0., 1.);
}

vec3 fDegamma(vec3 color) {
    return pow(color, vec3(1. / 2.2));
}

vec3 fGamma(vec3 color) {
    return pow(color, vec3(2.2));
}

vec4 fGamma(vec4 color) {
    return pow(color, vec4(2.2));
}
