// import {transformVertexUniforms, shadowMapVertexUniforms} from "./commonUniforms";
// import {shadowMapVertex} from "./shadowMapShader";

export const skinningVertexAttributes = (beginIndex) => [
`layout(location = ${beginIndex + 0}) in vec4 aBoneIndices;`,
`layout(location = ${beginIndex + 1}) in vec4 aBoneWeights;`,
];

export const skinningVertex = () => `
    mat4 skinMatrix =
         uJointMatrices[int(aBoneIndices[0])] * aBoneWeights.x +
         uJointMatrices[int(aBoneIndices[1])] * aBoneWeights.y +
         uJointMatrices[int(aBoneIndices[2])] * aBoneWeights.z +
         uJointMatrices[int(aBoneIndices[3])] * aBoneWeights.w;
    
    vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;
    vTangent = mat3(uNormalMatrix) * mat3(skinMatrix) * aTangent;
    vBinormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aBinormal;
    
    vec4 localPosition = skinMatrix * vec4(aPosition, 1.);

    // gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * localPosition;
`;

export const skinningVertexUniforms = (jointNum) => `
uniform mat4[${jointNum}] uJointMatrices;
`;
