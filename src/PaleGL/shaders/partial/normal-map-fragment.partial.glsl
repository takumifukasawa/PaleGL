#ifdef D_NORMAL_MAP
worldNormal = fCalcNormal(vNormal, vTangent, vBinormal, uNormalMap, uv);
#else
worldNormal = normalize(vNormal);
#endif
