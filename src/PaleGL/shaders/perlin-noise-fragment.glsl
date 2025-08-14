#include <common>
#include <rand>
#include <etex>
#include <perlin>
#include <lighting>
#include <ub>

void main() {
    vec2 resolution = uResolution;
    vec2 gridSize = uGridSize;
    vec2 uv = vUv;

    float result = perlinNoise(uv * gridSize + uTime, uIsImproved);

    outColor = vec4(vec3(result), 1.);
}
