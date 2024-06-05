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

