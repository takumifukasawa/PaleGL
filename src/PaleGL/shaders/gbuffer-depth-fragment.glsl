#pragma DEFINES

uniform vec4 uColor; // TODO: base color
uniform sampler2D uBaseMap; 
uniform vec4 uBaseMapTiling;

#ifdef USE_ALPHA_TEST
uniform float uAlphaTestThreshold;
#endif

in vec2 vUv;

#ifdef USE_VERTEX_COLOR
in vec4 vVertexColor;
#endif

out vec4 outColor;

#include <alpha_test>

void main() {
    vec2 uv = vUv * uBaseMapTiling.xy + uBaseMapTiling.zw;
  
    // TODO: multiply base color
    vec4 baseMapColor = texture(uBaseMap, uv);
    
    vec4 baseColor = vec4(0.);

#ifdef USE_VERTEX_COLOR
    baseColor = vVertexColor * uColor * baseMapColor;
#else
    baseColor = uColor * baseMapColor;
#endif   

    // TODO: base color を渡して alpha をかける
    vec4 resultColor = baseColor;

    // #include <alpha_test_f>
    #include ./partial/alpha-test-fragment.partial.glsl

    outColor = vec4(1., 1., 1., 1.);
}
