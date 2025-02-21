// 0 - 1
float rand(vec2 co){
    // return fract(sin(dot(co.xy ,vec2(12.98, 78.23))) * 43.75);
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 hash3(vec3 p) {
    vec3 q = vec3(
    dot(p, vec3(127.1, 311.7, 114.5)),
    dot(p, vec3(269.5, 183.3, 191.9)),
    dot(p, vec3(419.2, 371.9, 514.1))
    );
    return fract(sin(q) * 43758.5433);
}
