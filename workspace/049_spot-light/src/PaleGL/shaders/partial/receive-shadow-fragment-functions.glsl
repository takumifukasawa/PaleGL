vec4 applyShadow(
    vec4 surfaceColor,
    vec3 worldPosition,
    mat4 shadowMapMatrix,
    sampler2D shadowMap,
    vec4 shadowMapUv,
    float shadowBias,
    vec4 shadowColor,
    float shadowBlendRate
) {
    
    vec4 rawShadowCoord = shadowMapMatrix * vec4(worldPosition, 1.);
    vec3 shadowCoord = rawShadowCoord.xyz / rawShadowCoord.w;
    // float shadowCoordDepth = shadowCoord.z; // 0 ~ 1
    
    // float sampledDepth = texture(shadowMap, shadowCoord.xy).r;
    float sampledDepth = texture(shadowMap, rawShadowCoord.xy / rawShadowCoord.w).r;
    
    float shadowCoordDepth = (rawShadowCoord.z - .01) / rawShadowCoord.w;

    float shadowAreaRect =
        step(0., shadowCoord.x) * (1. - step(1., shadowCoord.x)) *
        step(0., shadowCoord.y) * (1. - step(1., shadowCoord.y)) *
        step(0., shadowCoord.z) * (1. - step(1., shadowCoord.z));
   
    float isShadow = sampledDepth < shadowCoordDepth ? 1. : 0.;
    
    // return vec4(vec3(sampledDepth * shadowAreaRect), 1.);
    return vec4(vec3(shadowCoordDepth * shadowAreaRect), 1.);

    // tmp
    // vec3 projectionUv = shadowMapUv.xyz / shadowMapUv.w;
    // vec4 projectionShadowColor = texture(shadowMap, projectionUv.xy);
    // float sceneDepth = projectionShadowColor.r;
    // float depthFromLight = projectionUv.z;
    // // float shadowOccluded = clamp(step(0., depthFromLight - sceneDepth - .001), 0., 1.);
    // float shadowOccluded = clamp(step(0., depthFromLight - sceneDepth - shadowBias), 0., 1.);
    // float shadowAreaRect =
    //     step(0., projectionUv.x) * (1. - step(1., projectionUv.x)) *
    //     step(0., projectionUv.y) * (1. - step(1., projectionUv.y)) *
    //     step(0., projectionUv.z) * (1. - step(1., projectionUv.z));
    // float shadowRate = shadowOccluded * shadowAreaRect;

    // vec4 resultColor = vec4(1.);
    // resultColor.xyz = mix(
    //     surfaceColor.xyz,
    //     mix(surfaceColor.xyz, shadowColor.xyz, shadowBlendRate),
    //     // vec3(shadowOccluded),
    //     // vec3(step(depthFromLight, sceneDepth)),
    //     // shadowAreaRect
    //     shadowRate
    // );
    // resultColor.a = surfaceColor.a;
    
    return resultColor;
}
