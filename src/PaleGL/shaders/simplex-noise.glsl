#include <common>
#include <rand>
#include <etex>

uniform float uTiling;

void main() {
    vec2 resolution = uResolution;
    vec2 gridSize = uGridSize;
    vec2 uv = vUv;

    float result = snoise(uv * gridSize + uTime);

    outColor = vec4(vec3(result), 1.);
}
