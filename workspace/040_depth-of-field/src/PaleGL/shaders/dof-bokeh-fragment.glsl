#version 300 es
            
precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform float uSrcTextureWidth;
uniform float uSrcTextureHeight;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);

    vec3 color = vec3(0.);
    float weight = 0.;
    
    vec2 texelSize = vec2(1. / uSrcTextureWidth, 1. / uSrcTextureHeight);
   
    // 1. rectangle sample 
    // for(int u = -4; u <= 4; u++) {
    //     for(int v = -4; v <= 4; v++) {
    //         vec2 kernelTexelUv = vec2(u, v);
    //         vec2 offset = kernelTexelUv * texelSize * 2.;
    //         vec2 uv = vUv + offset;
    //         color += texture(uSrcTexture, uv).rgb;
    //     }
    // }
    // color /= 81.;
  
    // 2. circular sample 
    for(int u = -4; u <= 4; u++) {
        for(int v = -4; v <= 4; v++) {
            vec2 kernelTexelUv = vec2(u, v);
            if(length(kernelTexelUv) <= 4.) {
                kernelTexelUv *= texelSize * 4.;
                vec2 uv = vUv + kernelTexelUv;
                color += texture(uSrcTexture, uv).rgb;
                weight += 1.;
            }
        }
    }
    color *= 1. / weight;
  
    
    outColor = vec4(color, 1.);
    
    // for debug
    // outColor = sceneColor;
}           
