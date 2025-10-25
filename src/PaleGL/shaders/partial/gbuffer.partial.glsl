
#define SHADING_MODEL_NUM 3.

struct sGBufferA {
    vec3 baseColor; // rgb
    // a
};

struct sGBufferB {
    vec3 normal; // rgb
    float shadingModelId; // a
};

struct sGBufferC {
    float metallic; // x
    float roughness; // y
};

struct sGBufferD {
    vec3 emissiveColor; // rga
    // a
};

vec4 EncodeGBufferA(vec3 baseColor) {
    return vec4(baseColor, 1.);
}

vec4 EncodeGBufferB(vec3 normal, int shadingModelId) {
    // shading model の数で clampする
    float id = float(shadingModelId) / SHADING_MODEL_NUM;
    return vec4(normal * .5 + .5, id);
}

vec4 EncodeGBufferC(float metallic, float roughness) {
    return vec4(metallic, roughness, 0., 1.);
}

vec4 EncodeGBufferD(vec3 emissiveColor) {
    return vec4(emissiveColor, 1.);
}

sGBufferA DecodeGBufferA(sampler2D gBufferATexture, vec2 uv) {
    vec4 color = texture(gBufferATexture, uv);
    sGBufferA gBufferA;
    gBufferA.baseColor = color.rgb;
    return gBufferA;
}

sGBufferB DecodeGBufferB(sampler2D gBufferBTexture, vec2 uv) {
    vec4 color = texture(gBufferBTexture, uv);
    sGBufferB gBufferB;
    gBufferB.normal = normalize(color.rgb * 2. - 1.);
    gBufferB.shadingModelId = color.a * SHADING_MODEL_NUM;
    return gBufferB;
}

sGBufferC DecodeGBufferC(sampler2D gBufferCTexture, vec2 uv) {
    vec4 color = texture(gBufferCTexture, uv);
    sGBufferC gBufferC;
    gBufferC.metallic = color.x;
    gBufferC.roughness = color.y;
    return gBufferC;
}

sGBufferD DecodeGBufferD(sampler2D gBufferDTexture, vec2 uv) {
    vec4 color = texture(gBufferDTexture, uv);
    sGBufferD gBufferD;
    gBufferD.emissiveColor = color.rgb;
    return gBufferD;
}
