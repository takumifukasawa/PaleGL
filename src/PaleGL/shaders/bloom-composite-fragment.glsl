#version 300 es
            
precision mediump float;

in vec2 vUv;

out vec4 outColor;

// uniform sampler2D uBrightnessTexture;
uniform sampler2D uSrcTexture;
uniform sampler2D uBlur4Texture;
uniform sampler2D uBlur8Texture;
uniform sampler2D uBlur16Texture;
uniform sampler2D uBlur32Texture;
uniform sampler2D uBlur64Texture;
uniform sampler2D uExtractTexture;
uniform float uTone;
uniform float uBloomAmount;

void main() {
    // vec4 brightnessColor = texture(uBrightnessTexture, vUv);
    vec4 blur4Color = texture(uBlur4Texture, vUv);
    vec4 blur8Color = texture(uBlur8Texture, vUv);
    vec4 blur16Color = texture(uBlur16Texture, vUv);
    vec4 blur32Color = texture(uBlur32Texture, vUv);
    vec4 blur64Color = texture(uBlur64Texture, vUv);
    vec4 sceneColor = texture(uSrcTexture, vUv) * uTone;
    vec4 extractColor = texture(uExtractTexture, vUv) * uTone;

    vec4 blurColor = ((blur4Color + blur8Color + blur16Color + blur32Color + blur64Color) * .2) * uBloomAmount;

    outColor = sceneColor + blurColor;

    // for debug
    // outColor = sceneColor * .1 + blurColor * 1000.;
    // outColor = extractColor;
    // outColor = blurColor;

    // for debug
    // outColor = brightnessColor;
    // outColor = blur4Color;
    // outColor = blur8Color;
    // outColor = blur16Color;
    // outColor = blur32Color;
    // outColor = blurColor;
    // outColor = vec4(vec3(step(3., outColor.r)), 1.0);
}           
