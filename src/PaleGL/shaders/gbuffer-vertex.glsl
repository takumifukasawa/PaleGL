#pragma DEFINES

#pragma ATTRIBUTES

#pragma APPEND_ATTRIBUTES

#include <common>
#include <lighting>
#include <ub>
#include <vcolor_vh>

// varyings
out vec2 vUv;
out vec3 vLocalPosition;
out vec3 vWorldPosition;
out vec3 vNormal;
out mat4 vWorldMatrix;
out mat4 vInverseWorldMatrix;

#ifdef USE_INSTANCING
out float vInstanceId;
// TODO
// out vec4 vInstanceState;
uniform float uRotMode; // 0: velocity, 1: look direction
uniform vec4 uBaseColor;
uniform float uBaseMixer;
uniform vec4 uEmissiveColor;
uniform float uEmissiveMixer;
#endif

#ifdef USE_VAT
uniform sampler2D uVelocityMap;
uniform sampler2D uPositionMap;
uniform sampler2D uUpMap;
uniform vec2 uVATResolution;
#endif

#ifdef USE_NORMAL_MAP
out vec3 vTangent;
out vec3 vBinormal;
#endif

#ifdef USE_HEIGHT_MAP
uniform sampler2D uHeightMap;
uniform vec4 uHeightMapTiling;
uniform float uHeightScale;
#endif

#pragma APPEND_UNIFORMS

mat4 getRotationXMat(float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat4(
        // 行オーダー
        // 1., 0., 0., 0.,
        // 0., c, -s, 0.,
        // 0., s, c, 0.,
        // 0., 0., 0., 1.
        // 列オーダー
        1., 0., 0., 0.,
        0., c, s, 0.,
        0., -s, c, 0.,
        0., 0., 0., 1.
    );
}

mat4 getRotationYMat(float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat4(
        // 行オーダー
        // c, 0., s, 0.,
        // 0., 1., 0., 0.,
        // -s, 0., c, 0.,
        // 0., 0., 0., 1.
        // 列オーダー
        c, 0., -s, 0.,
        0., 1., 0., 0.,
        s, 0., c, 0.,
        0., 0., 0., 1.
    );
}

mat4 getRotationZMat(float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat4(
        // 行オーダー
        // c, -s, 0., 0.,
        // s, c, 0., 0.,
        // 0., 0., 1., 0.,
        // 0., 0., 0., 1.
        // 列オーダー
        c, s, 0., 0.,
        -s, c, 0., 0.,
        0., 0., 1., 0.,
        0., 0., 0., 1.
    );
}

mat4 getTranslationMat(vec3 p) {
    return mat4(
        // 行オーダー
        // 1., 0., 0., p.x,
        // 0., 1., 0., p.y,
        // 0., 0., 1., p.z,
        // 0., 0., 0., 1
        // 列オーダー
        1., 0., 0., 0.,
        0., 1., 0., 0.,
        0., 0., 1., 0.,
        p.x, p.y, p.z, 1.
    );
}

mat4 getScalingMat(vec3 s) {
    return mat4(
        // 行オーダー / 列オーダー
        s.x, 0., 0., 0.,
        0., s.y, 0., 0.,
        0., 0., s.z, 0.,
        0., 0., 0., 1.
    );
}

mat4 getLookMat(vec3 front, vec3 up) {
    // vec3 z = -normalize(front);
    vec3 z = normalize(front); // こっちでいいはず？
    vec3 y = up;
    vec3 x = cross(y, z);
    return mat4(
        x.x, x.y, x.z, 0.,
        y.x, y.y, y.z, 0.,
        z.x, z.y, z.z, 0.,
        0., 0., 0., 1.
    );
}

mat4 getLookAtPMat(vec3 lookAt, vec3 p) {
    vec3 f = mix(
        vec3(0., 1., 0.),// fallback
        normalize(lookAt - p),
        step(.01, length(lookAt - p))
    );
    vec3 r = normalize(cross(vec3(0., 1., 0.), f));
    vec3 u = cross(f, r);
    return mat4(
        r.x, r.y, r.z, 0.,
        u.x, u.y, u.z, 0.,
        f.x, f.y, f.z, 0.,
        0., 0., 0., 1.
    );
}

mat4 getIdentityMat() {
    return mat4(
        1., 0., 0., 0.,
        0., 1., 0., 0.,
        0., 0., 1., 0.,
        0., 0., 0., 1.
    );
}

// --- start skinning

// #ifdef USE_SKINNING
#if defined(USE_SKINNING_GPU) || defined(USE_SKINNING_CPU)
// tmp for cpu skinning
// uniform mat4[${jointNum}] uJointMatrices;
// uniform sampler2D ${UniformNames.JointTexture};
uniform sampler2D uJointTexture;
uniform int uBoneCount;
uniform int uJointTextureColNum;
uniform int uTotalFrameCount;

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
    //
    // TODO: play / pause
    // TODO: playback speed
    // TODO: アニメーションのフレーム指定
    //

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

// --- end skinning

void main() {

    #pragma BEGIN_MAIN

    vec4 localPosition = vec4(aPosition, 1.);

    // --- start calc skinning
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
    // --- end calc skinning

    #pragma LOCAL_POSITION_POST_PROCESS

    // assign common varyings 
    vUv = aUv;
    vLocalPosition = aPosition;

    mat4 worldMatrix = uWorldMatrix;

#ifdef USE_INSTANCING
    float fid = float(gl_InstanceID);
    vInstanceId = fid;
    
    mat4 instanceTranslation = getIdentityMat();
    // mat4 instanceRotation = getIdentityMat();

    mat4 instanceScaling = getScalingMat(aInstanceScale.xyz);
    mat4 instanceRotationX = getRotationXMat(aInstanceRotation.x);
    mat4 instanceRotationY = getRotationYMat(aInstanceRotation.y);
    mat4 instanceRotationZ = getRotationZMat(aInstanceRotation.z);
    mat4 instanceRotation =
        instanceRotationY *
        instanceRotationX *
        instanceRotationZ;

    // --- vat

    #ifdef USE_VAT
        #pragma INSTANCE_TRANSFORM_PRE_PROCESS
        #ifdef USE_TRAIL
            ivec2 vatUv = ivec2(
                int(mod(fid, uVATResolution.x)),
                aTrailIndex
            );
            vec3 vatVelocity = texelFetch(uVelocityMap, vatUv, 0).xyz;
            vec3 vatPosition = texelFetch(uPositionMap, vatUv, 0).xyz;
            vec3 vatUp = texelFetch(uUpMap, vatUv, 0).xyz;
            instanceTranslation = getTranslationMat(vatPosition);
            instanceRotation = getLookMat(normalize(vatVelocity), normalize(vatUp)); // TODO: これがあると表示されない
        #else
            ivec2 vatUv = ivec2(
                int(mod(fid, uVATResolution.x)),
                int(floor(fid / uVATResolution.y))
            );
            vec3 vatPosition = texelFetch(uPositionMap, vatUv, 0).xyz;
            instanceTranslation = getTranslationMat(vatPosition);
        #endif
    #else
        instanceTranslation = getTranslationMat(aInstancePosition);
    #endif

    // --- instance look direction
    // TODO: vat velocity方式に統一したい

    // instanceごとのvelocityが必要なことに注意
    // TODO: 追従率をuniformで渡したい
    #ifdef USE_INSTANCE_LOOK_DIRECTION
        // pattern_1: 速度ベクトルを使って回転
        instanceRotation = getLookAtPMat(aInstancePosition + aInstanceVelocity * 1000., aInstancePosition);
        // pattern_2: 速度ベクトルをnormalizeして使って回転
        // instanceRotation = getLookAtPMat(aInstancePosition + normalize(aInstanceVelocity.xyz) * 1000., aInstancePosition);
        // pattern_3: look direction
        // instanceRotation = getLookAtPMat(aInstancePosition + aLookDirection, aInstancePosition);
        // pattern_4: blend
        // vec3 lookDir = mix(normalize(aInstanceVelocity.xyz), normalize(aLookDirection), uRotMode);
        // instanceRotation = getLookAtPMat(aInstancePosition + normalize(lookDir) * 1000., aInstancePosition);
        // // for debug: 回転させない
        // instanceRotation = mat4(
        //     1., 0., 0., 0.,
        //     0., 1., 0., 0.,
        //     0., 0., 1., 0.,
        //     0., 0., 0., 1.
        //     
        // );
    #endif
    
    #pragma INSTANCE_TRANSFORM_PRE_PROCESS

    worldMatrix = uWorldMatrix * instanceTranslation * instanceRotation * instanceScaling;

    // TODO:
    // vInstanceState = aInstanceState;
    #ifdef USE_VERTEX_COLOR
        vVertexEmissiveColor = mix(aInstanceEmissiveColor, uEmissiveColor, uEmissiveMixer);
    #endif
#endif

    // --- normal matrix

    mat3 normalMatrix;
    #ifdef USE_NORMAL_MAP
        #if defined(USE_SKINNING_GPU) || defined(USE_SKINNING_CPU)
            #ifdef USE_INSTANCING
                normalMatrix = mat3(transpose(inverse(worldMatrix))) * mat3(skinMatrix);
            #else
                normalMatrix = mat3(uNormalMatrix) * mat3(skinMatrix);
            #endif
        #else
            #ifdef USE_INSTANCING
                normalMatrix = mat3(transpose(inverse(worldMatrix)));
            #else
                normalMatrix = mat3(uNormalMatrix);
            #endif
        #endif
        vNormal = normalMatrix * aNormal;
        vTangent = normalMatrix * aTangent;
        vBinormal = normalMatrix * aBinormal;
    #else
        #if defined(USE_SKINNING_GPU) || defined(USE_SKINNING_CPU)
            #ifdef USE_INSTANCING
                normalMatrix = mat3(transpose(inverse(worldMatrix))) * mat3(skinMatrix);
            #else
                normalMatrix = mat3(uNormalMatrix);
            #endif
        #else
            #ifdef USE_INSTANCING
                normalMatrix = mat3(transpose(inverse(worldMatrix)));
            #else
                normalMatrix = mat3(uNormalMatrix);
            #endif
        #endif
        vNormal = normalMatrix * aNormal;
    #endif
    
    // --- height map

    vec4 worldPosition;
#ifdef USE_HEIGHT_MAP
    // height map
    vec2 heightMapUv = aUv * uHeightMapTiling.xy + uHeightMapTiling.zw;
    float height = texture(uHeightMap, heightMapUv).r * uHeightScale;
    // worldPosition = worldMatrix * (localPosition + vec4(vNormal.xyz * height, 0.));
    worldPosition = worldMatrix * (localPosition + vec4(aNormal.xyz * height, 0.));
#else
    worldPosition = worldMatrix * localPosition;
#endif

    #pragma WORLD_POSITION_POST_PROCESS

    // --- vertex color

#if defined(USE_INSTANCING) && defined(USE_VERTEX_COLOR)
    // vVertexColor = aInstanceVertexColor;
    vVertexColor = mix(aInstanceVertexColor, uBaseColor, uBaseMixer);
    #if defined(USE_INSTANCING)
        vVertexEmissiveColor = mix(aInstanceEmissiveColor, uEmissiveColor, uEmissiveMixer);
    #else
        vVertexEmissiveColor = mix(aVertexEmissiveColor, uEmissiveColor, uEmissiveMixer);
    #endif
#endif

    // --- end

    vWorldMatrix = worldMatrix;
    vWorldPosition = worldPosition.xyz;
    vInverseWorldMatrix = inverse(worldMatrix);

    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
 
    #pragma END_MAIN
}
