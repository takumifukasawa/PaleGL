float dfScene(vec3 pos) {
    vec3 p = opRepeat(pos, 2.);
    float distance = dfSphere(p, .2);
    return distance;
}
