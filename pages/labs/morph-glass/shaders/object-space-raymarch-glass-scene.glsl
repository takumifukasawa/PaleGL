float getDist(vec3 p) {
    p.xz = opRo(p.xz, uTime * .15);
    float d = dfBox(p, vec3(1));
    
    float c = cos(3.1415 / 5.), s = sqrt(.75 - c * c);
    vec3 n = vec3(-.5, -c, s);
    
    p = abs(p);
    p -= 2. * min(0., dot(p, n)) * n;
    
    p.xy = abs(p.xy);
    p -= 2. * min(0., dot(p, n)) * n;
    
    p.xy = abs(p.xy);
    p -= 2. * min(0., dot(p, n)) * n;    
    
    d = p.z - 1.;
    
    return d;
}

vec2 dfScene(vec3 p) {
    float d = 10000.;
    // p = opRepeat(p, 1.);
    // float d = dfSphere(p, 1.);
    // p.xy = opRo(p.xy, 1.57 / 4.);
    // p.yz = opRo(p.yz, 1.57 / 4.);
    // float d = dfSphere(p, .5);
   
    vec3 scale = vec3(2.);
    
    p = opPreScale(p, scale);
    
    float t = uTime;

    d = dfBox(p, vec3(1., 1., 1.));
    d = getDist(p);
  
    // // metaball 
    // for(int i = 0; i < 10; i++) {
    //     vec3 _p = p;
    //     float fi = float(i);
    //     float r = 1.25;
    //     float x = sin(t + fi * 0.4 + fi * 10.) * r;
    //     float y = cos(t + fi * 0.7 + fi * 20.) * r;
    //     float z = -sin(t + fi * 0.6 + fi * 30.) * r;
    //     float s = 1.2 + 0.2 * sin(t + fi * 40.);
    //     _p = opTr(p, vec3(x, y, z));
    //     d = opSm(d, dfSphere(_p, s), .8);
    // }

    d = opPostScale(d, scale);
    
    return vec2(d, 0.);
}
