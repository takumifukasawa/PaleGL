
// #ifdef USE_ENV_MAP

vec3 calcEnvMapSampleDir(vec3 reflectDir, float rotationOffset) {
    reflectDir.x *= -1.;
    float c = cos(3.14 + rotationOffset);
    float s = sin(3.14 + rotationOffset);
    reflectDir.xz *= mat2(c, s, -s, c);
    return reflectDir;
}

// vec3 calcEnvMap(samplerCube envMap, vec3 reflectDir, float rotationOffset) {
//     reflectDir = calcEnvMapSampleDir(reflectDir, rotationOffset);
//     // reflectDir.x *= -1.;
//     // float c = cos(3.14 + rotationOffset);
//     // float s = sin(3.14 + rotationOffset);
//     // reflectDir.xz *= mat2(c, s, -s, c);
//     
//     // return texture(envMap, reflectDir).xyz;
//     return textureLod(envMap, reflectDir, 0.).xyz;
// }

// #endif
