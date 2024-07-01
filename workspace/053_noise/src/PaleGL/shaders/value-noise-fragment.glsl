#version 300 es

precision highp float;

#pragma EFFECT_TEXTURE_HEADER

uniform float uTiling;

float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 i00 = vec2(i);
    vec2 i01 = vec2(i) + vec2(1., 0.);
    vec2 i10 = vec2(i) + vec2(0., 1.);
    vec2 i11 = vec2(i) + vec2(1., 1.);

    float r00 = rand(i00);
    float r10 = rand(i01);
    float r01 = rand(i10);
    float r11 = rand(i11);

    float sx = smooth(f.x);
    float sy = smooth(f.y);
    float vny0 = mix(r00, r10, sx);
    float vny1 = mix(r01, r11, sx);
    float vn = mix(vny0, vny1, sy);
    
    return vn;
}

void main() {
    vec2 resolution = uResolution;
    vec2 gridSize = uGridSize;

    vec2 uv = vUv;

    // random noise
    float result = randomNoise(uv * gridSize);
    
    outColor = vec4(vec3(result), 1.);
}
