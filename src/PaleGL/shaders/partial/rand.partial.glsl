// 0 - 1
// ref: https://stackoverflow.com/questions/12964279/whats-the-origin-of-this-glsl-rand-one-liner
float rand(vec2 co){
    // return fract(sin(dot(co.xy ,vec2(12.98, 78.23))) * 43.75);
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
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

vec3 hash3(vec3 p) {
    vec3 q = vec3(
    dot(p, vec3(127.1, 311.7, 114.5)),
    dot(p, vec3(269.5, 183.3, 191.9)),
    dot(p, vec3(419.2, 371.9, 514.1))
    );
    return fract(sin(q) * 43758.5433);
}
