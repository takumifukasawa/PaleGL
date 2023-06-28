
// TODO: gaussの重みはuniformで送るべき
export const gaussianBlurFragmentShader = ({ pixelNum, isHorizontal, srcTextureUniformName }) => `#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D ${srcTextureUniformName};
uniform float uTargetWidth;
uniform float uTargetHeight;
uniform float[${pixelNum}] uBlurWeights;

void main() {
    vec4 textureColor = texture(${srcTextureUniformName}, vUv);
    vec4 sampleColor = vec4(0.);
    vec2 texelSize = vec2(1. / uTargetWidth, 1. / uTargetHeight);

    const int pixelNum = ${pixelNum};
    float width = floor(float(pixelNum) / 2.);
    for(int i = 0; i < pixelNum; i++) {
        float index = float(i) - width;
        float weight = uBlurWeights[i];
        sampleColor += texture(${srcTextureUniformName}, vUv + vec2(${isHorizontal ? "index" : "0."}, ${isHorizontal ? "0." : "index"}) * texelSize) * weight;
    }
    
    outColor = sampleColor;
    
    // for debug
    // outColor = textureColor;
}`;