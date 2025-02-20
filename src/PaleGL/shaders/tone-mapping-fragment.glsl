#include ./partial/pseudo-hdr.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;

#include ./partial/tone-mapping.glsl

// vec3 reinhard(vec3 x) {
//     return x / (x + vec3(1.));
// }
// 
// vec3 reinhardExposure(vec3 x, float exposure) {
//     float l2 = exposure * exposure;
//     return (x / (x + vec3(1.))) * (1. + (x / exposure));
// }
// 
// vec3 aces(vec3 x) {
//     float a = 2.51;
//     float b = .03;
//     float c = 2.43;
//     float d = .59;
//     float e = .14;
//     vec3 y = (x * (a * x + b)) / (x * (c * x + d) + e);
//     return clamp(y, 0., 1.);
// }
// 
// vec3 gamma(vec3 color) {
//     return pow(color, vec3(1. / 2.2));
// }

void main() {
    // 疑似HDRする場合
    // vec4 textureColor = texture(uSrcTexture, vUv);
    // vec4 color = decodePseudoHDR(textureColor);
    // outColor = vec4(color.xyz, 1.);

    vec3 resultColor = texture(uSrcTexture, vUv).xyz;
    // outColor = vec4(resultColor, 1.);
    // return;

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
