#version 300 es

precision mediump float;

#pragma DEFINES

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

uniform samplerCube uCubeTexture;
uniform vec3 uViewPosition;
uniform mat4 uViewDirectionProjectionInverse;
uniform float uRotationOffset;

// out vec4 outColor;
layout (location = 0) out vec4 outBaseColor;
layout (location = 1) out vec4 outNormalColor;

#include ./partial/env-map-fragment-functions.glsl

void main() {
    // pattern_1: inverse normal
    vec3 N = normalize(vNormal);
    vec3 reflectDir = -N;
    
    // pattern_2: world position dir
    // skyboxの中心 = カメラの中心なので、こちらでもよい
    // vec3 reflectDir = normalize(vWorldPosition - uViewPosition);
    
    // USE_ENV_MAP が定義されているシェーダーなのでこの関数はあるはず
    vec3 envMapColor = calcEnvMap(uCubeTexture, reflectDir, uRotationOffset);
    
    // outColor = textureColor;
    outBaseColor = vec4(envMapColor, 1.);
    outNormalColor = vec4(0., 0., 0., 1.);
}
