
#define SHADING_MODEL_NUM 4.

struct sGBufferA {
    vec3 smBaseColor; // rgb
    // a
};

struct sGBufferB {
    vec3 smNormal; // rgb
    float smShadingModelId; // a
};

struct sGBufferC {
    float smMetallic; // x
    float smRoughness; // y
};

struct sGBufferD {
    vec3 smEmissiveColor; // rga
    // a
};

struct sGBufferSurface {
    vec3 smWorldNormal;
    vec3 smBaseColor;
    float smMetallic;
    float smRoughness;
    vec3 smEmissiveColor;
    // uShadingModelId);
};

vec4 fEncodeGBufferA(vec3 baseColor) {
    return vec4(fGamma(baseColor), 1.);
}

vec4 fEncodeGBufferB(vec3 normal, int shadingModelId) {
    // shading model の数で clampする
    float id = float(shadingModelId) / SHADING_MODEL_NUM;
    return vec4(normal * .5 + .5, id);
}

vec4 fEncodeGBufferC(float metallic, float roughness) {
    return vec4(metallic, roughness, 0., 1.);
}

vec4 fEncodeGBufferD(vec3 emissiveColor) {
    return vec4(fGamma(emissiveColor.rgb), 1.);
}

sGBufferA fDecodeGBufferA(sampler2D gBufferATexture, vec2 uv) {
    vec4 color = texture(gBufferATexture, uv);
    sGBufferA gBufferA;
    gBufferA.smBaseColor = color.rgb;
    return gBufferA;
}

sGBufferB fDecodeGBufferB(sampler2D gBufferBTexture, vec2 uv) {
    vec4 color = texture(gBufferBTexture, uv);
    sGBufferB gBufferB;
    gBufferB.smNormal = normalize(color.rgb * 2. - 1.);
    gBufferB.smShadingModelId = color.a * SHADING_MODEL_NUM;
    return gBufferB;
}

sGBufferC fDecodeGBufferC(sampler2D gBufferCTexture, vec2 uv) {
    vec4 color = texture(gBufferCTexture, uv);
    sGBufferC gBufferC;
    gBufferC.smMetallic = color.x;
    gBufferC.smRoughness = color.y;
    return gBufferC;
}

sGBufferD fDecodeGBufferD(sampler2D gBufferDTexture, vec2 uv) {
    vec4 color = texture(gBufferDTexture, uv);
    sGBufferD gBufferD;
    gBufferD.smEmissiveColor = color.rgb;
    return gBufferD;
}

sGBufferSurface fBuildGBufferSurface(
    vec3 worldPosition,
    vec3 worldNormal,
    vec3 baseColor,
    float metallic,
    float roughness,
    vec3 emissiveColor
    // int shadingModelId
) {
    sGBufferSurface gBufferSurface;
    // gBufferSurface.smWorldPosition = worldPosition;
    gBufferSurface.smWorldNormal = worldNormal;
    gBufferSurface.smBaseColor = baseColor;
    gBufferSurface.smMetallic = metallic;
    gBufferSurface.smRoughness = roughness;
    gBufferSurface.smEmissiveColor = emissiveColor;
    return gBufferSurface;
}
