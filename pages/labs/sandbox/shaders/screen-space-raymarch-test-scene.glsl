vec2 dfScene(vec3 pos) {
    vec3 p = opRe(pos, 4.);
    float distance = dfSp(p, .25);
    // float distance = dfRoundBox(p, .25, .01);
    return vec2(distance, 0.);
}
