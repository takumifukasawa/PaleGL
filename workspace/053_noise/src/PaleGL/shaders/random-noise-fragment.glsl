#version 300 es

precision highp float;

#define saturate(x) clamp(x, 0., 1.)

#define smooth(x) smoothstep(0., 1., x)

in vec2 vUv;

out vec4 outColor;

uniform vec2 uResolution;
uniform vec2 uGridSize;
uniform float uTime;

float smooth5(float t) {
    float t3 = t * t * t;
    float t4 = t * t * t * t;
    float t5 = t * t * t * t * t;
    return 6. * t5 - 15. * t4 + 10. * t3;
}

// ref: https://stackoverflow.com/questions/12964279/whats-the-origin-of-this-glsl-rand-one-liner
float rand(vec2 co) {
    return mod(
        sin(
            dot(
                co.xy,
                vec2(12.9898, 78.233)
            )
        ) * 43758.5453,
        1.
    );
}

// ref: https://thebookofshaders.com/edit.php#11/2d-gnoise.frag
vec2 rand2(vec2 st){
    st = vec2( dot(st,vec2(127.1,311.7)),
              dot(st,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(st)*43758.5453123);
}

// Some useful functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

uniform float uTiling;

// ---------------------------------------------------------------------
// ref: https://www.shadertoy.com/view/ltB3zD

const float PHI = 1.61803398874989484820459; // Φ = Golden Ratio 

float goldNoise(in vec2 xy, in float seed) {
    return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}

// ---------------------------------------------------------------------

// float randomNoise(vec2 p) {
//     vec2 i = floor(p);
//     // return rand(i);
//     return (rand(i) + rand(i + 100.)) * .5;
// }

void main() {
    vec2 resolution = uResolution;
    vec2 gridSize = uGridSize;
    vec2 uv = vUv;

    // random noise
    // float result = randomNoise(uv * gridSize);
    float result = goldNoise(floor(uv * gridSize) + uTime, 1.);
    
    outColor = vec4(vec3(result), 1.);
    // outColor = vec4(1., 0., 0., 1.);
}
            