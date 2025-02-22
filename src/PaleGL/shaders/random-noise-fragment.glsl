#include <common>
#include <rand>
#include <etex>

uniform float uTiling;

// ---------------------------------------------------------------------
// ref: https://www.shadertoy.com/view/ltB3zD

const float PHI = 1.61803398874989484820459; // Φ = Golden Ratio 

float goldNoise(in vec2 xy, in float seed) {
    return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}

// ---------------------------------------------------------------------

void main() {
    vec2 resolution = uResolution;
    vec2 gridSize = uGridSize;
    vec2 uv = vUv;

    // random noise
    float result = goldNoise(floor(uv * gridSize) + uTime, 1.);
    
    outColor = vec4(vec3(result), 1.);
}
