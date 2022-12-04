// import {transformVertexUniforms, shadowMapVertexUniforms} from "./commonUniforms";
// import {shadowMapVertex} from "./shadowMapShader";

export const skinningVertexAttributes = (beginIndex) => [
`layout(location = ${beginIndex + 0}) in vec4 aBoneIndices;`,
`layout(location = ${beginIndex + 1}) in vec4 aBoneWeights;`,
];

export const calcSkinningMatrixFunc = () => `
mat4 calcSkinningMatrix(mat4 jointMat0, mat4 jointMat1, mat4 jointMat2, mat4 jointMat3, vec4 boneWeights) {
    mat4 skinMatrix =
         jointMat0 * aBoneWeights.x +
         jointMat1 * aBoneWeights.y +
         jointMat2 * aBoneWeights.z +
         jointMat3 * aBoneWeights.w;
    return skinMatrix;
}

mat4 getJointMatrix(sampler2D jointTexture, int jointIndex) {
    mat4 jointMatrix = mat4(
        texelFetch(jointTexture, ivec2(0, jointIndex), 0),
        texelFetch(jointTexture, ivec2(1, jointIndex), 0),
        texelFetch(jointTexture, ivec2(2, jointIndex), 0),
        texelFetch(jointTexture, ivec2(3, jointIndex), 0)
    );
    return jointMatrix;
}
`;

// export const skinningVertex = () => `
//     mat4 skinMatrix =
//          uJointMatrices[int(aBoneIndices[0])] * aBoneWeights.x +
//          uJointMatrices[int(aBoneIndices[1])] * aBoneWeights.y +
//          uJointMatrices[int(aBoneIndices[2])] * aBoneWeights.z +
//          uJointMatrices[int(aBoneIndices[3])] * aBoneWeights.w;
//     
//     vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;
//     vTangent = mat3(uNormalMatrix) * mat3(skinMatrix) * aTangent;
//     vBinormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aBinormal;
//     
//     vec4 localPosition = skinMatrix * vec4(aPosition, 1.);
// 
//     // gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * localPosition;
// `;

export const skinningVertexUniforms = (jointNum) => `
uniform mat4[${jointNum}] uJointMatrices;
uniform sampler2D uJointTexture;
`;
