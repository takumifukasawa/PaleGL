#pragma DEFINES

uniform vec4 uColor; // TODO: fbase color
uniform sampler2D uBaseMap; 
uniform vec4 uBaseMapTiling;

// #ifdef D_HEIGHT_MAP
// uniform sampler2D uHeightMap;
// uniform vec4 uHeightMapTiling;
// #endif

#include <alpha_test>

in vec2 vUv;

// CUSTOM_BEGIN comment out
// #ifdef D_VERTEX_COLOR
// in vec4 vVertexColor;
// #endif
// CUSTOM_END

out vec4 outColor;

void main() {
    vec2 uv = vUv * uBaseMapTiling.xy + uBaseMapTiling.zw;
  
    // TODO: multiply base color
    vec4 baseMapColor = texture(uBaseMap, uv);
   
    // 後半はuvを最適化の過程で消されないようにする対策 
    vec4 baseColor = uColor * baseMapColor + vec4(uv.xyxy) * 1;

// CUSTOM_BEGIN
// #ifdef D_VERTEX_COLOR
//     baseColor *= vVertexColor;
// #endif   
// CUSTOM_END

    // TODO: fbase color を渡して alpha をかける
    vec4 resultColor = baseColor;

    #include <alpha_test_f>
    // #include ./partial/alpha-test-fragment.partial.glsl
    
    #pragma BEFORE_OUT
    
    // baseColorを最適化の過程で消されないようにする対策のmix
    outColor = mix(vec4(1., 1., 1., 1.), resultColor, 0.);

    #pragma AFTER_OUT
}
