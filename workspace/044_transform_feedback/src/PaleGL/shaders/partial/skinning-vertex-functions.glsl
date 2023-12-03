#if defined(USE_SKINNING_GPU) || defined(USE_SKINNING_CPU)

mat4 calcSkinningMatrix(mat4 jointMat0, mat4 jointMat1, mat4 jointMat2, mat4 jointMat3, vec4 boneWeights) {
    mat4 skinMatrix =
         jointMat0 * aBoneWeights.x +
         jointMat1 * aBoneWeights.y +
         jointMat2 * aBoneWeights.z +
         jointMat3 * aBoneWeights.w;
    return skinMatrix;
}

// TODO: animation data をシェーダーに渡して複数アニメーションに対応させたい
// struct SkinAnimationClipData {
//     int beginIndex; 
//     int frameCount;
// };

mat4 getJointMatrix(sampler2D jointTexture, uint jointIndex, int colNum) {
    // horizontal
    int colIndex = int(mod(float(jointIndex), float(colNum)));
    // vertical
    int rowIndex = int(floor(float(jointIndex) / float(colNum)));
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
    uint jointIndex,
    int jointNum,
    int currentSkinIndex,
    int colNum,
    int totalFrameCount,
    float time,
    float timeOffset
) {
    // TODO: 停止機能

    float offset = float(int(mod(floor(time + timeOffset), float(totalFrameCount))) * jointNum);
    // horizontal
    int colIndex = int(mod(float(jointIndex) + offset, float(colNum)));
    // vertical
    int rowIndex = int(floor(float(jointIndex) + offset / float(colNum)));

    mat4 jointMatrix = mat4(
        texelFetch(jointTexture, ivec2(colIndex * 4 + 0, rowIndex), 0),
        texelFetch(jointTexture, ivec2(colIndex * 4 + 1, rowIndex), 0),
        texelFetch(jointTexture, ivec2(colIndex * 4 + 2, rowIndex), 0),
        texelFetch(jointTexture, ivec2(colIndex * 4 + 3, rowIndex), 0)
    );
    return jointMatrix;
}

#endif
