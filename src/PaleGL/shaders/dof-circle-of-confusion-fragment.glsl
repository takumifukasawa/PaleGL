//
// ref:
// https://catlikecoding.com/unity/tutorials/advanced-rendering/depth-of-field/
// https://github.com/keijiro/KinoBokeh/tree/master
//

#include <lighting>
#include <ub>
#include <depth>

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;

uniform float uFocusDistance;
uniform float uFocusRange;
uniform float uBokehRadius;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);
    float rawDepth = texture(uDepthTexture, vUv).r;
    float eyeDepth = perspectiveDepthToEyeDepth(rawDepth, uNearClip, uFarClip);
    
    // float coc = (depth - uFocusDistance) / uFocusRange;
    float coc = (eyeDepth - uFocusDistance) / uFocusRange;
    coc = clamp(coc, -1., 1.) * uBokehRadius;
    
    // check negative coc
    // if(coc < 0.) {
    //     outColor = vec4(-coc, 0., 0., 1.);
    //     return;
    // }
    
    outColor = vec4(vec3(coc), 1.);
    
    // for debug
    // outColor = sceneColor;
}           
