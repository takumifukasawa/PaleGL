
#ifdef USE_ENV_MAP

vec3 calcEnvMap(samplerCube envMap, vec3 reflectDir, float rotationOffset) {
    reflectDir.x *= -1.;
    float c = cos(3.14 + rotationOffset);
    float s = sin(3.14 + rotationOffset);
    reflectDir.xz *= mat2(c, s, -s, c);
    return texture(envMap, reflectDir).xyz;
}

#endif
