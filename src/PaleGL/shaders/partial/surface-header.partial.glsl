uniform vec4 uBaseColor;
uniform sampler2D uBaseMap;
uniform vec4 uMapTiling;
uniform float uSpecularAmount;
uniform float uAmbientAmount;
uniform float uMetallic;
uniform sampler2D uMetallicMap;
uniform float uRoughness;
uniform sampler2D uRoughnessMap;
uniform vec4 uEmissiveColor;
uniform sampler2D uNormalMap;

#ifdef D_HEIGHT_MAP
uniform sampler2D uHeightMap;
#endif

#ifdef D_NORMAL_MAP
in vec3 vTangent;
in vec3 vBinormal;
uniform float uNormalStrength;

vec3 fCalcNormal(vec3 normal, vec3 tangent, vec3 binormal, sampler2D normalMap, vec2 uv) {
    vec3 n = normalize(normal);
    vec3 t = normalize(tangent);
    vec3 b = normalize(binormal);
    mat3 tbn = mat3(t, b, n);
    vec3 nt = texture(normalMap, uv).xyz;
    nt = nt * 2. - 1.;

    // 2: normal from normal map
    vec3 resultNormal = normalize(tbn * nt);
    // blend mesh normal ~ normal map
    // vec3 normal = mix(normal, normalize(tbn * nt));
    // vec3 normal = mix(normal, normalize(tbn * nt), 1.);

    return resultNormal;
}
#endif
