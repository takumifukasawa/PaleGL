#include <tone>

// ref: https://game.watch.impress.co.jp/docs/20081203/3dmg4.htm

// hdr rgb -> 8bit color
vec4 encodePseudoHDR(vec3 color) {
    float base = .25;
    float l = max(max(color.r, color.g), max(color.b, base));
    return vec4(
        color.r / l,
        color.g / l,
        color.b / l,
        base / l
    );
}

// rgb: hdr color, alpha: luma
vec4 decodePseudoHDR(vec4 encodedColor) {
    float base = .25;
    float rl = encodedColor.a;
    return vec4(
        (encodedColor.r / rl) * base,
        (encodedColor.g / rl) * base,
        (encodedColor.b / rl) * base,
        rl * base
    );
}

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
