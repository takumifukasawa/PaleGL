#version 300 es
            
precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uBlurTexture;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);
    vec4 blurColor = texture(uBlurTexture, vUv);
    outColor = blurColor;
}           

// #version 300 es
// 
// precision mediump float;
// 
// in vec2 vUv;
// 
// out vec4 outColor;
// 
// uniform sampler2D uSrcTexture;
// uniform sampler2D uLightShaftTexture;
// uniform sampler2D uBlurTexture;
// uniform vec2 uLightShaftTexelSize;
// 
// // float rand(vec2 co){
// //     return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
// // }
// 
// // TODO: blur前の light shaft texture でマスクするべき？
// 
// void main() {
//     vec4 sceneColor = texture(uSrcTexture, vUv);
//     float blurLightShaft = texture(uBlurTexture, vUv).r;
//     float lightShaft = texture(uLightShaftTexture, vUv).r;
// 
//     vec2 texelSize = uLightShaftTexelSize;
//     float lw0 = texture(uLightShaftTexture, vUv + vec2(texelSize.x * .5f, texelSize.y * .5f)).r;
//     float lw1 = texture(uLightShaftTexture, vUv + vec2(texelSize.x * .5f, texelSize.y * -.5f)).r;
//     float lw2 = texture(uLightShaftTexture, vUv + vec2(texelSize.x * -.5f, texelSize.y * .5f)).r;
//     float lw3 = texture(uLightShaftTexture, vUv + vec2(texelSize.x * -.5f, texelSize.y * -.5f)).r;
//     float lw = (lw0 + lw1 + lw2 + lw3) * .25;
// 
//     // vec3 shaftColor = vec3(1., 1., 1.);
//     vec3 shaftColor = vec3(1., 0., 0.);
// 
//     float blendRate = max(blurLightShaft, lightShaft);
//     // float blendRate = lightShaft;
//     // float blendRate = blurLightShaft;
// 
//     // vec3 color = mix(sceneColor.rgb, shaftColor, lw);
//     vec3 color = mix(sceneColor.rgb, shaftColor, blendRate);
// 
//     outColor = vec4(color, 1.);
//    
//     // // WIP: zoom blur
//     // 
//     // vec2 centerUv = vec2(.5);
//     // vec2 centerToCurrent = vUv - centerUv;
//     // float totalWeight = 0.;
//     // vec4 destColor = vec4(0.);
// 
//     // float strength = 4.;
//     // for(int i = 0; i <= 30; i++) {
//     //     float nflag = (1. / 30.);
//     //     float fi = float(i);
//     //     float per = (fi + rand(vUv)) * nflag;
//     //     float weight = per - per * per;
//     //     vec2 t = vUv + (-centerToCurrent * per * strength * nflag);
//     //     // destColor.xyz += texture(uSrcTexture, t * texelSize).xyz * weight;
//     //     destColor += texture(uSrcTexture, t) * weight;
//     //     totalWeight += weight;
//     // }
//     // 
//     // destColor /= totalWeight;
//     // 
//     // outColor = destColor;
// 
//     // for debug
//     // outColor = sceneColor;
//     // outColor = blurColor;
//     // outColor = vec4(vec3(alpha), 1.);
//     // outColor = texture(uShadowMap, vUv);
//     // outColor = sceneColor;
//     // outColor = vec4(vec3(lightShaft), 1.);
//     // outColor = vec4(rayDirInView, 1.);
//     // outColor = vec4(uAttenuationBase);
//     // outColor = sceneColor;
//     // outColor = vec4(vec3(eyeDepth), 1.);
//     // outColor = vec4(vec3(d), 1.);
// }
