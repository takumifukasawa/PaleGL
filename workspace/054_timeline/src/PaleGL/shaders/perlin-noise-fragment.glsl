#version 300 es

precision highp float;

#include ./partial/effect-texture-header.glsl

uniform float uTiling;
uniform float uIsImproved;

float perlinNoise(vec2 p, float isImproved) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    // グリッドの格子のインデックス
    vec2 i00 = i;
    vec2 i10 = i + vec2(1., 0.);
    vec2 i01 = i + vec2(0., 1.);
    vec2 i11 = i + vec2(1., 1.);
   
    // [グリッドの格子の点 -> 現在の点] へのベクトル
    // 位置の差異
    vec2 p00 = f;
    vec2 p10 = f - vec2(1., 0.);
    vec2 p01 = f - vec2(0., 1.);
    vec2 p11 = f - vec2(1., 1.);
    
    // グリッドの格子の点のそれぞれの勾配
    // ランダムに決める
    vec2 g00 = normalize(rand2(i00));
    vec2 g10 = normalize(rand2(i10));
    vec2 g01 = normalize(rand2(i01));
    vec2 g11 = normalize(rand2(i11));

    // ランダムな勾配ベクトルと位置の差異ベクトルの内積
    float n00 = dot(g00, p00);
    float n10 = dot(g10, p10);
    float n01 = dot(g01, p01);
    float n11 = dot(g11, p11);
   
    // 補間 
    isImproved = step(.5, isImproved);
    float sx = mix(smooth(f.x), smooth5(f.x), isImproved);
    float sy = mix(smooth(f.y), smooth5(f.y), isImproved);
   
    // y=0でx間の補間 
    float mx0 = mix(n00, n10, sx);
    
    // y=1でx方向の補間 
    float mx1 = mix(n01, n11, sx);
   
    // y方向の補間
    return mix(mx0, mx1, sy);
}

void main() {
    vec2 resolution = uResolution;
    vec2 gridSize = uGridSize;
    vec2 uv = vUv;

    float result = perlinNoise(uv * gridSize + uTime, uIsImproved);

    outColor = vec4(vec3(result), 1.);
}
