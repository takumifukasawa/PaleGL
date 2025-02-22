#pragma DEFINES

#include <lighting>
#include <ub>
#include <tone>
#include <gbuffer>
#include <env_map>

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

uniform samplerCube uCubeTexture;
uniform float uRotationOffset;
uniform int uShadingModelId;

#include <gbuffer_o>

void main() {
    // pattern_1: inverse normal. 法線が内側を向いた球体なので
    vec3 N = normalize(vNormal);
    vec3 reflectDir = -N;
    
    // pattern_2: world position dir
    // skyboxの中心 = カメラの中心なので、こちらでもよい
    // vec3 reflectDir = normalize(vWorldPosition - uViewPosition);
    
    // USE_ENV_MAP が定義されているシェーダーなのでこの関数はあるはず
    vec3 skyboxSampleDir = calcEnvMapSampleDir(reflectDir, uRotationOffset);
    // vec3 envMapColor = calcEnvMap(uCubeTexture);
    // vec3 envMapColor = texture(uCubeTexture, skyboxSampleDir).xyz;
    vec3 envMapColor = textureLod(uCubeTexture, skyboxSampleDir, 0.).xyz;
  
    // NOTE: テクスチャはhdrじゃなくてsrgb想定 
    envMapColor = gamma(envMapColor); 
        
    // outGBufferA = vec4(envMapColor, 1.);
    // outGBufferB = vec4(0., 0., 0., 1.);
    // outGBufferC = vec4(0., 0., 0., 1.);
    outGBufferA = EncodeGBufferA(envMapColor);
    outGBufferB = EncodeGBufferB(vec3(0.), uShadingModelId);
    outGBufferC = EncodeGBufferC(0., 0.);
    outGBufferD = EncodeGBufferD(vec3(0.));
}
