
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
