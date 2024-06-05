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

float dfRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r;
}
