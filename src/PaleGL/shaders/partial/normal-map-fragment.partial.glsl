#ifdef D_NORMAL_MAP
worldNormal = fCalcNormal(vNormal, vTangent, vBinormal, uNormalMap, uv * uNormalMapTiling.xy + uNormalMapTiling.zw);
#else
worldNormal = normalize(vNormal);
#endif
