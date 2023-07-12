#version 300 es

#pragma BLOCK_DEFINE

#pragma BLOCK_ATTRIBUTES

// varyings
out vec2 vUv;
out vec3 vWorldPosition;
out vec3 vNormal;

#ifdef USE_NORMAL_MAP
out vec3 vTangent;
out vec3 vBinormal;               
#endif

#ifdef USE_RECEIVE_SHADOW
out vec4 vShadowMapProjectionUv;
#endif

#ifdef USE_VERTEX_COLOR
out vec4 vVertexColor;
#endif

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

uniform float uTime;

#ifdef USE_RECEIVE_SHADOW
uniform mat4 uShadowMapProjectionMatrix;
#endif

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
struct SkinAnimationClipData {
    int beginIndex; 
    int frameCount;
};

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

// #ifdef USE_SKINNING
#if defined(USE_SKINNING_GPU) || defined(USE_SKINNING_CPU)
// tmp for cpu skinning
// uniform mat4[${jointNum}] uJointMatrices;
// uniform sampler2D ${UniformNames.JointTexture};
uniform sampler2D uJointTexture;

uniform int uBoneCount;
uniform int uJointTextureColNum;
uniform int uTotalFrameCount;
#endif

// TODO: needs??
// ${insertUniforms || ''}

void main() {

#pragma BLOCK_VERTEX_SHADER_BEGIN_MAIN

#ifdef USE_SKINNING_GPU
    // tmp: for cpu skinning
    // mat4 skinMatrix = calcSkinningMatrix(
    //     uJointMatrices[int(aBoneIndices[0])],
    //     uJointMatrices[int(aBoneIndices[1])],
    //     uJointMatrices[int(aBoneIndices[2])],
    //     uJointMatrices[int(aBoneIndices[3])],
    //     aBoneWeights
    // );
    // gpu skinning
    float fps = 30.;
    mat4 jointMatrix0 = getJointMatrixGPUSkinning(uJointTexture, aBoneIndices[0], uBoneCount, 0, uJointTextureColNum, uTotalFrameCount, uTime * fps, aInstanceAnimationOffset);
    mat4 jointMatrix1 = getJointMatrixGPUSkinning(uJointTexture, aBoneIndices[1], uBoneCount, 0, uJointTextureColNum, uTotalFrameCount, uTime * fps, aInstanceAnimationOffset);
    mat4 jointMatrix2 = getJointMatrixGPUSkinning(uJointTexture, aBoneIndices[2], uBoneCount, 0, uJointTextureColNum, uTotalFrameCount, uTime * fps, aInstanceAnimationOffset);
    mat4 jointMatrix3 = getJointMatrixGPUSkinning(uJointTexture, aBoneIndices[3], uBoneCount, 0, uJointTextureColNum, uTotalFrameCount, uTime * fps, aInstanceAnimationOffset);
    mat4 skinMatrix = calcSkinningMatrix(
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
    mat4 skinMatrix = calcSkinningMatrix(
        jointMatrix0,
        jointMatrix1,
        jointMatrix2,
        jointMatrix3,
        aBoneWeights
    );
#endif
 
    vec4 localPosition = vec4(aPosition, 1.);
    
#if defined(USE_SKINNING_GPU) || defined(USE_SKINNING_CPU)
    localPosition = skinMatrix * localPosition;
#endif
   
#pragma BLOCK_VERTEX_SHADER_LOCAL_POSITION_POST_PROCESS

#ifdef USE_NORMAL_MAP
    #if defined(USE_SKINNING_GPU) || defined(USE_SKINNING_CPU)
    vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;
    vTangent = mat3(uNormalMatrix) * mat3(skinMatrix) * aTangent;
    vBinormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aBinormal;
    #else
    vNormal = mat3(uNormalMatrix) * aNormal;
    vTangent = mat3(uNormalMatrix) * aTangent;
    vBinormal = mat3(uNormalMatrix) * aBinormal;
    #endif
#else
    #if defined(USE_SKINNING_GPU) || defined(USE_SKINNING_CPU)
    vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;
    #else
    vNormal = mat3(uNormalMatrix) * aNormal;
    #endif
#endif

    // assign common varyings 
    vUv = aUv;

    vec4 worldPosition = uWorldMatrix * localPosition;

#pragma BLOCK_VERTEX_SHADER_WORLD_POSITION_POST_PROCESS
 
    vWorldPosition = worldPosition.xyz;

#ifdef USE_RECEIVE_SHADOW
    vShadowMapProjectionUv = uShadowMapProjectionMatrix * worldPosition;
#endif

    vec4 viewPosition = uViewMatrix * worldPosition;

#pragma BLOCK_VERTEX_SHADER_VIEW_POSITION_POST_PROCESS

#pragma BLOCK_VERTEX_SHADER_OUT_CLIP_POSITION_PRE_PROCESS
 
    gl_Position = uProjectionMatrix * viewPosition;

#pragma BLOCK_VERTEX_SHADER_LAST_MAIN
}