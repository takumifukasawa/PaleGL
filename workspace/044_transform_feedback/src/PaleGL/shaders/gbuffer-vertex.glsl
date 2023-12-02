#version 300 es

#pragma DEFINES

#pragma ATTRIBUTES

#pragma APPEND_ATTRIBUTES

#include ./partial/skinning-vertex-functions.glsl

// varyings
out vec2 vUv;
out vec3 vWorldPosition;
out vec3 vNormal;

#include ./partial/normal-map-vertex-varyings.glsl
#include ./partial/receive-shadow-vertex-varyings.glsl
#include ./partial/vertex-color-vertex-varyings.glsl

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;
uniform float uTime;

#pragma APPEND_UNIFORMS
        
#include ./partial/receive-shadow-vertex-uniforms.glsl
#include ./partial/skinning-vertex-uniforms.glsl


mat4 getRotationXMat(float rad) {
    float c = cos(rad);
    float s = sin(rad);
    // 行オーダー
    return mat4(
        // 行オーダー
        // 1., 0., 0., 0.,
        // 0., c, -s, 0.,
        // 0., s, c, 0.,
        // 0., 0., 0., 1.
        // 列オーダー
        1., 0., 0., 0.,
        0., c, s, 0.,
        0., -s, c, 0.,
        0., 0., 0., 1.
    );
}

mat4 getRotationYMat(float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat4(
        // 行オーダー
        // c, 0., s, 0.,
        // 0., 1., 0., 0.,
        // -s, 0., c, 0.,
        // 0., 0., 0., 1.
        // 列オーダー
        c, 0., -s, 0.,
        0., 1., 0., 0.,
        s, 0., c, 0.,
        0., 0., 0., 1.
    );
}

mat4 getRotationZMat(float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat4(
        // 行オーダー
        // c, -s, 0., 0.,
        // s, c, 0., 0.,
        // 0., 0., 1., 0.,
        // 0., 0., 0., 1.
        // 列オーダー
        c, s, 0., 0.,
        -s, c, 0., 0.,
        0., 0., 1., 0.,
        0., 0., 0., 1.
    );
}

mat4 getTranslationMat(vec3 p) {
    return mat4(
        // 行オーダー
        // 1., 0., 0., aInstancePosition.x,
        // 0., 1., 0., aInstancePosition.y,
        // 0., 0., 1., aInstancePosition.z,
        // 0., 0., 0., 1
        // 列オーダー
        1., 0., 0., 0.,
        0., 1., 0., 0.,
        0., 0., 1., 0.,
        p.x, p.y, p.z, 1.
    );
}

mat4 getScalingMat(vec3 s) {
    return mat4(
        // 行オーダー / 列オーダー
        s.x, 0., 0., 0.,
        0., s.y, 0., 0.,
        0., 0., s.z, 0.,
        0., 0., 0., 1.
    );
}

void main() {

    #pragma BEGIN_MAIN

    vec4 localPosition = vec4(aPosition, 1.);

    #include ./partial/skinning-vertex-calc.glsl;
    
    #pragma LOCAL_POSITION_POST_PROCESS

    #include ./partial/normal-map-vertex-calc.glsl;

    // assign common varyings 
    vUv = aUv;

    vec4 worldPosition = uWorldMatrix * localPosition;

#ifdef USE_INSTANCING
    mat4 instanceTranslation = getTranslationMat(aInstancePosition);
    mat4 instanceScaling = getScalingMat(aInstanceScale.xyz);
    mat4 instanceRotationX = getRotationXMat(0.);
    mat4 instanceRotationY = getRotationYMat(0.);
    mat4 instanceRotationZ = getRotationZMat(0.);
    mat4 instanceTransform =
        instanceTranslation *
        instanceRotationY *
        instanceRotationX *
        instanceRotationZ *
        instanceScaling;
    
    // NOTE: 本当はworldMatrixをかける前の方がよい
    worldPosition = instanceTransform * worldPosition;
#endif

    #pragma WORLD_POSITION_POST_PROCESS
 
    vWorldPosition = worldPosition.xyz;

    #include ./partial/receive-shadow-uv-calc.glsl

    vec4 viewPosition = uViewMatrix * worldPosition;

    #pragma VIEW_POSITION_POST_PROCESS

    #pragma OUT_CLIP_POSITION_PRE_PROCESS
    
#if defined(USE_INSTANCING) && defined(USE_VERTEX_COLOR)
    vVertexColor = aInstanceVertexColor;
#endif
 
    gl_Position = uProjectionMatrix * viewPosition;

    #pragma END_MAIN
}
