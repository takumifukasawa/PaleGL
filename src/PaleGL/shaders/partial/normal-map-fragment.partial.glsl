#ifdef USE_NORMAL_MAP
worldNormal = calcNormal(vNormal, vTangent, vBinormal, uNormalMap, uv * uNormalMapTiling.xy + uNormalMapTiling.zw);
#else
worldNormal = normalize(vNormal);
#endif
