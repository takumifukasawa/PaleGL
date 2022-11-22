
export const normalMapVertexAttributes = (beginIndex) => [
`layout(location = ${beginIndex + 0}) in vec3 aTangent;`,
`layout(location = ${beginIndex + 1}) in vec3 aBinormal;`
];

export const normalMapVertexVaryings = () => `
out vec3 vTangent;
out vec3 vBinormal;
`;

export const directionalLightFunc = () => `
vec3 calcDirectionalLight(vec3 worldPosition, vec3 worldNormal, ) {
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