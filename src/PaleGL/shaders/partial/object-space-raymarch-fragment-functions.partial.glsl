vec2 osRaymarch(
    vec3 rayOrigin,
    vec3 rayDirection,
    float minDistance,
    mat4 viewMatrix,
    mat4 projectionMatrix,
    mat4 inverseWorldMatrix,
    float side,
    vec3 boundsScale,
    float useWorld,
    out vec3 currentRayPosition
) {
    vec2 result = vec2(0.);
    float accLen = 0.;
   
    currentRayPosition = rayOrigin;

    for (int i = 0; i < OI; i++) {
        currentRayPosition = rayOrigin + rayDirection * accLen;
        result = objectSpaceDfScene(currentRayPosition, inverseWorldMatrix, boundsScale, useWorld) * side;
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

vec3 getOSRaymarchViewRayDirection(vec3 origin, vec3 viewPosition, float isPerspective) {
    return isPerspective > .5
        ? normalize(origin - viewPosition)
        : normalize(-viewPosition);
}
