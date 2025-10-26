#include <common>
#include <lighting>
#include <ub>
#include <rand>
#include <curl_noise>

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

void main() {
    // pattern: uv
    // vec2 rawUv = vUv;
    // vec2 sc = vec2(uTargetWidth, uTargetHeight);
    // vec2 fid = rawUv * sc - mod(rawUv * sc, 1.); // float 0,1,2...
    // vec2 uv = fid / sc; // 0~1
    // vec3 prevVelocity = texture(uVelocityMap, uv).xyz;
    // vec3 prevPosition = texture(uPositionMap, uv).xyz;

    // pattern: texel
    ivec2 coord = ivec2(gl_FragCoord.xy);
    vec3 prevVelocity = texelFetch(uVelocityMap, coord, 0).xyz;
    vec3 prevPosition = texelFetch(uPositionMap, coord, 0).xyz;
    vec3 prevUp = texelFetch(uUpMap, coord, 0).xyz;

    vec3 force = fCurlNoise(prevPosition * .1) - prevVelocity;
    float dt = min(max(uDeltaTime, 1. / 120.), 1. / 60.); // fallbackdt
    vec3 newVelocity = force * 1. * dt;
    
    vec3 newPosition = prevPosition + newVelocity;

    vec3 front = normalize(nextVelocity);
    vec3 right = cross(front, normalize(prevUp));
    vec3 nextUp = normalize(cross(right, front));
    
    outVelocity = newVelocity;
    outPosition = newPosition;
}
