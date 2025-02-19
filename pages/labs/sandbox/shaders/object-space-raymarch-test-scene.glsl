vec2 dfScene(vec3 pos) {
    vec3 p = opRepeat(pos, 1.);
    float d = dfSphere(p, .5);
    
    // simple sphere
    d = dfSphere(pos, 1.);
    
    return vec2(d, 0.);
}
