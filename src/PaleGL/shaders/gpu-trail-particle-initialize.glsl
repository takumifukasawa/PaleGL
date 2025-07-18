
#include <common>
#include <lighting>
#include <ub>
#include <rand>

layout (location = 0) out vec3 outVelocity;
layout (location = 1) out vec3 outPosition;
layout (location = 2) out vec3 outUp;

// uniform float uMaxRadius;

void main(void) {
  float maxRadius = 2.0; // Set a maximum radius for the sphere
  outVelocity = vec3(0.); // Initial velocity
  vec2 coord = vec2(float(gl_FragCoord.x), float(gl_FragCoord.y));
  float seed = rand(coord);
  outPosition = randomInSphere(rand(coord)) * maxRadius;
  // outUp = normalize(randomOnSphere(seed * 0.21 + rand(3424.34)));
  outUp = normalize(randomOnSphere(seed));
  
  // for debug
  // ivec2 coord = ivec2(gl_FragCoord.xy);
  // outPosition = vec3(float(coord.y) * .2, 1., 0.);
  // outVelocity = vec3(1.);
  // outPosition = vec3(0., 5., 0.);
  // outUp = normalize(vec3(1., 1., 1.));
}
