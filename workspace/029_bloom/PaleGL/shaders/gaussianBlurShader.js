
// TODO: gaussの重みはuniformで送るべき
export const gaussianBlurFragmentShader = ({ pixelNum, isHorizontal, srcTextureUniformName }) => `#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D ${srcTextureUniformName};

// ------------------------------------------------------
//
// # 3x3
//
// 1/4, 2/4, 1/4 を縦横 => 3 + 3 => 6回 fetch
//
// --------------------------
// | 1 | 2 | 1 |
// | 2 | 4 | 2 | * (1 / 16)
// | 1 | 2 | 1 |
// --------------------------
//
// # 5x5
//
// 1/16, 4/16, 6/16, 4/16, 1/16 を縦横 => 5 + 5 => 10回 fetch
//
// -------------------------------------
// | 1 | 4  | 6  | 4  | 1 |
// | 4 | 16 | 24 | 16 | 4 |
// | 6 | 24 | 36 | 24 | 6 | * (1/ 256)
// | 4 | 16 | 24 | 16 | 4 |
// | 1 | 4  | 6  | 4  | 1 |
// -------------------------------------
//
// ------------------------------------------------------

float gauss(float sigma, float x) {
    float sigma2 = sigma * sigma;
    return exp(-(x * x) / (2. * sigma));
}

uniform float uTargetWidth;
uniform float uTargetHeight;

void main() {
    vec4 textureColor = texture(${srcTextureUniformName}, vUv);
    vec4 sampleColor = vec4(0.);
    vec2 texelSize = vec2(1. / uTargetWidth, 1. / uTargetHeight);

    const int pixelNum = ${pixelNum};
    float sum = 0.;
    float[pixelNum] weights;
    float width = floor(float(pixelNum) / 2.);
    float sigma = width;
    for(int i = 0; i < pixelNum; i++) {
        weights[i] = gauss(sigma, float(i) - width);
        sum += weights[i];
    }
    for(int i = 0; i < pixelNum; i++) {
        float weight = weights[i] /= sum;
        float index = float(i) - width;
        sampleColor += texture(${srcTextureUniformName}, vUv + vec2(${isHorizontal ? "index" : "0."}, ${isHorizontal ? "0." : "index"}) * texelSize) * weight;
    }
    
    outColor = sampleColor;
    
    // for debug
    // outColor = textureColor;
}`;