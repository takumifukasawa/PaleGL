float dfScene(vec3 pos) {
    vec3 p = opRepeat(pos, 2.);
    float distance = dfSphere(p, .25);
    // float distance = dfRoundBox(p, .25, .01);
    return distance;
}
