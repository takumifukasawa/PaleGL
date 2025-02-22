
#ifdef USE_NORMAL_MAP
out vec3 vTangent;
out vec3 vBinormal;
#endif

// TODO: インスタンスごとの法線行列もあらかじめ計算しておけるとなおよい

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

// // CUSTOM_CHEAP
// #ifdef USE_INSTANCING
//     normalMatrix = mat3(transpose(inverse(worldMatrix)));
// #else
//     normalMatrix = mat3(uNormalMatrix);
// #endif
// vNormal = normalMatrix * aNormal;
