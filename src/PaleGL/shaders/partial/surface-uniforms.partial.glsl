uniform vec4 uBaseColor;
uniform sampler2D uBaseMap;
uniform vec4 uMapTiling;
uniform float uSpecularAmount;
uniform float uAmbientAmount;
uniform float uMetallic;
uniform sampler2D uMetallicMap;
uniform float uRoughness;
uniform sampler2D uRoughnessMap;
uniform vec4 uEmissiveColor;

#ifdef D_HEIGHT_MAP
uniform sampler2D uHeightMap;
#endif
