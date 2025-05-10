#pragma DEFINES

#pragma ATTRIBUTES

#pragma APPEND_ATTRIBUTES

#include <lighting>
#include <ub>

// varyings
out vec2 vUv;

#pragma APPEND_UNIFORMS

#include <shape_font_h>

void main() {
    #pragma BEGIN_MAIN

    vec4 localPosition = vec4(aPosition, 1.);
  
    // fix font aspect and screen aspect
    localPosition.x /= uViewport.z;
    localPosition.xy *= uFontAspect * 2.;
    // if(uViewport.x > uViewport.y) {
    //     localPosition.xy *= uFontAspect * 2.;
    // } else {
    //     localPosition.xy *= uFontAspect * 2.;
    // }
    
    mat4 m = uWorldMatrix;
    mat4 wm = uWorldMatrix;
    
    // js側からはピクセル値で渡すのでviweportで割る
    // wm[3][0] /= uViewport.x; // px
    // wm[3][1] /= uViewport.y; // py
    // wm[3][0] /= uViewport.x; // pz

    // localPosition.xy -= vec2(1., 1.);
   
    // left top anchor 
    wm[3][0] = -1.;
    wm[3][1] = 1.;

    vUv = aUv;
    gl_Position = wm * localPosition;
    #pragma END_MAIN
}
