#pragma DEFINES

#pragma ATTRIBUTES

#include <lighting>
#include <ub>

out vec2 vUv;
out vec3 vWorldPosition;
out vec3 vNormal;

out vec4 vVertexColor;
out vec4 vViewPosition;
out vec4 vClipPosition;

uniform vec2[4] uBillboardPositionConverters;

void main() {
    int particleId = int(mod(float(gl_VertexID), 4.));
    float cycleSpeed = 1.;
    float cycleOffset = aBillboardCycleOffset;
    
    #pragma BEGIN_MAIN

    float r = mod((uTime * cycleSpeed) + cycleOffset, 1.);

    vec4 localPosition = vec4(aPosition, 1.);

    #pragma LOCAL_POSITION_POST_PROCESS

    vUv = aUv; 
    
    vec4 vertexColor = aColor;

    #pragma VERTEX_COLOR_POST_PROCESS

    vVertexColor = vertexColor;

    vec4 worldPosition = uWorldMatrix * localPosition;
  
    vWorldPosition = worldPosition.xyz;
    
    vec4 viewPosition = uViewMatrix * worldPosition;
    viewPosition.xy += uBillboardPositionConverters[particleId] * aBillboardSize;
    vViewPosition = viewPosition;
    
    vec4 clipPosition = uProjectionMatrix * viewPosition;
 
    gl_Position = clipPosition;
    
    vClipPosition = clipPosition;
}
