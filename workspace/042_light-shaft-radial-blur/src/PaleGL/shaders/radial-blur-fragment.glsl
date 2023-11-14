#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;

const int sampleCount = 12;

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec4 resultColor = texture(uSrcTexture, vUv);
    outColor = resultColor;
       
    // WIP: zoom blur
    
    vec2 blurCenter = vec2(.5, .5);
    vec2 centerToCurrent = vUv - blurCenter;
    float totalWeight = 0.;
    vec4 destColor = vec4(0.);

    float strength = 1.;
    for(int i = 0; i <= sampleCount; i++) {
        float nflag = (1. / float(sampleCount));
        float fi = float(i);
        // float per = (fi + (rand(vUv) * 2. - 1.) * 1.) * nflag;
        // float weight = per - per * per;
        // vec2 uv = vUv + (-centerToCurrent * per * strength * nflag);
        vec2 uv = vUv + (-centerToCurrent * nflag * fi);
        uv = vec2(
            clamp(uv.x, 0., 1.),
            clamp(uv.y, 0., 1.)
        );
        // destColor += texture(uSrcTexture, uv) * weight;
        destColor += texture(uSrcTexture, uv);
        // totalWeight += weight;
        // totalWeight += nflag;
        // totalWeight += 1.;
    }
    
    // destColor /= totalWeight;
    destColor /= float(sampleCount);
    
    // debug
    
    // outColor = resultColor;
    // outColor = destColor;
}
