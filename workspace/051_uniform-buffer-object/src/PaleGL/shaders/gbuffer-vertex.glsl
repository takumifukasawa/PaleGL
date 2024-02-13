#version 300 es

precision highp float;

#pragma DEFINES

#pragma ATTRIBUTES

#pragma APPEND_ATTRIBUTES

#include ./partial/skinning-vertex-functions.glsl



// varyings
out vec2 vUv;
out vec3 vLocalPosition;
out vec3 vWorldPosition;
out vec3 vNormal;

#include ./partial/normal-map-vertex-varyings.glsl
#include ./partial/receive-shadow-vertex-varyings.glsl
#include ./partial/vertex-color-vertex-varyings.glsl

#include ./partial/uniform-block-transformations.glsl

// uniform mat4 uWorldMatrix;
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
        // 1., 0., 0., p.x,
        // 0., 1., 0., p.y,
        // 0., 0., 1., p.z,
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

mat4 getLookAtMat(vec3 lookAt, vec3 p) {
    vec3 f = normalize(lookAt - p);
    vec3 r = normalize(cross(vec3(0., 1., 0.), f));
    vec3 u = cross(f, r);
    return mat4(
        r.x, r.y, r.z, 0.,
        u.x, u.y, u.z, 0.,
        f.x, f.y, f.z, 0.,
        0., 0., 0., 1.
    );
}

void main() {

    #pragma BEGIN_MAIN

    vec4 localPosition = vec4(aPosition, 1.);

    #include ./partial/skinning-vertex-calc.glsl;
    
    #pragma LOCAL_POSITION_POST_PROCESS

    // assign common varyings 
    vUv = aUv;
    vLocalPosition = aPosition;

    mat4 worldMatrix = uWorldMatrix;
    
#ifdef USE_INSTANCING
    mat4 instanceTranslation = getTranslationMat(aInstancePosition);
    mat4 instanceScaling = getScalingMat(aInstanceScale.xyz);
    mat4 instanceRotationX = getRotationXMat(aInstanceRotation.x);
    mat4 instanceRotationY = getRotationYMat(aInstanceRotation.y);
    mat4 instanceRotationZ = getRotationZMat(aInstanceRotation.z);
    mat4 instanceRotation =
        instanceRotationY *
        instanceRotationX *
        instanceRotationZ;
    
// instanceごとのvelocityが必要なことに注意
#ifdef USE_INSTANCE_LOOK_DIRECTION
    instanceRotation = getLookAtMat(aInstancePosition + aInstanceVelocity * 1000., aInstancePosition);
#endif

    #pragma INSTANCE_TRANSFORM_PRE_PROCESS

    worldMatrix = uWorldMatrix * instanceTranslation * instanceRotation * instanceScaling;
#endif

    vec4 worldPosition = worldMatrix * localPosition;
    worldPosition.x += Hoge;

    #pragma WORLD_POSITION_POST_PROCESS

    vWorldPosition = worldPosition.xyz;

    #include ./partial/normal-map-vertex-calc.glsl;

    #include ./partial/receive-shadow-uv-calc.glsl
    
// NOTE: shader minify の時に p * v * w を直接入れないとなぜか掛ける順番がおかしくなる
//     vec4 viewPosition = uViewMatrix * worldPosition;
//  
//     #pragma VIEW_POSITION_POST_PROCESS
//  
//     #pragma OUT_CLIP_POSITION_PRE_PROCESS
//     
//     gl_Position = uProjectionMatrix * viewPosition;

    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
    
#if defined(USE_INSTANCING) && defined(USE_VERTEX_COLOR)
    vVertexColor = aInstanceVertexColor;
#endif

    #pragma END_MAIN
}
