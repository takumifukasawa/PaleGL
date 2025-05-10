#pragma DEFINES

#pragma ATTRIBUTES

#pragma APPEND_ATTRIBUTES

#include <lighting>
#include <ub>

// varyings
out vec2 vUv;

#pragma APPEND_UNIFORMS

#include <shape_font_h>

uniform vec4 uUICanvas;
uniform mat4 uUICanvasProjectionMatrix;

void main() {
    #pragma BEGIN_MAIN

    vec4 localPosition = vec4(aPosition, 1.);

    // ローカル座標系でなんとかする場合
    // 
    // // fix font aspect and screen aspect
    // localPosition.x /= uViewport.z;
    // localPosition.xy *= uFontAspect * 2.;
    // // if(uViewport.x > uViewport.y) {
    // //     localPosition.xy *= uFontAspect * 2.;
    // // } else {
    // //     localPosition.xy *= uFontAspect * 2.;
    // // }
    // 
    // mat4 m = uWorldMatrix;
    // mat4 wm = uWorldMatrix;
    // 
    // // js側からはピクセル値で渡すのでviweportで割る
    // // wm[3][0] /= uViewport.x; // px
    // // wm[3][1] /= uViewport.y; // py
    // // wm[3][0] /= uViewport.x; // pz

    // // localPosition.xy -= vec2(1., 1.);
   
    // // left top anchor 
    // wm[3][0] = -1.;
    // wm[3][1] = 1.;

    // gl_Position =  wm * localPosition;
   
    // end
    
    // 画面の拡縮に合わせてスケールする
    localPosition.x /= uViewport.z;
    localPosition.x /= uFontAspect;
    localPosition.xy *= uViewport.z;
    
    vUv = aUv;
    gl_Position = uProjectionMatrix * uWorldMatrix * localPosition;
    
    #pragma END_MAIN
}
