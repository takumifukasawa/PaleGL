vec4 applyShadow(
    vec2 screenUv,
    vec4 surfaceColor,
    vec3 surfaceWorldPosition,
    vec3 lightPosition,
    sampler2D shadowMap,
    mat4 shadowCameraViewMatrix,
    mat4 shadowCameraProjectionMatrix,
    // mat4 shadowProjectionMatrix,
    mat4 shadowMatrix,
    mat4 lightInverserViewProjectionMatrix,
    vec4 shadowMapUv,
    mat4 textureMatrix,
    float shadowBias,
    float shadowCameraNearClip,
    float shadowCameraFarClip,
    vec4 shadowColor,
    float shadowBlendRate
) {
    vec4 surfaceLightPosition = shadowMatrix * vec4(surfaceWorldPosition, 1.);
    // vec2 uv = surfaceLightPosition.xy / surfaceLightPosition.w * .5 + .5;
    // float depthFromWorldPosiion = (surfaceLightPosition.z / surfaceLightPosition.w) * .5 + .5;
    vec2 uv = surfaceLightPosition.xy / surfaceLightPosition.w;
    float depthFromWorldPosiion = (surfaceLightPosition.z / surfaceLightPosition.w);
    float depth = texture(shadowMap, uv.xy).r;
    
    // vec3 wpFromSampleDepth = reconstructWorldPositionFromDepth(screenUv, depth, lightInverserViewProjectionMatrix);
    vec3 wpFromSampleDepth = reconstructWorldPositionFromDepth(screenUv, depthFromWorldPosiion, lightInverserViewProjectionMatrix);
    // vec3 wpFromSampleDepth = reconstructWorldPositionFromDepth(screenUv, depthFromWorldPosiion, lightInverserViewProjectionMatrix);
    vec4 vp = shadowCameraViewMatrix * vec4(surfaceWorldPosition, 1.);
    vec4 pp = shadowCameraProjectionMatrix * vp;
    
    float shadowAreaRect =
        step(0., uv.x) * (1. - step(1., uv.x)) *
        step(0., uv.y) * (1. - step(1., uv.y)) *
        step(0., depthFromWorldPosiion) * (1. - step(1., depthFromWorldPosiion));
        // step(0., uv.x) * (1. - step(1., uv.x)) *
        // step(0., uv.y) * (1. - step(1., uv.y));

    // depthFromWorldPosiion = 1. - step(.9, depthFromWorldPosiion);

    // return vec4(vec3(depthFromWorldPosiion * shadowAreaRect), 1.);
    // float isShadow = depth < depthFromWorldPosiion - .001 ? 1. : 0.;
    // return vec4(wpFromSampleDepth * shadowAreaRect, 1.);
    // return vec4(vp.xyz * shadowAreaRect, 1.);
    // return vec4(pp.xyz * shadowAreaRect, 1.);
    float z = pp.z / pp.w;
    z = step(.5, z);
    return vec4(vec3(vp * shadowAreaRect), 1.);
    // return vec4(vec3(isShadow * shadowAreaRect), 1.);
    // return vec4(vec3(depthFromWorldPosiion * shadowAreaRect) * shadowAreaRect, 1.);
    // return vec4(vec3(shadowAreaRect) * shadowAreaRect, 1.);

    /*
    vec3 projectionUv = shadowMapUv.xyz / shadowMapUv.w;
    // vec4 projectionUv4 = textureMatrix * vec4(projectionUv, 1.);
    // vec4 projectionUv4 = textureMatrix * vec4(projectionUv, 1.);
    projectionUv = projectionUv * .5 + .5;
    vec4 projectionShadowColor = texture(shadowMap, projectionUv.xy);
    float rawSceneDepth = projectionShadowColor.r; // 0~1
    float sceneDepth = perspectiveDepthToLinearDepth(
    // float sceneDepth = perspectiveDepthToEyeDepth(
        rawSceneDepth,
        // 1.,
        // 10.
        shadowCameraNearClip,
        shadowCameraFarClip
    );
    
    // float rawDepthFromLight = projectionUv.z;
    float rawDepthFromLight = shadowMapUv.z / shadowMapUv.w; // -1~1
    // rawDepthFromLight = rawDepthFromLight * .5 + .5; // 0~1
    float depthFromLight = perspectiveDepthToLinearDepth(
        rawDepthFromLight,
        shadowCameraNearClip,
        shadowCameraFarClip
    );
    float surfaceToLightDistance = length(surfaceWorldPosition - lightPosition);
    
    // float shadowOccluded = clamp(step(0., depthFromLight - sceneDepth - shadowBias), 0., 1.);
    // float shadowOccluded = depthFromLight + shadowBias > sceneDepth ? 1. : 0.;
    float shadowOccluded = depthFromLight - .001 > sceneDepth ? 1. : 0.;
    // float shadowOccluded = surfaceToLightDistance - .001 > sceneDepth ? 1. : 0.;
    float shadowAreaRect =
        step(0., projectionUv.x) * (1. - step(1., projectionUv.x)) *
        step(0., projectionUv.y) * (1. - step(1., projectionUv.y)) *
        step(0., projectionUv.z) * (1. - step(1., projectionUv.z));
    float shadowRate = shadowOccluded * shadowAreaRect;

    vec4 resultColor = vec4(1.);
    resultColor.xyz = mix(
        // surfaceColor.xyz,
        // mix(surfaceColor.xyz, shadowColor.xyz, shadowBlendRate),
        // shadowRate
    
    // // for debug
    vec3(0.),
    // vec3(1.),
    // vec3(step(.5, sceneDepth)),
    // vec3(sceneDepth),
    // vec3(step(.5, depthFromLight)),
    vec3(step(0., shadowMapUv.z / shadowMapUv.w)), // TODO: z / w が 1になっていそう
    // vec3(step(.5, rawSceneDepth)),
    // // sceneDepth * shadowAreaRect
    1. * shadowAreaRect
    // shadowOccluded
    // shadowAreaRect
    // shadowRate
    );
    // resultColor.xyz = vec3(shadowOccluded);
    resultColor.a = surfaceColor.a;
   
    // resultColor.xy = projectionUv.xy;
    // resultColor.z = 1.;
    // resultColor.xyz *= shadowAreaRect;
    
    return resultColor;
    */
}
