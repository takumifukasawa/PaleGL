//
// operators
//

vec3 opRepeat(vec3 p, float s) {
    return p - s * round(p / s);
}

//
// distance functions
//

float dfSphere(vec3 p, float radius) {
    return length(p) - radius;
}
