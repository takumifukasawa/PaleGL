#include <common>
#include <rand>

in vec2 vUv;

uniform sampler2D uSrcMap;
uniform float uParallaxScale;
uniform float uNormalScale;
uniform vec2 uTexelSize;
out vec4 outColor;

// ref: https://esprog.hatenablog.com/entry/2016/10/24/183733
void main() {

    // // --- tmp
    // 
    // vec2 shiftX = vec2(uTexelSize.x, 0);
    // vec2 shiftY = vec2(0, uTexelSize.y);
    // 
    // shiftX *= uParallaxScale * uNormalScale;
    // shiftY *= uParallaxScale * uNormalScale;
    // vec2 uv = vUv;
    // 
    // vec3 texPx = vec3(texture(uSrcMap, uv + shiftX).r);
    // vec3 texNx = vec3(texture(uSrcMap, uv - shiftX).r);
    // vec3 texPz = vec3(texture(uSrcMap, uv + shiftY).r);
    // vec3 texNz = vec3(texture(uSrcMap, uv - shiftY).r);
    // 
    // // // 勾配を計算 
    // vec3 du = vec3(1., 0., uNormalScale) * (texPx - texNx);
    // vec3 dv = vec3(0., 1., uNormalScale) * (texPz - texNz);
    // 
    // vec3 n = normalize(cross(du, dv));
    // 
    // outColor = vec4(n, 1.0);
    // // outColor = vec4(du, 1.);
    // 
    // // debug
    // // outColor = texelFetch(uSrcMap, coord, 0);
    // 
    // // --- end tmp

    vec2 texel = uTexelSize;
    vec2 uv = vUv;

    // 4つの隣接ピクセルの高さを取得
    float hL = texture(uSrcMap, uv + vec2(-texel.x, 0)).r;
    float hR = texture(uSrcMap, uv + vec2(texel.x, 0)).r;
    float hD = texture(uSrcMap, uv + vec2(0, -texel.y)).r;
    float hU = texture(uSrcMap, uv + vec2(0, texel.y)).r;

    // 勾配から法線ベクトルを計算
    vec3 normal = normalize(vec3(hL - hR, hD - hU, uParallaxScale * uNormalScale));

    outColor = vec4(normal * 0.5 + 0.5, 1.0);
   
}
