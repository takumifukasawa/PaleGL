#version 300 es
            
precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);

    outColor = sceneColor;
}           
