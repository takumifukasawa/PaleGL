#version 300 es

//
// ref: https://catlikecoding.com/unity/tutorials/advanced-rendering/depth-of-field/
//
            
precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uCocTexture;
uniform vec2 uTexelSize;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);
    vec4 cocColor = texture(uSrcTexture, vUv);
 
    vec4 kernel = uTexelSize.xyxy * vec2(-.5, .5).xxyy;
    
    float coc0 = texture(uCocTexture, vUv + kernel.xy).r;
    float coc1 = texture(uCocTexture, vUv + kernel.zy).r;
    float coc2 = texture(uCocTexture, vUv + kernel.xw).r;
    float coc3 = texture(uCocTexture, vUv + kernel.zw).r;
    
    float coc = 0.;
    // coc = (coc0 + coc1 + coc2 + coc3) * .25;
    float cocMin = min(min(min(coc0, coc1), coc2), coc3);
    float cocMax = max(max(max(coc0, coc1), coc2), coc3);
    coc = cocMax >= -cocMin ? cocMax : cocMin;
    
    outColor = vec4(vec3(coc), 1.);
    
    // for debug
    // outColor = sceneColor;
    // outColor = cocColor;
}           
