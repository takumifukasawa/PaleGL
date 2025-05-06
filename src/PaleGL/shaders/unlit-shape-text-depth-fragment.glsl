#pragma DEFINES

#include <alpha_test>
#include <shape_font_h>

uniform sampler2D uFontMap;
uniform vec4 uFontTiling;

in vec2 vUv;

#ifdef USE_VERTEX_COLOR
in vec4 vVertexColor;
#endif

out vec4 outColor;

void main() {
    vec4 resultColor = vec4(1, 1, 1, 1);

    // vec2 uv = vUv;
    // uv = uv * uFontTiling.xy + uFontTiling.zw;

    // float sdf = median(texture(uFontMap, uv).rgb);

    // float alpha = sdf2alpha(sdf);
    // resultColor.a = alpha;
    
    // outColor = texture(uFontMap, uv);
    // return;
    #include <shape_font_f>
   
    // resultColor = texture(uFontMap, uv);
    #include <alpha_test_f>
    // #include ./partial/alpha-test-fragment.partial.glsl

    // if(f < 1.) {
    //     discard;
    // }

    outColor = vec4(1., 1., 1., 1.);
}
