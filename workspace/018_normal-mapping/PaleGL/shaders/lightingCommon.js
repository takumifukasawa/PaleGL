
export const normalMapVertexAttributes = (beginIndex) => [
`layout(location = ${beginIndex + 0}) in vec3 aTangent;`,
`layout(location = ${beginIndex + 1}) in vec3 aBinormal;`
];

export const normalMapVertexVaryings = () => `
out vec3 vTangent;
out vec3 vBinormal;
`;