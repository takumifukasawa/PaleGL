#pragma DEFINES

#pragma BASE_ATTRIBUTES

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

uniform vec2 uBillboardSize;

void main() {
    int particleId = int(mod(float(gl_VertexID), 4.));
   
    // CUSTOM_BEGIN comment out 
    // #pragma BEGIN_MAIN
    // CUSTOM_END

    vec4 localPosition = vec4(aPosition, 1.);

    // CUSTOM_BEGIN comment out
    // #pragma LOCAL_POSITION_POST_PROCESS
    // CUSTOM_END

    vUv = aUv; 
   
    // CUSTOM_BEGIN comment out
    // #pragma VERTEX_COLOR_POST_PROCESS
    // CUSTOM_END

    vec4 worldPosition = uWorldMatrix * localPosition;
  
    vWorldPosition = worldPosition.xyz;
    
    vec4 viewPosition = uViewMatrix * worldPosition;
    // viewPosition.xy += billboardPositionConverters[particleId] * uBillboardSize;
    viewPosition.xy += billboardPositionConverters[particleId] * uBillboardSize;
    vViewPosition = viewPosition;
    
    vec4 clipPosition = uProjectionMatrix * viewPosition;
 
    gl_Position = clipPosition;
    
    vClipPosition = clipPosition;
}
