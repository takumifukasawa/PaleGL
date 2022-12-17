// import {transformVertexUniforms, shadowMapVertexUniforms} from "./commonUniforms";
// import {shadowMapVertex} from "./shadowMapShader";

// export const skinningVertexAttributes = (beginIndex) => [
// `layout(location = ${beginIndex + 0}) in vec4 aBoneIndices;`,
// `layout(location = ${beginIndex + 1}) in vec4 aBoneWeights;`,
// ];

export const calcSkinningMatrixFunc = () => `
mat4 calcSkinningMatrix(mat4 jointMat0, mat4 jointMat1, mat4 jointMat2, mat4 jointMat3, vec4 boneWeights) {
    mat4 skinMatrix =
         jointMat0 * aBoneWeights.x +
         jointMat1 * aBoneWeights.y +
         jointMat2 * aBoneWeights.z +
         jointMat3 * aBoneWeights.w;
    return skinMatrix;
}

// TODO: animation data をシェーダーに渡して複数アニメーションに対応させたい
struct SkinAnimationClipData {
    int beginIndex; 
    int frameCount;
};

mat4 getJointMatrix(sampler2D jointTexture, int jointIndex, int colNum) {
    int colIndex = int(mod(float(jointIndex), float(colNum))); // 横
    int rowIndex = int(floor(float(jointIndex) / float(colNum))); // 縦
    mat4 jointMatrix = mat4(
        // 1: boneの行列が1個ずつ縦に並んでいる場合
        // texelFetch(jointTexture, ivec2(0, jointIndex), 0),
        // texelFetch(jointTexture, ivec2(1, jointIndex), 0),
        // texelFetch(jointTexture, ivec2(2, jointIndex), 0),
        // texelFetch(jointTexture, ivec2(3, jointIndex), 0)
        // 2: 適宜詰めている場合
        texelFetch(jointTexture, ivec2(colIndex * 4 + 0, rowIndex), 0),
        texelFetch(jointTexture, ivec2(colIndex * 4 + 1, rowIndex), 0),
        texelFetch(jointTexture, ivec2(colIndex * 4 + 2, rowIndex), 0),
        texelFetch(jointTexture, ivec2(colIndex * 4 + 3, rowIndex), 0)
    );
    return jointMatrix;
}

mat4 getJointMatrixGPUSkinning(
    sampler2D jointTexture,
    int jointIndex,
    int jointNum,
    int currentSkinIndex,
    int colNum,
    int totalFrameCount,
    float time,
    float timeOffset
) {
    int offset = int(mod(floor(time + timeOffset), float(totalFrameCount))) * jointNum;
    int colIndex = int(mod(float(jointIndex + offset), float(colNum))); // 横
    int rowIndex = int(floor(float(jointIndex + offset) / float(colNum))); // 縦

    mat4 jointMatrix = mat4(
        texelFetch(jointTexture, ivec2(colIndex * 4 + 0, rowIndex), 0),
        texelFetch(jointTexture, ivec2(colIndex * 4 + 1, rowIndex), 0),
        texelFetch(jointTexture, ivec2(colIndex * 4 + 2, rowIndex), 0),
        texelFetch(jointTexture, ivec2(colIndex * 4 + 3, rowIndex), 0)
    );
    return jointMatrix;
}
`;

export const skinningVertexUniforms = (jointNum) => `
// tmp for cpu skinning
// uniform mat4[${jointNum}] uJointMatrices;
uniform sampler2D uJointTexture;

uniform int uBoneCount;
uniform int uJointTextureColNum;
uniform int uTotalFrameCount;
`;

export const skinningVertex = (gpuSkinning = false) => `
    // tmp: for cpu skinning
    // mat4 skinMatrix = calcSkinningMatrix(
    //     uJointMatrices[int(aBoneIndices[0])],
    //     uJointMatrices[int(aBoneIndices[1])],
    //     uJointMatrices[int(aBoneIndices[2])],
    //     uJointMatrices[int(aBoneIndices[3])],
    //     aBoneWeights
    // );

    ${gpuSkinning ? `
    // gpu skinning
    float fps = 30.;
    mat4 jointMatrix0 = getJointMatrixGPUSkinning(uJointTexture, int(aBoneIndices[0]), uBoneCount, 0, uJointTextureColNum, uTotalFrameCount, uTime * fps, aInstanceAnimationOffset);
    mat4 jointMatrix1 = getJointMatrixGPUSkinning(uJointTexture, int(aBoneIndices[1]), uBoneCount, 0, uJointTextureColNum, uTotalFrameCount, uTime * fps, aInstanceAnimationOffset);
    mat4 jointMatrix2 = getJointMatrixGPUSkinning(uJointTexture, int(aBoneIndices[2]), uBoneCount, 0, uJointTextureColNum, uTotalFrameCount, uTime * fps, aInstanceAnimationOffset);
    mat4 jointMatrix3 = getJointMatrixGPUSkinning(uJointTexture, int(aBoneIndices[3]), uBoneCount, 0, uJointTextureColNum, uTotalFrameCount, uTime * fps, aInstanceAnimationOffset);
    mat4 skinMatrix = calcSkinningMatrix(
        jointMatrix0,
        jointMatrix1,
        jointMatrix2,
        jointMatrix3,
        aBoneWeights
    );
    ` : `
    mat4 jointMatrix0 = getJointMatrix(uJointTexture, int(aBoneIndices[0]), uJointTextureColNum);
    mat4 jointMatrix1 = getJointMatrix(uJointTexture, int(aBoneIndices[1]), uJointTextureColNum);
    mat4 jointMatrix2 = getJointMatrix(uJointTexture, int(aBoneIndices[2]), uJointTextureColNum);
    mat4 jointMatrix3 = getJointMatrix(uJointTexture, int(aBoneIndices[3]), uJointTextureColNum);
    mat4 skinMatrix = calcSkinningMatrix(
        jointMatrix0,
        jointMatrix1,
        jointMatrix2,
        jointMatrix3,
        aBoneWeights
    );
    `}
`;
