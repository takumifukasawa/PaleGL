
export const alphaTestFragmentFunc = () => `
void checkAlphaTest(float value, float threshold) {
    if(value < threshold) {
        discard;
    }
}
`;

export const alphaTestFragmentUniforms = () => `
uniform float uAlphaTestThreshold;
`;

export const normalMapVertexVaryings = () => `
out vec3 vTangent;
out vec3 vBinormal;
`;

export const normalMapFragmentVarying = () => `
in vec3 vTangent;
in vec3 vBinormal;
`;

export const normalMapFragmentUniforms = () => `
uniform sampler2D uNormalMap;
uniform float uNormalStrength;
`;

export const normalMapFragmentFunc = () => `
vec3 calcNormal(vec3 normal, vec3 tangent, vec3 binormal, sampler2D normalMap, vec2 uv) {
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
`

export const directionalLightFragmentUniforms = () => `
struct DirectionalLight {
    vec3 direction;
    float intensity;
    vec4 color;
};
uniform DirectionalLight uDirectionalLight;
`;

export const phongSurfaceDirectionalLightFunc = () => `
vec4 calcDirectionalLight(Surface surface, DirectionalLight directionalLight, Camera camera) {
    vec3 N = normalize(surface.worldNormal);
    vec3 L = normalize(directionalLight.direction);
    
    // lambert
    float diffuseRate = clamp(dot(N, L), 0., 1.);
    // half lambert
    // float diffuseRate = clamp(dot(N, L), 0., 1.) * .5 + .5;
    // original lambert
    // float diffuseRate = clamp(dot(N, L), 0., 1.) * .9 + .1;
    
    vec3 diffuseColor = surface.diffuseColor.xyz * diffuseRate * uDirectionalLight.intensity * uDirectionalLight.color.xyz;

    vec3 P = surface.worldPosition;
    vec3 E = camera.worldPosition;
    vec3 PtoL = L; // for directional light
    vec3 PtoE = normalize(E - P);
    vec3 H = normalize(PtoL + PtoE);
    // TODO: surfaceに持たせる
    float specularPower = 32.;
    float specularRate = clamp(dot(H, N), 0., 1.);
    specularRate = pow(specularRate, specularPower) * surface.specularAmount;
    vec3 specularColor = specularRate * directionalLight.intensity * directionalLight.color.xyz;

    // TODO: 外から渡せるようにする
    // vec3 ambientColor = vec3(.12, .11, .1);
    vec3 ambientColor = vec3(.1);

    vec4 resultColor = vec4(
        diffuseColor + specularColor + ambientColor,
        surface.diffuseColor.a
    );
    
    return resultColor;
}
`;

export const phongLightingFunc = () => `
vec4 calcPhongLighting() {
    // vec3 N = normalize(vNormal);
    vec3 N = normalize(worldNormal);
    // vec3 N = mix(vNormal, worldNormal * uNormalStrength, uNormalStrength);
    vec3 L = normalize(uDirectionalLight.direction);
    float diffuseRate = clamp(dot(N, L), 0., 1.);
    // vec3 diffuseColor = textureColor.xyz * diffuseRate * uDirectionalLight.intensity * uDirectionalLight.color.xyz;
    vec3 diffuseColor = diffuseMapColor.xyz * diffuseRate * uDirectionalLight.intensity * uDirectionalLight.color.xyz;

    vec3 P = vWorldPosition;
    vec3 E = uViewPosition;
    vec3 PtoL = L; // for directional light
    vec3 PtoE = normalize(E - P);
    vec3 H = normalize(PtoL + PtoE);
    float specularPower = 16.;
    float specularRate = clamp(dot(H, N), 0., 1.);
    specularRate = pow(specularRate, specularPower);
    vec3 specularColor = specularRate * uDirectionalLight.intensity * uDirectionalLight.color.xyz;

    vec3 ambientColor = vec3(.1);

    vec4 surfaceColor = vec4(diffuseColor + specularColor + ambientColor, 1.);
    
    return surfaceColor;
}
`;