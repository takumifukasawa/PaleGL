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
