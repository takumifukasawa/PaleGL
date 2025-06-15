#include <common>
#include <rand>
#include <etex>
#include <lighting>
#include <ub>

// ---------------------------------------------------------------------

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    // Four corners in 2D of a tile
    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
    (c - a)* u.y * (1.0 - u.x) +
    (d - b) * u.x * u.y;
}

uniform float uOctaves;
uniform float uAmplitude;
uniform float uFrequency;
uniform float uFactor;

// https://iquilezles.org/articles/fbm/ 

float fbmNoise(in vec2 p) {
    float g = exp2(-uFactor);
    float f = uFrequency;
    float a = uAmplitude;
    float t = 0.;
    int octaves = int(uOctaves);
    for(int i = 0; i < octaves; i++) {
        t += a * noise(p * f);
        f *= 2.;
        a *= g;
    }
    return t;
}

void main() {
    vec2 resolution = uResolution;
    vec2 gridSize = uGridSize;
    vec2 uv = vUv;

    float result = fbmNoise(uv * gridSize + uTime);

    outColor = vec4(vec3(result), 1.);
}
