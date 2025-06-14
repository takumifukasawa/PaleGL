#include <common>
#include <lighting>
#include <ub>
#include <rand>
in vec3 vPosition;
in vec2 vUv;
uniform sampler2D uVelocityMap;
uniform sampler2D uPositionMap;
uniform sampler2D uUpMap;
uniform vec2 uTexelSize;
uniform float uTargetWidth;
uniform float uTargetHeight;

uniform float uNoiseScale;
uniform float uSpeed;

layout (location = 0) out vec3 outVelocity;
layout (location = 1) out vec3 outPosition;
layout (location = 2) out vec3 outUp;

const float EPS = 1e-6;

// 分岐なしの安全クロス正規化
vec3 safeNormalizedCross2(vec3 a, vec3 b) {
    vec3 c = cross(a, b);
    float clen = length(c);
    return normalize(c / max(clen, EPS));
}

vec3 curlNoise(vec3 position) {
    float eps = .0001;
    float eps2 = 2. * eps;
    float invEps2 = 1. / eps2;
    vec3 dx = vec3(eps, 0., 0.);
    vec3 dy = vec3(0., eps, 0.);
    vec3 dz = vec3(0., 0., eps);
    // 勾配検出のためにepsだけずらした地点のnoiseを参照
    vec3 px0 = snoise3(position - dx);
    vec3 px1 = snoise3(position + dx);
    vec3 py0 = snoise3(position - dy);
    vec3 py1 = snoise3(position + dy);
    vec3 pz0 = snoise3(position - dz);
    vec3 pz1 = snoise3(position + dz);
    // 回転
    float x = (py1.z - py0.z) - (pz1.y - pz0.y);
    float y = (pz1.x - pz0.x) - (px1.z - px0.z);
    float z = (px1.y - px0.y) - (py1.x - py0.x);
    return vec3(x, y, z) * invEps2;
}

void main() {
    // // // pattern: uv
    // vec2 rawUv = vUv;
    // vec2 sc = vec2(uTargetWidth, uTargetHeight);
    // vec2 fid = rawUv * sc - mod(rawUv * sc, 1.); // float 0,1,2...
    // vec2 uv = fid / sc; // 0~1
    // // vec3 prevVelocity = texture(uVelocityMap, uv).xyz;
    // // vec3 prevPosition = texture(uPositionMap, uv).xyz;
    // // vec3 prevUp = texture(uUpMap, uv).xyz;

    // pattern: texel
    // ivec2 coord = ivec2(gl_FragCoord.xy);
    // vec3 prevVelocity = texelFetch(uVelocityMap, coord, 0).xyz;
    // vec3 prevPosition = texelFetch(uPositionMap, coord, 0).xyz;
    // vec3 prevUp = texelFetch(uUpMap, coord, 0).xyz;

    // pattern: texel
    ivec2 coord = ivec2(gl_FragCoord.xy);
    vec3 nextVelocity, nextPosition, nextUp;
    vec3 prevVelocity, prevPosition, prevUp;
    if(coord.y == 0) {
        // 先頭の場合は速度や移動を直接計算
        prevVelocity = texelFetch(uVelocityMap, coord, 0).xyz;
        prevPosition = texelFetch(uPositionMap, coord, 0).xyz;
        prevUp = texelFetch(uUpMap, coord, 0).xyz;
        vec3 force = curlNoise(prevPosition * .1) - prevVelocity;
        float dt = min(max(uDeltaTime, 1. / 120.), 1. / 60.);
        float speed = 2.;
        nextVelocity = force * speed * dt; // fallback time step
        nextPosition = prevPosition + nextVelocity;
        vec3 front = normalize(nextVelocity);
        vec3 right = cross(front, normalize(prevUp));
        nextUp = normalize(cross(right, front));
    } else {
        // 先頭以外の場合は1つ上のtexelを参照
        coord = ivec2(coord.x, coord.y - 1);
        nextVelocity = texelFetch(uVelocityMap, coord, 0).xyz;
        nextPosition = texelFetch(uPositionMap, coord, 0).xyz;
        nextUp = texelFetch(uUpMap, coord, 0).xyz;
    }
   
    outVelocity = nextVelocity;
    outPosition = nextPosition;
    outUp = nextUp;
  
    // for debug 
    // outPosition = vec3(prevPosition.x + 1. * uDeltaTime, prevPosition.y, prevPosition.z);
    // prevVelocity = texelFetch(uVelocityMap, coord, 0).xyz;
    // prevPosition = texelFetch(uPositionMap, coord, 0).xyz;
    // prevUp = texelFetch(uUpMap, coord, 0).xyz;
    // outVelocity = prevVelocity;
    // outPosition = prevPosition;
    // outUp = prevUp;
    // outVelocity = vec3(uv, 1.);
    // outPosition = vec3(uv, 1.);
    // outUp = vec3(1., 1., 1.);
}
