
uniform sampler2D uDepthTexture;

// ref:
// https://github.com/mebiusbox/docs/blob/master/%EF%BC%93%E6%AC%A1%E5%85%83%E5%BA%A7%E6%A8%99%E5%A4%89%E6%8F%9B%E3%81%AE%E3%83%A1%E3%83%A2%E6%9B%B8%E3%81%8D.pdf

// ビュー座標系のzを0~1の範囲に変換
float viewZToLinearDepth(float z, float near, float far) {
    return (z + near) / (near - far);
}

// ビュー座標系のzを深度値に変換
float viewZToPerspectiveDepth(float viewZ, float near, float far) {
    return((near + viewZ) * far) / ((far - near) * viewZ);
}

// 深度値を0~1に変換
float perspectiveDepthToLinearDepth(float rawDepth, float near, float far) {
    float nz = near * rawDepth;
    return -nz / (far * (rawDepth - 1.) - nz);
}

// ビュー座標系に置ける絶対値（= カメラからの距離）
float perspectiveDepthToEyeDepth(float rawDepth, float near, float far) {
    float depth = perspectiveDepthToLinearDepth(rawDepth, near, far);
    return mix(near, far, depth);
}

// end ref

float ndcZToRawDepth(float ndcZ) {
    return ndcZ * .5 + .5;
}

float ndcZToLinearDepth(float ndcZ, float near, float far) {
    float rawDepth = ndcZToRawDepth(ndcZ);
    return perspectiveDepthToLinearDepth(rawDepth, near, far);
}

float clipPositionToLinearDepth(vec4 clipPosition, float near, float far) {
    float z = clipPosition.z / clipPosition.w; // -1 ~ 1
    return ndcZToLinearDepth(z, near, far);
}

// 深度値からワールド座標を復元
vec3 reconstructWorldPositionFromDepth(vec2 screenUV, float rawDepth, mat4 inverseViewProjectionMatrix) {
    // depth[0~1] -> clipZ[-1~1]
    vec4 clipPos = vec4(screenUV * 2. - 1., rawDepth * 2. - 1., 1.);
    vec4 worldPos = inverseViewProjectionMatrix * clipPos;
    return worldPos.xyz / worldPos.w;
}

// 深度値からビュー座標を復元
vec3 reconstructViewPositionFromDepth(vec2 screenUV, float rawDepth, mat4 inverseProjectionMatrix) {
    // depth[0~1] -> clipZ[-1~1]
    vec4 clipPos = vec4(screenUV * 2. - 1., rawDepth * 2. - 1., 1.);
    vec4 viewPos = inverseProjectionMatrix * clipPos;
    return viewPos.xyz / viewPos.w;
}

// 深度テクスチャとビュー座標から、深度をフェッチ
float sampleRawDepthByViewPosition(
    sampler2D depthTexture,
    vec3 viewPosition,
    mat4 projectionMatrix,
    vec3 offset
) {
    vec4 offsetPosition = vec4(viewPosition + offset, 1.);
    vec4 projectedPosition = projectionMatrix * offsetPosition;
    vec3 projectedPositionNDC = projectedPosition.xyz / projectedPosition.w;
    vec2 projectedPositionUV = projectedPositionNDC.xy * .5 + .5;
    // return texture(depthTexture, projectedPositionUV).x;
    return textureLod(depthTexture, projectedPositionUV, 0.).x;
}
