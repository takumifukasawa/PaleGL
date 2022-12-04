
export const shadowMapVertexVaryings = () => `
out vec4 vShadowMapProjectionUv;
`;

export const shadowMapFragmentVaryings = () => `
in vec4 vShadowMapProjectionUv;
`;

export const shadowMapVertex = () => `
    vShadowMapProjectionUv = uShadowMapProjectionMatrix * uWorldMatrix * localPosition;
`;

export const shadowMapVertexUniforms = () => `
uniform mat4 uShadowMapProjectionMatrix;
`;

export const shadowMapFragmentUniforms = () => `
uniform sampler2D uShadowMap;
uniform float uShadowBias;
`;

export const shadowMapFragmentFunc = () => `
vec4 applyShadow(vec4 surfaceColor, sampler2D shadowMap, vec4 shadowMapUv, float shadowBias, vec4 shadowColor, float shadowBlendRate) {
    vec3 projectionUv = shadowMapUv.xyz / shadowMapUv.w;
    vec4 projectionShadowColor = texture(shadowMap, projectionUv.xy);
    float sceneDepth = projectionShadowColor.r;
    float depthFromLight = projectionUv.z;
    float shadowOccluded = clamp(step(0., depthFromLight - sceneDepth - shadowBias), 0., 1.);
    float shadowAreaRect =
        step(0., projectionUv.x) * (1. - step(1., projectionUv.x)) *
        step(0., projectionUv.y) * (1. - step(1., projectionUv.y)) *
        step(0., projectionUv.z) * (1. - step(1., projectionUv.z));
    float shadowRate = shadowOccluded * shadowAreaRect;
    
    vec4 resultColor = vec4(1.);
    resultColor.xyz = mix(
       surfaceColor.xyz,
       mix(surfaceColor.xyz, shadowColor.xyz, shadowBlendRate),
       shadowRate
    );
    resultColor.a = surfaceColor.a;
    
    return resultColor;
} 
`;