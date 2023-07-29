#version 300 es
            
precision mediump float;

out vec4 outColor;

in vec2 vUv;

uniform sampler2D uSrcTexture;
uniform float uThreshold;

void main() {
    vec4 color = texture(uSrcTexture, vUv);
    float k = uThreshold;
    
    // pattern_1
    // ex
    // k: 0.9, c: 1 => b = 1 
    // k: 0.8, c: 1 => b = 0.25
    vec4 b = (color - vec4(k)) / (1. - k);
    
    // pattern_2
    // vec4 b = color - k;
    
    outColor = clamp(b, 0., 1.);

    // for debug
    // outColor = b;
}
