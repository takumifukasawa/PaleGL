// base: raymarch-scene-functions.partial.glsl
vec2 fObjectSpaceDfScene(
    vec3 worldPos, mat4 WtoO, vec3 scale, float useWorld,
    // ---   
    vec3 pelvisPosition,
    vec3 pelvisRotation,
    vec3 spine1Rotation,
    vec3 spine2Rotation,
    vec3 leftShoulderRotation,
    vec3 leftElbowRotation,
    vec3 rightShoulderRotation,
    vec3 rightElbowRotation,
    vec3 leftHipRotation,
    vec3 leftKneeRotation,
    vec3 rightHipRotation,
    vec3 rightKneeRotation,
    vec3 neckRotation,
    vec3 leftWristRotation,
    vec3 rightWristRotation
    // --- 
) {
    // scale = vec3(1.);
    vec3 p = mix(
        fToLocal(worldPos, WtoO, scale),
        worldPos,
        useWorld
    );
    return fDfScene(
        p,
        // ---   
        pelvisPosition,
        pelvisRotation,
        spine1Rotation,
        spine2Rotation,
        leftShoulderRotation,
        leftElbowRotation,
        rightShoulderRotation,
        rightElbowRotation,
        leftHipRotation,
        leftKneeRotation,
        rightHipRotation,
        rightKneeRotation,
        neckRotation,
        leftWristRotation,
        rightWristRotation
        // ---    
    );
}


vec3 fGetNormalObjectSpaceDfScene(
    vec3 p, mat4 WtoO, vec3 scale, float useWorld,
    // ---   
    vec3 pelvisPosition,
    vec3 pelvisRotation,
    vec3 spine1Rotation,
    vec3 spine2Rotation,
    vec3 leftShoulderRotation,
    vec3 leftElbowRotation,
    vec3 rightShoulderRotation,
    vec3 rightElbowRotation,
    vec3 leftHipRotation,
    vec3 leftKneeRotation,
    vec3 rightHipRotation,
    vec3 rightKneeRotation,
    vec3 neckRotation,
    vec3 leftWristRotation,
    vec3 rightWristRotation
    // --- 
) {
    // // tmp
    // const float eps = .0001;
    // vec3 n = vec3(
    //     fObjectSpaceDfScene(p + vec3(eps, 0, 0), WtoO, scale, useWorld).x - fObjectSpaceDfScene(p + vec3(-eps, 0, 0), WtoO, scale, useWorld).x,
    //     fObjectSpaceDfScene(p + vec3(0, eps, 0), WtoO, scale, useWorld).x - fObjectSpaceDfScene(p + vec3(0, -eps, 0), WtoO, scale, useWorld).x,
    //     fObjectSpaceDfScene(p + vec3(0, 0, eps), WtoO, scale, useWorld).x - fObjectSpaceDfScene(p + vec3(0, 0, -eps), WtoO, scale, useWorld).x
    // );
    // return normalize(n);

    // 軽量版
    // ref: https://x.com/Shiranui_Isuzu_/status/1074492632179474432?s=20
    const float d = .0001;
    vec3 n = vec3(0., 0., 0.);
    for (int i = 0; i < 4; i++)
    {
        vec3 e = .5773 * (2. * vec3(
            (((i + 3) >> 1) & 1),
            ((i >> 1) & 1),
            (i & 1)) - 1.
        );
        n += e * fObjectSpaceDfScene(
            p + e * d, WtoO, scale, useWorld,
            // ---   
            pelvisPosition,
            pelvisRotation,
            spine1Rotation,
            spine2Rotation,
            leftShoulderRotation,
            leftElbowRotation,
            rightShoulderRotation,
            rightElbowRotation,
            leftHipRotation,
            leftKneeRotation,
            rightHipRotation,
            rightKneeRotation,
            neckRotation,
            leftWristRotation,
            rightWristRotation
            // --- 
        ).x;
    }
    return normalize(n);
}



// base: object-space-raymarch-fragment-functions.partial.glsl
vec2 fOsRaymarch(
    vec3 rayOrigin,
    vec3 rayDirection,
    float minDistance,
    mat4 viewMatrix,
    mat4 projectionMatrix,
    mat4 inverseWorldMatrix,
    float side,
    vec3 boundsScale,
    float useWorld,
    bool useDiscard,
    // ---   
    vec3 pelvisPosition,
    vec3 pelvisRotation,
    vec3 spine1Rotation,
    vec3 spine2Rotation,
    vec3 leftShoulderRotation,
    vec3 leftElbowRotation,
    vec3 rightShoulderRotation,
    vec3 rightElbowRotation,
    vec3 leftHipRotation,
    vec3 leftKneeRotation,
    vec3 rightHipRotation,
    vec3 rightKneeRotation,
    vec3 neckRotation,
    vec3 leftWristRotation,
    vec3 rightWristRotation,
    // ---   
    out vec3 currentRayPosition
) {
    vec2 result = vec2(0.);
    float accLen = 0.;
   
    currentRayPosition = rayOrigin;

    for (int i = 0; i < OI; i++) {
        currentRayPosition = rayOrigin + rayDirection * accLen;
        result = fObjectSpaceDfScene(
            currentRayPosition, inverseWorldMatrix, boundsScale, useWorld,
            // ---
            pelvisPosition,
            pelvisRotation,
            spine1Rotation,
            spine2Rotation,
            leftShoulderRotation,
            leftElbowRotation,
            rightShoulderRotation,
            rightElbowRotation,
            leftHipRotation,
            leftKneeRotation,
            rightHipRotation,
            rightKneeRotation,
            neckRotation,
            leftWristRotation,
            rightWristRotation
            // ---
        ) * side;
        accLen += result.x;
        if (!fIsDfInnerBox(fToLocal(currentRayPosition, inverseWorldMatrix, boundsScale), boundsScale)) {
            break;
        }
        if (result.x <= minDistance) {
            break;
        }
    }

    if (result.x > minDistance && useDiscard) {
        discard;
    }

    // depthを上書き
    vec4 rayClipPosition = projectionMatrix * viewMatrix * vec4(currentRayPosition, 1.);
    float newDepth = (rayClipPosition.z / rayClipPosition.w) * .5 + .5;
    gl_FragDepth = newDepth;
    
    return result;
}
