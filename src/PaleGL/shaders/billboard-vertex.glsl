#pragma DEFINES

#pragma ATTRIBUTES

#include <lighting>
#include <ub>

out vec2 vUv;
out vec3 vWorldPosition;
out vec3 vNormal;

out vec4 vViewPosition;
out vec4 vClipPosition;

const vec2[4] billboardPositionConverters = vec2[](
    vec2(-1., 1.),
    vec2(-1., -1.),
    vec2(1., 1.),
    vec2(1., -1.)
);

void main() {
    int particleId = int(mod(float(gl_VertexID), 4.));
    
    #pragma BEGIN_MAIN

    vec4 localPosition = vec4(aPosition, 1.);

    #pragma LOCAL_POSITION_POST_PROCESS

    vUv = aUv; 
    
    #pragma VERTEX_COLOR_POST_PROCESS

    vec4 worldPosition = uWorldMatrix * localPosition;
  
    vWorldPosition = worldPosition.xyz;
    
    vec4 viewPosition = uViewMatrix * worldPosition;
    viewPosition.xy += billboardPositionConverters[particleId] * aBillboardSize;
    vViewPosition = viewPosition;
    
    vec4 clipPosition = uProjectionMatrix * viewPosition;
 
    gl_Position = clipPosition;
    
    vClipPosition = clipPosition;
}
