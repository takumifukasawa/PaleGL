#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;

const int sampleCount = 12;

// float rand(vec2 co){
//     return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
// }

void main() {
    vec4 resultColor = texture(uSrcTexture, vUv);
    outColor = resultColor;
       
    vec2 blurCenter = vec2(.5, 0.);
    vec2 currentToCenter = blurCenter - vUv;
    float totalWeight = 0.;
    vec4 destColor = vec4(0.);

    float strength = .005;
    vec2 currentToCenterStep = currentToCenter * strength;
        
    for(int i = 0; i <= sampleCount; i++) {
        float fi = float(i);
        float weight = (float(sampleCount) - float(i)) / float(sampleCount);
        vec2 currentStep = currentToCenterStep * fi;
        vec2 uv = vUv + currentStep;
        uv = vec2(
            clamp(uv.x, 0., 1.),
            clamp(uv.y, 0., 1.)
        );
        // use weight
        // destColor += texture(uSrcTexture, uv) * weight;
        // totalWeight += weight;
        // simple convolution
        destColor += texture(uSrcTexture, uv);
        totalWeight += 1.;
    }
    
    destColor /= totalWeight;
    
    outColor = destColor;
    
    // debug
    
    // outColor = resultColor;
}
