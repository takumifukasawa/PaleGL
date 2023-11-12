// ref:
// https://github.com/mebiusbox/docs/blob/master/%EF%BC%93%E6%AC%A1%E5%85%83%E5%BA%A7%E6%A8%99%E5%A4%89%E6%8F%9B%E3%81%AE%E3%83%A1%E3%83%A2%E6%9B%B8%E3%81%8D.pdf
float viewZToLinearDepth(float z, float near, float far) {
    return (z + near) / (near - far);
}

float perspectiveDepthToLinearDepth(float rawDepth, float near, float far) {
    float nz = near * rawDepth;
    return -nz / (far * (rawDepth - 1.) - nz);
}

// view space に置ける絶対値（= カメラからの距離）
float perspectiveDepthToEyeDepth(float rawDepth, float near, float far) {
    float depth = perspectiveDepthToLinearDepth(rawDepth, near, far);
    return mix(near, far, depth);
}

// end ref

vec3 reconstructWorldPositionFromDepth(vec2 screenUV, float rawDepth, mat4 inverseViewProjectionMatrix) {
    // depth[0~1] -> clipZ[-1~1]
    vec4 clipPos = vec4(screenUV * 2. - 1., rawDepth * 2. - 1., 1.);
    vec4 worldPos = inverseViewProjectionMatrix * clipPos;
    return worldPos.xyz / worldPos.w;
}

vec3 reconstructViewPositionFromDepth(vec2 screenUV, float rawDepth, mat4 inverseProjectionMatrix) {
    // depth[0~1] -> clipZ[-1~1]
    vec4 clipPos = vec4(screenUV * 2. - 1., rawDepth * 2. - 1., 1.);
    vec4 viewPos = inverseProjectionMatrix * clipPos;
    return viewPos.xyz / viewPos.w;
}

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
