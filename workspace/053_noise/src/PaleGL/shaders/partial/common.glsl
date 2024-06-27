
#define saturate(a) clamp(a, 0., 1.)

// #define PI 3.14159265359
// #define PI2 6.28318530718
// #define RECIPROCAL_PI 0.31830988618
// #define RECIPROCAL_PI2 0.15915494
// #define LOG2 1.442695
// #define EPSILON 1e-6

float isArea(vec2 uv) {
    return step(0., uv.x) * (1. - step(1., uv.x)) * step(0., uv.y) * (1. - step(1., uv.y));
}

vec4 calcAreaColor(vec4 color, vec2 uv, vec2 tiling, vec2 offset) {
    return color * isArea(uv * tiling + offset);
}

vec4 calcTextureAreaColor(sampler2D tex, vec2 uv, vec2 tiling, vec2 offset) {
    return calcAreaColor(texture(tex, uv * tiling + offset), uv, tiling, offset);
}
