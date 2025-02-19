#version 300 es

//
// ref:
// https://catlikecoding.com/unity/tutorials/advanced-rendering/depth-of-field/
// https://github.com/keijiro/KinoBokeh/tree/master
//
            
precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform vec2 uTexelSize;
uniform float uBokehRadius;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);

    // tent filter
    vec4 kernel = uTexelSize.xyxy * vec2(-.5, .5).xxyy;
    vec4 s =
        texture(uSrcTexture, vUv + kernel.xy) +
        texture(uSrcTexture, vUv + kernel.zy) +
        texture(uSrcTexture, vUv + kernel.xw) +
        texture(uSrcTexture, vUv + kernel.zw);
        // texture(uSrcTexture, vUv + vec2(uTexelSize.x * -.5, uTexelSize.y * -.5) * uBokehRadius) +
        // texture(uSrcTexture, vUv + vec2(uTexelSize.x * -.5, uTexelSize.y * .5) * uBokehRadius) +
        // texture(uSrcTexture, vUv + vec2(uTexelSize.x * .5, uTexelSize.y * -.5) * uBokehRadius) +
        // texture(uSrcTexture, vUv + vec2(uTexelSize.x * .5, uTexelSize.y * .5) * uBokehRadius);
        
    // TODO: 輝度値を考慮する必要がある？
    outColor = s * .25;
        

    // for debug
    // outColor = sceneColor;
}           
