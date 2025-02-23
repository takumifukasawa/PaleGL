#pragma DEFINES

uniform vec4 uColor; // TODO: diffuse color
uniform sampler2D uDiffuseMap; 
uniform vec2 uDiffuseMapUvScale;

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
    vec2 uv = vUv * uDiffuseMapUvScale;
  
    // TODO: multiply diffuse color
    vec4 diffuseMapColor = texture(uDiffuseMap, uv);
    
    vec4 diffuseColor = vec4(0.);

#ifdef USE_VERTEX_COLOR
    diffuseColor = vVertexColor * uColor * diffuseMapColor;
#else
    diffuseColor = uColor * diffuseMapColor;
#endif   

    // TODO: base color を渡して alpha をかける
    vec4 resultColor = diffuseColor;

    // #include <alpha_test_f>
    #include ./partial/alpha-test-fragment.partial.glsl

    outColor = vec4(1., 1., 1., 1.);
}
