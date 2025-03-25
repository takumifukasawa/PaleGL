vec2 dfScene(vec3 p) {
    // p = opRepeat(p, 1.);
    // float d = dfSphere(p, 1.);
    // p.xy = opRo(p.xy, 1.57 / 4.);
    // p.yz = opRo(p.yz, 1.57 / 4.);
    float d = dfBox(p, vec3(1., 1., 1.));
    // float d = dfSphere(p, .5);
    
    return vec2(d, 0.);
}
