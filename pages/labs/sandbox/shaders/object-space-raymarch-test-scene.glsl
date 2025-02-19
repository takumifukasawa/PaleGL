float dfScene(vec3 pos) {
    vec3 p = opRepeat(pos, 1.);
    float distance = dfSphere(p, .5);
    
    // float distance = dfRoundBox(p, .25, .01);
   
    // simple sphere
    distance = dfSphere(pos, 1.);
    
    return distance;
}
