vec2 dfScene(vec3 p) {
    p = opRepeat(p, 1.);
    float d = dfSphere(p, .2);
    // float d = dfSphere(p, .5);
    
    return vec2(d, 0.);
}
