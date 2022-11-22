
export const shadowMapVertexVaryings = () => `
out vec4 vShadowMapProjectionUv;
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