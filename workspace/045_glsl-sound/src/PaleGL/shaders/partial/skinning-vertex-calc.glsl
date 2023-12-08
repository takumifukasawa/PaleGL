
#if defined(USE_SKINNING_GPU) || defined(USE_SKINNING_CPU)
    mat4 skinMatrix = mat4(
        1., 0., 0., 0.,
        0., 1., 0., 0.,
        0., 0., 1., 0.,
        0., 0., 0., 1.
    );
  
#ifdef USE_SKINNING_GPU
    float fps = 30.;
    mat4 jointMatrix0 = getJointMatrixGPUSkinning(uJointTexture, aBoneIndices[0], uBoneCount, 0, uJointTextureColNum, uTotalFrameCount, uTime * fps, aInstanceAnimationOffset);
    mat4 jointMatrix1 = getJointMatrixGPUSkinning(uJointTexture, aBoneIndices[1], uBoneCount, 0, uJointTextureColNum, uTotalFrameCount, uTime * fps, aInstanceAnimationOffset);
    mat4 jointMatrix2 = getJointMatrixGPUSkinning(uJointTexture, aBoneIndices[2], uBoneCount, 0, uJointTextureColNum, uTotalFrameCount, uTime * fps, aInstanceAnimationOffset);
    mat4 jointMatrix3 = getJointMatrixGPUSkinning(uJointTexture, aBoneIndices[3], uBoneCount, 0, uJointTextureColNum, uTotalFrameCount, uTime * fps, aInstanceAnimationOffset);
    skinMatrix = calcSkinningMatrix(
        jointMatrix0,
        jointMatrix1,
        jointMatrix2,
        jointMatrix3,
        aBoneWeights
    );
#endif
#ifdef USE_SKINNING_CPU
    mat4 jointMatrix0 = getJointMatrix(uJointTexture, aBoneIndices[0], uJointTextureColNum);
    mat4 jointMatrix1 = getJointMatrix(uJointTexture, aBoneIndices[1], uJointTextureColNum);
    mat4 jointMatrix2 = getJointMatrix(uJointTexture, aBoneIndices[2], uJointTextureColNum);
    mat4 jointMatrix3 = getJointMatrix(uJointTexture, aBoneIndices[3], uJointTextureColNum);
    skinMatrix = calcSkinningMatrix(
        jointMatrix0,
        jointMatrix1,
        jointMatrix2,
        jointMatrix3,
        aBoneWeights
    );
#endif

    localPosition = skinMatrix * localPosition;
#endif 
