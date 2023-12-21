
vec3 opRepeat(vec3 p, float s) {
    return p - s * round(p / s);
}
