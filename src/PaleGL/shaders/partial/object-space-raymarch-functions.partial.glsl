vec2 osRaymarch(
    vec3 rayOrigin,
    vec3 rayDirection,
    float minDistance,
    mat4 projectionMatrix,
    mat4 viewMatrix,
    mat4 inverseWorldMatrix,
    vec3 boundsScale,
    float useWorld,
    out vec3 currentRayPosition
) {
    vec2 result = vec2(0.);
    float accLen = 0.;

    for(int i = 0; i < OI; i++) {
        currentRayPosition = rayOrigin + rayDirection * accLen;
        result = objectSpaceDfScene(currentRayPosition, inverseWorldMatrix, boundsScale, useWorld);
        accLen += result.x;
        if(!isDfInnerBox(toLocal(currentRayPosition, inverseWorldMatrix, boundsScale), boundsScale)) {
            break;
        }
        if(result.x <= minDistance) {
            break;
        }
    }

    if(result.x > minDistance) {
        discard;
    }

    // depthを上書き
    vec4 rayClipPosition = projectionMatrix * viewMatrix * vec4(currentRayPosition, 1.);
    float newDepth = (rayClipPosition.z / rayClipPosition.w) * .5 + .5;
    gl_FragDepth = newDepth;
    
    return result;
}
