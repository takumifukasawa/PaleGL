#version 300 es

//
// ref: https://catlikecoding.com/unity/tutorials/advanced-rendering/depth-of-field/
//
            
precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uCocTexture;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);

    // vec4 kernel = uTexelSize.xyxy * vec2(.5, -.5).xxyy * uBokehRadius;
    // 
    // float coc0 = texture(uCocTexture, vUv + kernel.xy).r;
    // float coc1 = texture(uCocTexture, vUv + kernel.zy).r;
    // float coc2 = texture(uCocTexture, vUv + kernel.xw).r;
    // float coc3 = texture(uCocTexture, vUv + kernel.zw).r;
    // 
    // float coc = (coc0 + coc1 + coc2 + coc3) * .25;
    
    // for debug
    outColor = sceneColor;
}           
