
float fIsArea(vec2 uv) {
    return step(0., uv.x) * (1. - step(1., uv.x)) * step(0., uv.y) * (1. - step(1., uv.y));
}

vec4 fCalcAreaColor(vec4 color, vec2 uv, vec2 tiling, vec2 offset) {
    return color * fIsArea(uv * tiling + offset);
}

vec4 fCalcTextureAreaColor(sampler2D tex, vec2 uv, vec2 tiling, vec2 offset) {
    return fCalcAreaColor(texture(tex, uv * tiling + offset), uv, tiling, offset);
}
