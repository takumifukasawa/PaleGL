in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform float uTargetWidth;
uniform float uTargetHeight;
uniform float[7] uBlurWeights;
uniform float uIsHorizontal;

void main() {
    vec4 textureColor = texture(uSrcTexture, vUv);
    vec4 sampleColor = vec4(0.);
    vec2 texelSize = vec2(1. / uTargetWidth, 1. / uTargetHeight);

    const int pixelNum = 7;
    float width = floor(float(pixelNum) / 2.);
    for(int i = 0; i < pixelNum; i++) {
        float index = float(i) - width;
        float weight = uBlurWeights[i];
        // sampleColor += texture(uSrcTexture, vUv + vec2(${isHorizontal ? 'index' : '0.'}, ${
        sampleColor += texture(
            uSrcTexture,
            vUv + vec2(
                step(.5, uIsHorizontal) > .5 ? index : 0.,
                step(.5, uIsHorizontal) > .5 ? 0. : index
            ) * texelSize
        ) * weight;
    }
    
    outColor = sampleColor;
    
    // for debug
    // outColor = textureColor;
}
