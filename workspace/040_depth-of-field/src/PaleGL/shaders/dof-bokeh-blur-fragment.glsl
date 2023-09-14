#version 300 es

//
// ref: https://catlikecoding.com/unity/tutorials/advanced-rendering/depth-of-field/
//
            
precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform vec2 uTexelSize;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);

    // tent filter
    vec4 offset = uTexelSize.xyxy * vec2(.5, -.5).xxyy;
    vec4 s =
        texture(uSrcTexture, vUv + offset.xy) +
        texture(uSrcTexture, vUv + offset.zy) +
        texture(uSrcTexture, vUv + offset.xw) +
        texture(uSrcTexture, vUv + offset.zw);
    outColor = s * .25;
        

    // for debug
    // outColor = sceneColor;
}           
