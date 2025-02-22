#ifdef USE_NORMAL_MAP
worldNormal = calcNormal(vNormal, vTangent, vBinormal, uNormalMap, uv);
#else
worldNormal = normalize(vNormal);
#endif
