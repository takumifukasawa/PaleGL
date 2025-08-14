#ifdef USE_NORMAL_MAP
in vec3 vTangent;
in vec3 vBinormal;
uniform sampler2D uNormalMap;
uniform vec4 uNormalMapTiling;
uniform float uNormalStrength;
#endif
