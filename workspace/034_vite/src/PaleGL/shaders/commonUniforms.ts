
export const transformVertexUniforms: () => string = () => `
uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;
`;

export const engineCommonUniforms: () => string = () => `
uniform float uTime;
`;
