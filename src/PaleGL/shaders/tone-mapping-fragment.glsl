#include <tone>

// ref: https://game.watch.impress.co.jp/docs/20081203/3dmg4.htm

// hdr rgb -> 8bit color
vec4 fEncodePseudoHDR(vec3 color) {
    float fbase = .25;
    float l = max(max(color.r, color.g), max(color.b, fbase));
    return vec4(
        color.r / l,
        color.g / l,
        color.b / l,
        fbase / l
    );
}

// rgb: hdr color, alpha: luma
vec4 fDecodePseudoHDR(vec4 encodedColor) {
    float fbase = .25;
    float rl = encodedColor.a;
    return vec4(
        (encodedColor.r / rl) * fbase,
        (encodedColor.g / rl) * fbase,
        (encodedColor.b / rl) * fbase,
        rl * fbase
    );
}

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;

void main() {
    // 疑似HDRする場合
    // vec4 textureColor = texture(uSrcTexture, vUv);
    // vec4 color = fDecodePseudoHDR(textureColor);
    // outColor = vec4(color.xyz, 1.);

    vec3 resultColor = texture(uSrcTexture, vUv).xyz;

    // some tone mappings
    // resultColor = fReinhardExposure(resultColor, 1000000000.);
    // resultColor = reinhard(resultColor);
    resultColor = fAces(resultColor);
    
    // linear で作業してるのでスクリーン向けに fDegamma
    resultColor = fDegamma(resultColor);

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
