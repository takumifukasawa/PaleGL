#pragma DEFINES

#include <common>
#include <lighting>
#include <ub>
#include <tone>
#include <depth>
#include <alpha_test>
#include <vcolor_fh>

#ifdef USE_INSTANCING
in float vInstanceId;
in vec4 vInstanceColor;
in vec4 vInstanceEmissiveColor;
in vec4 vInstanceState;
#endif

#pragma BLOCK_BEFORE_RAYMARCH_CONTENT

#include <raymarch_df>

// #pragma BLOCK_RAYMARCH_SCENE
#pragma RAYMARCH_SCENE

#include <raymarch_sf>
#include <os_raymarch_f>
#include <geometry_h>
#include <skybox_h>

uniform vec4 uBaseColor;
uniform sampler2D uBaseMap;
uniform vec4 uBaseMapTiling;
uniform vec4 uEmissiveColor;
uniform int uShadingModelId;

#pragma APPEND_UNIFORMS

uniform float uIsPerspective;
uniform float uUseWorld;
uniform vec3 uBoundsScale;

uniform sampler2D uSceneTexture;

in vec2 vUv;

in vec3 vLocalPosition;
in mat4 vWorldMatrix;
in vec3 vWorldPosition;
in mat4 vInverseWorldMatrix;

out vec4 outColor;

mat2 rot2(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
}

void main() {
    vec4 resultColor = uBaseColor * vec4(0.);

    vec2 uv = vUv * uBaseMapTiling.xy + uBaseMapTiling.zw;

    vec4 baseMapColor = texture(uBaseMap, uv);
    vec4 baseColor = uBaseColor * baseMapColor;

#ifdef USE_VERTEX_COLOR
    baseColor *= vVertexColor;
#endif
    
    vec3 emissiveColor = uEmissiveColor.rgb;
#ifdef USE_INSTANCING
    emissiveColor = vInstanceEmissiveColor.xyz; // demo用に頂点シェーダー側でblend
#endif

    //
    // NOTE: raymarch block
    //

    vec3 wp = vWorldPosition;
    vec3 currentRayPosition = wp;
    vec3 rayDirection = getOSRaymarchViewRayDirection(currentRayPosition, uViewPosition, uIsPerspective);

    vec2 result = osRaymarch(
        wp,
        rayDirection,
        EPS,
        uViewMatrix,
        uProjectionMatrix,
        vInverseWorldMatrix,
        1.,
        uBoundsScale,
        uUseWorld,
        true,
        currentRayPosition
    );
   
    // TODO: unlitでもopaqueの場合は必要なので出し分けたい
    // checkDiscardByCompareRayDepthAndSceneDepth(
    //     currentRayPosition,
    //     uDepthTexture,
    //     uNearClip,
    //     uFarClip,
    //     uViewMatrix
    // );

    resultColor = baseColor;
   
    vec2 screenUv = gl_FragCoord.xy / uViewport.xy;
    resultColor = texture(uSceneTexture, screenUv);
    
    vec3 resultBackBufferColor = vec3(0.);
    vec3 reflTex = vec3(0.);
    
    float ior = 1.45;
    float rayIORShift = .015;
    float uvIORShiftBase = .002;
    float uvIORShiftPower = .05;
    float specBlendRate = .25;
    
    if(result.x > 0.) {
        // 物体表面の位置
        vec3 p = currentRayPosition;
        // 物体表面の法線
        vec3 n = getNormalObjectSpaceDfScene(
            p,
            vInverseWorldMatrix,
            uBoundsScale,
            uUseWorld
        );
        // // 物体表面の反射したベクトル
        // vec3 r = reflect(rayDirection, n);
        // 物体表面から侵入するベクトル
        vec3 rdIn = refract(rayDirection, n, 1. / ior);
     
        // 侵入位置を少しだけ物体内側から開始する
        vec3 pEnter = p - n * EPS * 3.;
        // 侵入位置からraymarchする
        vec2 dIn = osRaymarch(
            pEnter,
            rdIn,
            EPS,
            uViewMatrix,
            uProjectionMatrix,
            vInverseWorldMatrix,
            -1.,
            uBoundsScale,
            uUseWorld,
            false,
            p
        );
       
        // 衝突位置
        vec3 pExit = p;
        // vec3 pExit = pEnter + rdIn * dIn.y;
        // 衝突位置の法線: 物体の内側を向く
        vec3 nExit = -getNormalObjectSpaceDfScene(
            pExit,
            vInverseWorldMatrix,
            uBoundsScale,
            uUseWorld
        );
       
        vec2 reflUv = screenUv;
        vec3 envSpecularDir = vec3(0.);
        vec3 rdOut = vec3(0.);
        float angleInOut = 0.;
        float reflUvDir = 0.;

        // red
        // 物体内側から屈折して外側に出るベクトル
        rdOut = refract(rdIn, nExit, ior - rayIORShift);
        // 物体内部に全反射するケース
        if(dot(rdOut, rdOut) == 0.) {
            rdOut = reflect(rdIn, nExit);
        }
        // 1: backbufferを使う場合
        reflUv = screenUv;
        // if(rdOut.x > 0.) {
            // reflUv.x = 1. - reflUv.x;
        // }
        // if(rdOut.y > 0.) {
            // reflUv.y = 1. - reflUv.y;
        // }
        // reflUv += rdOut.xy * ior * uvIORShift * vec2(1., 0.);
        angleInOut = acos(dot(rdIn, rdOut));
        reflUvDir = sign(dot(rdOut, n));
        // reflUv += (rdOut.xy * uvIORShiftPower + uvIORShiftBase) * ior * vec2(1., 1.) * length(diffInOut);
        // reflUv += uvIORShiftPower * ior * angleInOut + uvIORShiftBase;
        reflUv -= .5;
        reflUv *= rot2(uvIORShiftPower * ior * angleInOut * reflUvDir);
        reflUv += .5;
        reflUv += uvIORShiftBase;
        // 2: skyboxを使う場合
        envSpecularDir = calcEnvMapSampleDir(rdOut, uSkybox.rotationOffset);
        resultBackBufferColor.r = texture(uSceneTexture, reflUv).r;
        reflTex.r = textureLod(uSkybox.cubeMap, envSpecularDir, 0.).r;

        // green
        // 物体内側から屈折して外側に出るベクトル
        rdOut = refract(rdIn, nExit, ior);
        // 物体内部に全反射するケース
        if(dot(rdOut, rdOut) == 0.) {
            rdOut = reflect(rdIn, nExit);
        }
        // 1: backbufferを使う場合
        reflUv = screenUv;
        // if(rdOut.x > 0.) {
            // reflUv.x = 1. - reflUv.x;
        // }
        // if(rdOut.y > 0.) {
            // reflUv.y = 1. - reflUv.y;
        // }
        angleInOut = acos(dot(rdIn, rdOut));
        reflUvDir = sign(dot(rdOut, n));
        // reflUv -= (rdOut.xy * uvIORShiftPower + uvIORShiftBase) * ior * vec2(1., 1.) * length(diffInOut);
        reflUv -= .5;
        reflUv *= rot2(uvIORShiftPower * ior * angleInOut * reflUvDir);
        reflUv += .5;
        // 2: skyboxを使う場合
        envSpecularDir = calcEnvMapSampleDir(rdOut, uSkybox.rotationOffset);
        resultBackBufferColor.g = texture(uSceneTexture, reflUv).g;
        reflTex.g = textureLod(uSkybox.cubeMap, envSpecularDir, 0.).g;

        // blue
        // 物体内側から屈折して外側に出るベクトル
        rdOut = refract(rdIn, nExit, ior + rayIORShift);
        // 物体内部に全反射するケース
        if(dot(rdOut, rdOut) == 0.) {
            rdOut = reflect(rdIn, nExit);
        }
        // 1: backbufferを使う場合
        reflUv = screenUv;
        // if(rdOut.x > 0.) {
            // reflUv.x = 1. - reflUv.x;
        // }
        // if(rdOut.y > 0.) {
            // reflUv.y = 1. - reflUv.y;
        // }
        // reflUv -= rdOut.xy * ior * uvIORShift * vec2(1., 0.);
        angleInOut = acos(dot(rdIn, rdOut));
        reflUvDir = sign(dot(rdOut, n));
        // reflUv -= (rdOut.xy * uvIORShiftPower + uvIORShiftBase) * ior * vec2(1., 1.) * length(diffInOut);
        reflUv -= .5;
        reflUv *= rot2(uvIORShiftPower * ior * angleInOut * reflUvDir);
        reflUv += .5;
        reflUv += uvIORShiftBase;
        // 2: skyboxを使う場合
        envSpecularDir = calcEnvMapSampleDir(rdOut, uSkybox.rotationOffset);
        resultBackBufferColor.b = texture(uSceneTexture, reflUv).b;
        reflTex.b = textureLod(uSkybox.cubeMap, envSpecularDir, 0.).b;

        resultColor.xyz = vec3(dIn.x) * 0.; // これがないとなぜか2回反射がされない
        // resultColor.xyz = reflTex;
    }

    float alpha = resultColor.a;
    #include <alpha_test_f>

    resultColor.rgb = mix(
        resultBackBufferColor,
        gamma(reflTex),
        specBlendRate
    );
    
    #pragma BEFORE_OUT
    
    outColor = resultColor;

    #pragma AFTER_OUT
}
