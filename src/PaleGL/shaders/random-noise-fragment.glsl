#include <common>
#include <rand>
#include <etex>
#include <lighting>
#include <ub>

uniform float uTiling;

// ---------------------------------------------------------------------
// ref: https://www.shadertoy.com/view/ltB3zD
// License: CC BY-NC-SA 3.0 (Shadertoy default license)

const float PHI = 1.61803398874989484820459; // Φ = Golden Ratio 

float fGoldNoise(in vec2 xy, in float seed) {
    return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}

// ---------------------------------------------------------------------

void main() {
    vec2 resolution = uResolution;
    vec2 gridSize = uGridSize;
    vec2 uv = vUv;

    // random fNoise
    float result = fGoldNoise(floor(uv * gridSize) + uTime, 1.);
    
    outColor = vec4(vec3(result), 1.);
}
