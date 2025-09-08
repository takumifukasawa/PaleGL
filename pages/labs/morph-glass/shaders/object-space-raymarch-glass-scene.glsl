
uniform float uMorphRate;

float blend(float a, float b, float c, float d, float t1, float t2, float t) {
    float segTime = t1 + t2;
    float totalTime = 3. * segTime;

    float localT = mod(t, totalTime);

    if (localT < t2) {
        return a;
    } else if (localT < segTime * 1.0) {
        float st = (localT - t2) / t1;
        return mix(a, b, smoothstep(0.0, 1.0, st));
    } else if (localT < segTime * 1.0 + t2) {
        return b;
    } else if (localT < segTime * 2.0) {
        float st = (localT - segTime * 1.0 - t2) / t1;
        return mix(b, c, smoothstep(0.0, 1.0, st));
    } else if (localT < segTime * 2.0 + t2) {
        return c;
    } else {
        float st = (localT - segTime * 2.0 - t2) / t1;
        return mix(c, d, smoothstep(0.0, 1.0, st));
    }
}

// base: https://www.shadertoy.com/view/sllGDN
// "[TUT] Bending Light - Part 2" 
// by Martijn Steinrucken aka The Art of Code/BigWings - 2021
// The MIT License
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// Email: countfrolic@gmail.com
// Twitter: @The_ArtOfCode
// YouTube: youtube.com/TheArtOfCodeIsCool
// Facebook: https://www.facebook.com/groups/theartofcode/
//
// This is the end result of a tutorial on YouTube:
// Part 1 - https://youtu.be/NCpaaLkmXI8
// Part 2 - https://youtu.be/0RWaR7zApEo
float jewelry(vec3 p, float t) {
    float d = 10000.;

    vec3 scale = vec3(.8);
    
    p = opPreScale(p, scale);
    
    p.xy = opRo(p.xy, t * .3);

    p.xy = opFoldRotate(p.xy, 5.);
    
    p = opTr(p, vec3(0., 2.2, 0.));

    // p.xy = opRo(p.xy, PI * .5);
    p.yz = opRo(p.yz, t * .25);

    float c = cos(PI / 4.);
    float s = sqrt(.75 - c * c);
    vec3 n = vec3(-.5, -c, s);
    
    float o = 2.;
    
    p = abs(p);
    p -= o * min(0., dot(p, n)) * n;

    p.xz = abs(p.xz);
    p -= o * min(0., dot(p, n)) * n;
    
    p.xz = abs(p.xz);
    p -= o * min(0., dot(p, n)) * n;    
    
    d = p.z - 1.2;

    d = opPostScale(d, scale);
    
    return d;
}

float ring(vec3 p, float t) {
    float d = 10000.;
    
    // p.xz = opRo(p.xz, t * .3);
    // p.yz = opRo(p.yz, t * .3);
    p.xy = opRo(p.xy, -t * .3);
    
    vec3 scale = vec3(.8);
    
    p = opPreScale(p, scale);
    
    p.xy = opFoldRotate(p.xy, 6.);

    for(int i = 0; i < 2; i++) {
        float fi = float(i);
        p = opTr(p, vec3(0., fi * .6 + 1.2, 0.));
        vec3 _p = p;
        _p.yz = opRo(_p.yz, PI * .25 * sin(t + fi * 10.));
        d = min(d, dfBox(_p, vec3(8., .5, .5)));
    }
    
    d = opPostScale(d, scale);
    
    return d;
}

float box(vec3 p, float t) {
    p.xz = opRo(p.xz, t * .25);
    p.xy = opRo(p.xy, t * .25);
    float d = dfBox(p, vec3(1.6));
    return d;
}

vec2 dfScene(vec3 p) {
    float d = 10000.;
    
    vec3 q = p;

    float t = uMorphRate;

    vec3 scale = vec3(1.);
    
    p = opPreScale(p, scale);
    
    vec3 p1 = p;
    vec3 p2 = p;
    vec3 p3 = p;
  
    float d1 = jewelry(p1, t);

    float d2 = box(p2, t);
    
    float d3 = ring(p3, t);

    d = blend(d1, d2, d3, d1, 1.8, 1.8, t);

    return vec2(d, 0.);
}
