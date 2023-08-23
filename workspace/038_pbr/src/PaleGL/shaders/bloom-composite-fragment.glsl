#version 300 es
            
precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uBlur4Texture;
uniform sampler2D uBlur8Texture;
uniform sampler2D uBlur16Texture;
uniform sampler2D uBlur32Texture;
uniform float uTone;
uniform float uBloomAmount;

void main() {
    vec4 blur4Color = texture(uBlur4Texture, vUv);
    vec4 blur8Color = texture(uBlur8Texture, vUv);
    vec4 blur16Color = texture(uBlur16Texture, vUv);
    vec4 blur32Color = texture(uBlur32Texture, vUv);
    vec4 sceneColor = texture(uSrcTexture, vUv) * uTone;

    vec4 blurColor = (blur4Color + blur8Color + blur16Color + blur32Color) * uBloomAmount;

    outColor = sceneColor + blurColor;

    // for debug
    // outColor = blur4Color;
    // outColor = blur8Color;
    // outColor = blur16Color;
    // outColor = blur32Color;
    // outColor = blurColor;
    // outColor = vec4(vec3(step(3., outColor.r)), 1.0);
}           
