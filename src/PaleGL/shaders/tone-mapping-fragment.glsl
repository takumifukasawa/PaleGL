#include <tone>

#include ./partial/pseudo-hdr.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;

void main() {
    // 疑似HDRする場合
    // vec4 textureColor = texture(uSrcTexture, vUv);
    // vec4 color = decodePseudoHDR(textureColor);
    // outColor = vec4(color.xyz, 1.);

    vec3 resultColor = texture(uSrcTexture, vUv).xyz;

    // some tone mappings
    // resultColor = reinhardExposure(resultColor, 1000000000.);
    // resultColor = reinhard(resultColor);
    resultColor = aces(resultColor);
    
    // linear で作業してるのでスクリーン向けに degamma
    resultColor = degamma(resultColor);

    // 露出オーバー確認
    if(
        resultColor.r > 1.
        || resultColor.g > 1.
        || resultColor.b > 1.
    ) {
        resultColor = vec3(1., 0., 1.);
    }
    
    outColor = vec4(resultColor, 1.);
}
