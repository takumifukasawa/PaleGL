
#include <common>
#include <lighting>
#include <ub>
#include <rand>

layout (location = 0) out vec3 outVelocity;
layout (location = 1) out vec3 outPosition;

// uniform float uMaxRadius;

void main(void) {
  float maxRadius = 2.;
  outVelocity = vec3(0.);
  vec2 coord = vec2(float(gl_FragCoord.x), float(gl_FragCoord.y));
  float seed = fRand(coord);
  outPosition = fRandomInSphere(seed) * maxRadius;

  #pragma GPU_PARTICLE_MODIFY_INITIALIZE
        
  // for debug
  // ivec2 coord = ivec2(gl_FragCoord.xy);
  // outPosition = vec3(float(coord.y) * .2, 1., 0.);
  // outVelocity = vec3(1.);
  // outPosition = vec3(0., 5., 0.);
  // outUp = normalize(vec3(1., 1., 1.));
}
