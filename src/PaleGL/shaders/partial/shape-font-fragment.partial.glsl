vec2 uv = vUv;
uv = uv * uFontTiling.xy + uFontTiling.zw;
resultColor *= texture(uFontMap, uv);
resultColor.a *= shapeFontAlpha(resultColor.r);
