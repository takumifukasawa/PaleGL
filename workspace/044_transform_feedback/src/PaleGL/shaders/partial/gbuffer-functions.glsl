
struct GBufferA {
    vec3 baseColor; // rgb
    // a
};

struct GBufferB {
    vec3 normal; // rgb
    // a
};

struct GBufferC {
    float metallic; // x
    float roughness; // y
};

vec4 EncodeGBufferA(vec3 baseColor) {
    return vec4(baseColor, 1.);
}

vec4 EncodeGBufferB(vec3 normal) {
    return vec4(normal * .5 + .5, 1.);
}

vec4 EncodeGBufferC(float metallic, float roughness) {
    return vec4(metallic, roughness, 0., 1.);
}

GBufferA DecodeGBufferA(sampler2D gBufferATexture, vec2 uv) {
    vec4 color = texture(gBufferATexture, uv);
    GBufferA gBufferA;
    gBufferA.baseColor = color.rgb;
    return gBufferA;
}

GBufferB DecodeGBufferB(sampler2D gBufferBTexture, vec2 uv) {
    vec4 color = texture(gBufferBTexture, uv);
    GBufferB gBufferB;
    gBufferB.normal = color.rgb * 2. - 1.;
    return gBufferB;
}

GBufferC DecodeGBufferC(sampler2D gBufferCTexture, vec2 uv) {
    vec4 color = texture(gBufferCTexture, uv);
    GBufferC gBufferC;
    gBufferC.metallic = color.x;
    gBufferC.roughness = color.y;
    return gBufferC;
}
