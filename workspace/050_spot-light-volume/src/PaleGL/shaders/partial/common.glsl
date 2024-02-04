
#define saturate(x) min(1., max(0., x))

// #define PI 3.14159265359
// #define PI2 6.28318530718
// #define RECIPROCAL_PI 0.31830988618
// #define RECIPROCAL_PI2 0.15915494
// #define LOG2 1.442695
// #define EPSILON 1e-6


// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float noise(vec2 seed)
{
    return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
}
