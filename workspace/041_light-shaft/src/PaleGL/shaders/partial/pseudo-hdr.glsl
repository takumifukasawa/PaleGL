
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
