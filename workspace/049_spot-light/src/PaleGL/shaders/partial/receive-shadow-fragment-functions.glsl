// ref:
// https://matcha-choco010.net/2020/04/10/opengl-deferred-spot-light-shadow/
// https://www.opengl-tutorial.org/jp/intermediate-tutorials/tutorial-16-shadow-mapping/
vec4 applyShadow(
    vec4 surfaceColor,
    vec3 worldPosition,
    mat4 shadowMapMatrix,
    mat4 shadowMapLightViewProjectionMatrix,
    sampler2D shadowMap,
    vec4 shadowMapUv,
    float shadowBias,
    vec4 shadowColor,
    float shadowBlendRate
) {
    vec4 lightPos = shadowMapLightViewProjectionMatrix * vec4(worldPosition, 1.);
    vec2 uv = lightPos.xy / lightPos.w * vec2(.5) + vec2(.5);
    float depthFromWorldPos = (lightPos.z / lightPos.w) * .5 + .5;
   
    vec3 uvc = vec3(uv, depthFromWorldPos + .001);
    float readDepth = textureProj(shadowMap, uvc).r;
    
    float shadowAreaRect =
        step(0., uv.x) * (1. - step(1., uv.x)) *
        step(0., uv.y) * (1. - step(1., uv.y)) *
        step(0., depthFromWorldPos) * (1. - step(1., depthFromWorldPos));
 
    float isShadow = readDepth < (lightPos.z / lightPos.w) ? 1. : 0.;
    
    // for debug
    vec3 color = mix(
        vec3(0., 0., 1.),
        vec3(1., 0., 0.),
        isShadow
        // 1. - step(.999, shadow)
    );
    
    // return vec4(vec3(uv.xy, 1.) * shadowAreaRect, 1.);
    // return vec4(vec3(shadow * shadowAreaRect), 1.);
    return vec4(vec3(color * shadowAreaRect), 1.);


    // vec4 rawShadowCoord = shadowMapMatrix * vec4(worldPosition, 1.);
    // vec3 shadowCoord = rawShadowCoord.xyz / rawShadowCoord.w;
    // // float shadowCoordDepth = shadowCoord.z; // 0 ~ 1
    // 
    // // float sampledDepth = texture(shadowMap, shadowCoord.xy).r;
    // float sampledDepth = texture(shadowMap, rawShadowCoord.xy / rawShadowCoord.w).r;
    // 
    // float shadowCoordDepth = (rawShadowCoord.z - .01) / rawShadowCoord.w;

    // float shadowAreaRect =
    //     step(0., shadowCoord.x) * (1. - step(1., shadowCoord.x)) *
    //     step(0., shadowCoord.y) * (1. - step(1., shadowCoord.y)) *
    //     step(0., shadowCoord.z) * (1. - step(1., shadowCoord.z));
   
    // float isShadow = sampledDepth < shadowCoordDepth ? 1. : 0.;
    // 
    // // return vec4(vec3(sampledDepth * shadowAreaRect), 1.);
    // return vec4(vec3(shadowCoordDepth * shadowAreaRect), 1.);

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
