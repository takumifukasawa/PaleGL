// TODO: インスタンスごとの法線行列もあらかじめ計算しておけるとなおよい

#ifdef USE_NORMAL_MAP
    #if defined(USE_SKINNING_GPU) || defined(USE_SKINNING_CPU)
        #ifdef USE_INSTANCING
            vNormal = mat3(transpose(inverse(worldMatrix))) * mat3(skinMatrix) * aNormal;
        #else
            vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;
        #endif
        vTangent = mat3(uNormalMatrix) * mat3(skinMatrix) * aTangent;
        vBinormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aBinormal;
    #else
        #ifdef USE_INSTANCING
            vNormal = mat3(transpose(inverse(worldMatrix))) * aNormal;
        #else
            vNormal = mat3(uNormalMatrix) * aNormal;
        #endif
        vTangent = mat3(uNormalMatrix) * aTangent;
        vBinormal = mat3(uNormalMatrix) * aBinormal;
    #endif
#else
    #if defined(USE_SKINNING_GPU) || defined(USE_SKINNING_CPU)
        #ifdef USE_INSTANCING
            vNormal = mat3(transpose(inverse(worldMatrix))) * mat3(skinMatrix) * aNormal;
        #else
            vNormal = mat3(uNormalMatrix) * mat3(skinMatrix) * aNormal;
        #endif
    #else
        #ifdef USE_INSTANCING
            vNormal = mat3(transpose(inverse(worldMatrix))) * aNormal;
        #else
            vNormal = mat3(uNormalMatrix) * aNormal;
        #endif
    #endif
#endif
