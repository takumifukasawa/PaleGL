vec2 osRaymarch(
    vec3 rayOrigin,
    float minDistance,
    vec3 viewPosition,
    mat4 viewMatrix,
    mat4 projectionMatrix,
    mat4 inverseWorldMatrix,
    vec3 boundsScale,
    float useWorld,
    float isPerspective,
    out vec3 currentRayPosition
) {
    vec3 rayDirection = isPerspective > .5
        ? normalize(rayOrigin - viewPosition)
        : normalize(-viewPosition);

    vec2 result = vec2(0.);
    float accLen = 0.;
   
    currentRayPosition = rayOrigin;

    for (int i = 0; i < OI; i++) {
        currentRayPosition = rayOrigin + rayDirection * accLen;
        result = objectSpaceDfScene(currentRayPosition, inverseWorldMatrix, boundsScale, useWorld);
        accLen += result.x;
        if (!isDfInnerBox(toLocal(currentRayPosition, inverseWorldMatrix, boundsScale), boundsScale)) {
            break;
        }
        if (result.x <= minDistance) {
            break;
        }
    }

    if (result.x > minDistance) {
        discard;
    }

    // depthを上書き
    vec4 rayClipPosition = projectionMatrix * viewMatrix * vec4(currentRayPosition, 1.);
    float newDepth = (rayClipPosition.z / rayClipPosition.w) * .5 + .5;
    gl_FragDepth = newDepth;
    
    return result;
}

// 既存の深度値と比較して、奥にある場合は破棄する
void checkDiscardByCompareRayDepthAndSceneDepth(
    vec3 currentRayPosition,
    sampler2D depthTexture,
    float nearClip,
    float farClip,
    mat4 viewMatrix
) {
    // 既存の深度値と比較して、奥にある場合は破棄する
    float rawDepth = texelFetch(depthTexture, ivec2(gl_FragCoord.xy), 0).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, nearClip, farClip);
    vec4 currentRayViewPosition = (viewMatrix * vec4(currentRayPosition, 1.));
    float currentDepth = viewZToLinearDepth(currentRayViewPosition.z, nearClip, farClip);
    if(currentDepth >= sceneDepth) {
        discard;
    }
}
