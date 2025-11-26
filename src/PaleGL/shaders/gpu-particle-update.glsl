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
    vec3 nextVelocity = force * 1. * dt;
    
    outVelocity = nextVelocity;
    
    // CUSTOM_BEGIN comment out
    // #pragma GPU_PARTICLE_MODIFY_UPDATE
    // CUSTOM_END
    
    outPosition = prevPosition + outVelocity;
    outUp = vec3(0., 1., 0.); // TODO: 速度関係なしに一旦

    // tmp
    // vec3 front = normalize(outVelocity);
    // vec3 right = cross(front, normalize(prevUp));
    // vec3 nextUp = normalize(cross(right, front));
    // outVelocity = nextVelocity;
    // outPosition = nextPosition;
}
