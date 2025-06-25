#pragma DEFINES

#include <lighting>
#include <ub>
#include <shape_font_h>

uniform vec4 uColor;

in vec2 vUv;

out vec4 outColor;

void main() {
    // vec4 resultColor = uColor;
    
    // #include <shape_font_f>
    
    // vec2 uv = vUv;
    // uv = uv * uFontTiling.xy + uFontTiling.zw;
    // resultColor *= texture(uFontMap, uv);
    // resultColor.a *= shapeFontAlpha(resultColor.r);
    
    vec4 resultColor = calcShapeFont(vUv) * uColor;

    outColor = resultColor;
}
