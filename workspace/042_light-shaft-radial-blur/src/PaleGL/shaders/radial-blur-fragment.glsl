#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform float uRadialBlurPassIndex;

const int sampleCount = 12;

// float rand(vec2 co){
//     return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
// }

void main() {
    vec4 resultColor = texture(uSrcTexture, vUv);
    outColor = resultColor;
        
    // TODO: pass center from js
    vec2 blurCenter = vec2(.5, 1.);
   
    float passScale = pow(.4 * float(sampleCount), uRadialBlurPassIndex);
    
    vec2 currentToCenter = (blurCenter - vUv) * passScale;
    float totalWeight = 0.;
    vec4 destColor = vec4(0.);

    float strength = .01;
    vec2 currentToCenterStep = currentToCenter * strength;
    // vec2 currentToCenterStep = currentToCenter * passScale;
        
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
